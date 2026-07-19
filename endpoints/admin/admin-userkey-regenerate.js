'use strict';

const userRepo   = require('../../repositories/userRepo');
const apiKeyRepo = require('../../repositories/apiKeyRepo');

module.exports = {
  method:     'POST',
  path:       '/admin/apikey/regenerate',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const email = req.body?.email?.trim().toLowerCase();
      if (!email) return res.status(400).json({ success: false, message: 'email is required' });

      const user = await userRepo.findByEmailAdmin(email);
      if (!user) return res.status(404).json({ success: false, message: 'No account found with that email' });

      const key = await apiKeyRepo.regenerateKey(user.id);
      res.json({ success: true, data: key });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
