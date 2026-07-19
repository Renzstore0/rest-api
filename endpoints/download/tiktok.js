'use strict';

const { fetchTikTok } = require('../../services/downloadService');
const { logKeyUsage } = require('../../utils/keyLogger');

module.exports = {
  method:     'GET',
  path:       '/download/tiktok',
  middleware: ['requireApiKey'],

  async handler(req, res) {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({ success: false, message: 'url query parameter is required.' });
      }

      const data = await fetchTikTok(url);
      await logKeyUsage(req, '/api/download/tiktok');
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
