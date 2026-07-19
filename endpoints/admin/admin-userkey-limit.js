'use strict';

const userRepo   = require('../../repositories/userRepo');
const apiKeyRepo = require('../../repositories/apiKeyRepo');

module.exports = {
  method:     'POST',
  path:       '/admin/apikey/limit',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const email      = req.body?.email?.trim().toLowerCase();
      const totalLimit = Number(req.body?.total_limit);
      if (!email) return res.status(400).json({ success: false, message: 'email is required' });
      if (!Number.isInteger(totalLimit) || totalLimit < 0)
        return res.status(400).json({ success: false, message: 'total_limit must be a non-negative integer' });

      const user = await userRepo.findByEmailAdmin(email);
      if (!user) return res.status(404).json({ success: false, message: 'No account found with that email' });

      const existing = await apiKeyRepo.findByUserId(user.id);
      if (!existing) return res.status(404).json({ success: false, message: 'User has no API key yet' });

      await apiKeyRepo.updateTotalLimit(user.id, totalLimit);
      res.json({ success: true, data: { ...existing, total_limit: totalLimit } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
