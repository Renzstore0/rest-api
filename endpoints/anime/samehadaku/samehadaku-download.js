'use strict';

const samehadakuService = require('../../../services/samehadakuService');
const { logKeyUsage }   = require('../../../utils/keyLogger');

module.exports = {
  method:     'GET',
  path:       '/anime/samehadaku/download',
  middleware: ['requireApiKey'],

  async handler(req, res) {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).json({ success: false, message: 'url is required' });
      const result = await samehadakuService.getDownload(url);
      await logKeyUsage(req, '/api/anime/samehadaku/download');
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
