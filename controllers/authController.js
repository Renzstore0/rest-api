'use strict';

const authService     = require('../services/authService');
const emailService    = require('../services/emailService');
const userRepo        = require('../repositories/userRepo');
const turnstileService = require('../services/turnstileService');
const { getClientIp }  = require('../utils/keyLogger');

async function register(req, res) {
  try {
    const { name, email, password, token } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });
    if (!(await turnstileService.verify(token, getClientIp(req))))
      return res.status(403).json({ success: false, message: 'Verification failed. Please retry.' });
    await authService.registerUser(name, email, password);
    await emailService.sendOtpEmail(email);
    res.status(201).json({ success: true, message: 'Registered. Check your email for OTP.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password, token } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });
    if (!(await turnstileService.verify(token, getClientIp(req))))
      return res.status(403).json({ success: false, message: 'Verification failed. Please retry.' });
    const user = await authService.validateLogin(email, password);
    req.session.user        = user;
    req.session.otpVerified = true;
    res.json({ success: true, message: 'Signed in', user });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP required' });
    await authService.verifyUserOtp(email, otp);
    const user = await userRepo.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    req.session.user        = { id: user.id, name: user.name, email: user.email, role: user.role };
    req.session.otpVerified = true;
    res.json({ success: true, message: 'OTP verified', user: req.session.user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const user = await userRepo.findByEmail(email);
    if (user) await emailService.sendOtpEmail(email);
    res.json({ success: true, message: 'If an account exists for this email, a new code was sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function logout(req, res) {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Logged out' });
  });
}

async function me(req, res) {
  if (!req.session?.user)
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  res.json({ success: true, data: req.session.user });
}

async function changeName(req, res) {
  try {
    if (!req.session?.user)
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    const { name } = req.body;
    if (!name || name.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    const trimmed = name.trim().slice(0, 100);
    await userRepo.updateName(req.session.user.id, trimmed);
    req.session.user.name = trimmed;
    res.json({ success: true, message: 'Name updated', data: { name: trimmed } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { register, login, verifyOtp, resendOtp, logout, me, changeName };
