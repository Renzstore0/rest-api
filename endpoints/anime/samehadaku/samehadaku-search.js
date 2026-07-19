'use strict';

const samehadakuService = require('../../../services/samehadakuService');
const { logKeyUsage }   = require('../../../utils/keyLogger');

module.exports = {
  method:     'GET',
  path:       '/anime/samehadaku/search',
  middleware: ['requireApiKey'],

  async handler(req, res) {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ success: false, message: 'q is required' });
      const results = await samehadakuService.search(q);
      await logKeyUsage(req, '/api/anime/samehadaku/search');
      res.json({ success: true, data: results, count: results.length });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
