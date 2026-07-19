'use strict';

const blacklistRepo = require('../../repositories/blacklistRepo');

module.exports = {
  method:     'GET',
  path:       '/dashboard/blacklist',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const ips = await blacklistRepo.getAllBlacklistedIps();
      res.json({ success: true, data: ips.map(ip => ({ ip })) });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
