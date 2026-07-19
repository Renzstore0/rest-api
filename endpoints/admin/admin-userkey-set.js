'use strict';

const userRepo         = require('../../repositories/userRepo');
const apiKeyRepo       = require('../../repositories/apiKeyRepo');
const publicApiKeyRepo = require('../../repositories/publicApiKeyRepo');

module.exports = {
  method:     'POST',
  path:       '/admin/apikey/set',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const email = req.body?.email?.trim().toLowerCase();
      const key   = req.body?.key?.trim();
      if (!email) return res.status(400).json({ success: false, message: 'email is required' });
      if (!apiKeyRepo.isValidKeyFormat(key))
        return res.status(400).json({ success: false, message: 'Key must be 4-68 chars: letters, numbers, _ or -.' });

      const user = await userRepo.findByEmailAdmin(email);
      if (!user) return res.status(404).json({ success: false, message: 'No account found with that email' });

      const publicKey = await publicApiKeyRepo.get();
      if (publicKey?.api_key === key)
        return res.status(409).json({ success: false, message: 'That key is reserved for the public API key.' });

      await apiKeyRepo.setKey(user.id, key);
      const updated = await apiKeyRepo.findByUserId(user.id);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(err.message === 'That key is already in use.' ? 409 : 500).json({ success: false, message: err.message });
    }
  }
};
