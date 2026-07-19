'use strict';

const samehadakuService = require('../../../services/samehadakuService');
const { logKeyUsage }   = require('../../../utils/keyLogger');

module.exports = {
  method:     'GET',
  path:       '/anime/samehadaku/latest',
  middleware: ['requireApiKey'],

  async handler(req, res) {
    try {
      const results = await samehadakuService.getLatest();
      await logKeyUsage(req, '/api/anime/samehadaku/latest');
      res.json({ success: true, data: results, count: results.length });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
