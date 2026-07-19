'use strict';

const blacklistRepo = require('../../repositories/blacklistRepo');

module.exports = {
  method:     'DELETE',
  path:       '/dashboard/blacklist',
  middleware: ['secureAdmin'],

  async handler(req, res) {
    try {
      const { ip } = req.body;
      if (!ip || typeof ip !== 'string' || !ip.trim()) {
        return res.status(400).json({ success: false, message: 'IP address required' });
      }
      await blacklistRepo.removeFromBlacklist(ip.trim());
      res.json({ success: true, message: `${ip.trim()} unblocked` });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
