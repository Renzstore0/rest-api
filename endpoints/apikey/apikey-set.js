'use strict';

const apiKeyRepo       = require('../../repositories/apiKeyRepo');
const userRepo         = require('../../repositories/userRepo');
const publicApiKeyRepo = require('../../repositories/publicApiKeyRepo');

const ALLOWED_ROLES = new Set(['premium', 'vip', 'admin']);

module.exports = {
  method:     'POST',
  path:       '/apikey/set',
  middleware: ['requireSession'],

  async handler(req, res) {
    try {
      const user = await userRepo.findById(req.session.user.id);
      if (!user || !ALLOWED_ROLES.has(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Custom API key is only available for Premium, VIP, and Admin accounts.',
          code:    'FORBIDDEN_ROLE'
        });
      }

      const trimmed = req.body?.key?.trim();
      if (!apiKeyRepo.isValidKeyFormat(trimmed))
        return res.status(400).json({ success: false, message: 'Key must be 4-68 chars: letters, numbers, _ or -.' });

      const existing = await apiKeyRepo.findByUserId(req.session.user.id);
      if (!existing)
        return res.status(404).json({ success: false, message: 'No API key found. Create one first.' });

      const publicKey = await publicApiKeyRepo.get();
      if (publicKey?.api_key === trimmed)
        return res.status(409).json({ success: false, message: 'That key is reserved for the public API key.' });

      await apiKeyRepo.setKey(req.session.user.id, trimmed);
      res.json({ success: true, data: { api_key: trimmed } });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
};

