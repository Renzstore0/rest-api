'use strict';

const animeService    = require('../../../services/animeService');
const { logKeyUsage } = require('../../../utils/keyLogger');

module.exports = {
  method:     'GET',
  path:       '/anime/mal/search',
  middleware: ['requireApiKey'],

  async handler(req, res) {
    try {
      const { q, limit } = req.query;
      if (!q) return res.status(400).json({ success: false, message: 'q is required' });
      const results = await animeService.searchAnime(q, parseInt(limit) || 10);
      await logKeyUsage(req, '/api/anime/mal/search');
      res.json({ success: true, data: results, count: results.length });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
