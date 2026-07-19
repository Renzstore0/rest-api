'use strict';

const animeService    = require('../../../services/animeService');
const { logKeyUsage } = require('../../../utils/keyLogger');

const VALID_SEASONS = new Set(['winter', 'spring', 'summer', 'fall']);

module.exports = {
  method:     'GET',
  path:       '/anime/mal/seasonal',
  middleware: ['requireApiKey'],

  async handler(req, res) {
    try {
      const { year, season } = req.query;
      if (!/^\d{4}$/.test(year || ''))
        return res.status(400).json({ success: false, message: 'year must be a 4-digit number' });
      if (!VALID_SEASONS.has(season))
        return res.status(400).json({ success: false, message: 'season must be one of winter, spring, summer, fall' });
      const results = await animeService.getSeasonalAnime(year, season);
      await logKeyUsage(req, '/api/anime/mal/seasonal');
      res.json({ success: true, data: results, count: results.length });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
