'use strict';

const publicApiKeyRepo = require('../../repositories/publicApiKeyRepo');

module.exports = {
  method:     'GET',
  path:       '/admin/publickey',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const record = await publicApiKeyRepo.ensureSeeded();
      res.json({
        success: true,
        data: {
          api_key:    record.api_key,
          enabled:    !!record.enabled,
          updated_at: record.updated_at
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
