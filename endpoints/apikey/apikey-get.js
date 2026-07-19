'use strict';

const apiKeyRepo = require('../../repositories/apiKeyRepo');

module.exports = {
  method:     'GET',
  path:       '/apikey',
  middleware: ['requireSession'],

  async handler(req, res) {
    try {
      const record = await apiKeyRepo.findByUserId(req.session.user.id);
      if (!record) return res.json({ success: true, data: null });
      const recentIps = await apiKeyRepo.getRecentIps(record.id, 10);
      res.json({
        success: true,
        data: {
          id:          record.id,
          key_name:    record.key_name || 'My API Key',
          api_key:     record.api_key,
          total_limit: record.total_limit,
          used_count:  record.used_count,
          remaining:   record.total_limit - record.used_count,
          created_at:  record.created_at,
          recent_ips:  recentIps
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
