'use strict';

const userRepo     = require('../../repositories/userRepo');
const apiKeyRepo   = require('../../repositories/apiKeyRepo');
const emailService = require('../../services/emailService');
const { ROLE_LIMITS } = require('../../utils/constants');

const VALID_ROLES = new Set(['free', 'premium', 'vip', 'admin']);

module.exports = {
  method:     'POST',
  path:       '/admin/role',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const { email, role, days } = req.body;

      if (!email || typeof email !== 'string')
        return res.status(400).json({ success: false, message: 'email is required' });
      if (!VALID_ROLES.has(role))
        return res.status(400).json({ success: false, message: 'role must be free, premium, vip, or admin' });

      const user = await userRepo.findByEmailAdmin(email.trim().toLowerCase());
      if (!user)
        return res.status(404).json({ success: false, message: 'No account found with that email' });

      const expiresAt = (role === 'admin' || role === 'free' || !days || Number(days) <= 0)
        ? null
        : new Date(Date.now() + Number(days) * 86_400_000);

      const grantedAt = new Date();

      await userRepo.updateRoleWithExpiry(user.id, role, expiresAt);
      await apiKeyRepo.updateTotalLimit(user.id, ROLE_LIMITS[role]);

      if (role !== 'free') {
        emailService.sendRoleUpgradeEmail(
          user.email, user.name, role, grantedAt, expiresAt
        ).catch(() => {});
      }

      res.json({
        success: true,
        message: `Role updated to ${role}`,
        data: {
          id:             user.id,
          email:          user.email,
          role,
          role_expires_at: expiresAt,
          role_granted_at: grantedAt,
          daily_limit:    ROLE_LIMITS[role],
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
