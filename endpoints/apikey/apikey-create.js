'use strict';

const apiKeyRepo = require('../../repositories/apiKeyRepo');

module.exports = {
  method:     'POST',
  path:       '/apikey/create',
  middleware: ['requireSession'],

  async handler(req, res) {
    try {
      const existing = await apiKeyRepo.findByUserId(req.session.user.id);
      if (existing)
        return res.status(409).json({ success: false, message: 'API key already exists. Use regenerate.' });
      const record = await apiKeyRepo.createKey(req.session.user.id);
      res.status(201).json({
        success: true,
        data: {
          id:          record.id,
          key_name:    record.key_name,
          api_key:     record.api_key,
          total_limit: record.total_limit,
          used_count:  0,
          remaining:   record.total_limit
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
