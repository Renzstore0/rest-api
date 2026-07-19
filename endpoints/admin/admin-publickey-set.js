'use strict';

const publicApiKeyRepo = require('../../repositories/publicApiKeyRepo');
const apiKeyRepo       = require('../../repositories/apiKeyRepo');

module.exports = {
  method:     'POST',
  path:       '/admin/publickey',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const key = req.body?.key?.trim();
      if (!apiKeyRepo.isValidKeyFormat(key))
        return res.status(400).json({ success: false, message: 'Key must be 4-68 chars: letters, numbers, _ or -.' });

      const taken = await apiKeyRepo.findByKey(key);
      if (taken)
        return res.status(409).json({ success: false, message: 'That key is already assigned to a user.' });

      const record = await publicApiKeyRepo.setKey(req.session.user.id, key);
      res.json({ success: true, data: { api_key: record.api_key, enabled: !!record.enabled } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
