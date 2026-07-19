'use strict';

const apiKeyRepo = require('../../repositories/apiKeyRepo');

module.exports = {
  method:     'POST',
  path:       '/apikey/regenerate',
  middleware: ['requireSession'],

  async handler(req, res) {
    try {
      const record = await apiKeyRepo.regenerateKey(req.session.user.id);
      res.json({
        success: true,
        data: {
          id:          record.id,
          key_name:    record.key_name || 'My API Key',
          api_key:     record.api_key,
          total_limit: record.total_limit,
          used_count:  record.used_count,
          remaining:   record.total_limit - record.used_count
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
