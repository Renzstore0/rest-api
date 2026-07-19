'use strict';

const publicApiKeyRepo = require('../../repositories/publicApiKeyRepo');

module.exports = {
  method:     'POST',
  path:       '/admin/publickey/regenerate',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const record = await publicApiKeyRepo.regenerate(req.session.user.id);
      res.json({ success: true, data: { api_key: record.api_key, enabled: !!record.enabled } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
