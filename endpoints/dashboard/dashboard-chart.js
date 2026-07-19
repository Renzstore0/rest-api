'use strict';

const analyticsRepo = require('../../repositories/analyticsRepo');

module.exports = {
  method:     'GET',
  path:       '/dashboard/chart',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const data = await analyticsRepo.getDailyRequestCounts(days);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
