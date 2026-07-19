'use strict';

const animeService    = require('../../../services/animeService');
const { logKeyUsage } = require('../../../utils/keyLogger');

module.exports = {
  method:     'GET',
  path:       '/anime/mal/detail',
  middleware: ['requireApiKey'],

  async handler(req, res) {
    try {
      const { id } = req.query;
      if (!id || !/^\d+$/.test(id)) return res.status(400).json({ success: false, message: 'id must be a positive integer' });
      const result = await animeService.getAnimeById(id);
      await logKeyUsage(req, '/api/anime/mal/detail');
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
