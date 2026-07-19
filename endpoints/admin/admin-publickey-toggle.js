'use strict';

const publicApiKeyRepo = require('../../repositories/publicApiKeyRepo');

module.exports = {
  method:     'POST',
  path:       '/admin/publickey/toggle',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const record = await publicApiKeyRepo.setEnabled(req.session.user.id, !!req.body?.enabled);
      res.json({ success: true, data: { api_key: record.api_key, enabled: !!record.enabled } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
