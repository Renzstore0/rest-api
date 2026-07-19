'use strict';

const userRepo   = require('../../repositories/userRepo');
const apiKeyRepo = require('../../repositories/apiKeyRepo');

const ROLE_LIMITS = { free: 100, premium: 1000, vip: 5000, admin: 999999 };

module.exports = {
  method:     'POST',
  path:       '/admin/apikey/create',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const email = req.body?.email?.trim().toLowerCase();
      if (!email) return res.status(400).json({ success: false, message: 'email is required' });

      const user = await userRepo.findByEmailAdmin(email);
      if (!user) return res.status(404).json({ success: false, message: 'No account found with that email' });

      const existing = await apiKeyRepo.findByUserId(user.id);
      if (existing) return res.status(409).json({ success: false, message: 'User already has an API key' });

      const key = await apiKeyRepo.createKey(user.id, ROLE_LIMITS[user.role] ?? 100);
      res.json({ success: true, data: key });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
