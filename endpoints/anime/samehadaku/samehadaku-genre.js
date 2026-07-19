'use strict';

const samehadakuService = require('../../../services/samehadakuService');
const { logKeyUsage }   = require('../../../utils/keyLogger');

module.exports = {
  method:     'GET',
  path:       '/anime/samehadaku/genre/:slug',
  middleware: ['requireApiKey'],

  async handler(req, res) {
    try {
      const { slug } = req.params;
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);

      if (!slug || slug.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'slug parameter is required' });
      }

      const results = await samehadakuService.getByGenre(slug, page);
      await logKeyUsage(req, '/api/anime/samehadaku/genre/:slug');
      res.json({ success: true, data: results, count: results.length, page });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
