'use strict';

const animeService    = require('../../../services/animeService');
const { logKeyUsage } = require('../../../utils/keyLogger');

module.exports = {
  method:     'GET',
  path:       '/anime/mal/top',
  middleware: ['requireApiKey'],

  async handler(req, res) {
    try {
      const { page, limit } = req.query;
      const results = await animeService.getTopAnime(parseInt(page) || 1, parseInt(limit) || 10);
      await logKeyUsage(req, '/api/anime/mal/top');
      res.json({ success: true, data: results, count: results.length });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
