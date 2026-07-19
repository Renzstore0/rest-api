'use strict';

const samehadakuService = require('../../../services/samehadakuService');
const { logKeyUsage }   = require('../../../utils/keyLogger');

module.exports = {
  method:     'GET',
  path:       '/anime/samehadaku/detail',
  middleware: ['requireApiKey'],

  async handler(req, res) {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).json({ success: false, message: 'url is required' });
      const result = await samehadakuService.getDetail(url);
      await logKeyUsage(req, '/api/anime/samehadaku/detail');
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
