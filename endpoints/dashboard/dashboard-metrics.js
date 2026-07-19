'use strict';

const analyticsRepo = require('../../repositories/analyticsRepo');
const userRepo      = require('../../repositories/userRepo');
const blacklistRepo = require('../../repositories/blacklistRepo');

module.exports = {
  method:     'GET',
  path:       '/dashboard/metrics',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const [totalRequests, totalUsers, blacklistCount, successError, dailyData, endpointStats] =
        await Promise.all([
          analyticsRepo.getTotalRequests(),
          userRepo.countUsers(),
          blacklistRepo.countBlacklisted(),
          analyticsRepo.getTotalSuccessError(),
          analyticsRepo.getDailyRequestCounts(7),
          analyticsRepo.getEndpointStats()
        ]);
      res.json({
        success: true,
        data: {
          totalRequests,
          totalUsers,
          blacklistCount,
          successCount: successError.success,
          errorCount:   successError.error,
          dailyData,
          endpointStats,
          uptimeSeconds: Math.floor(process.uptime())
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
