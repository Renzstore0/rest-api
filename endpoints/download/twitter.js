'use strict';

const { fetchTwitter } = require('../../services/downloadService');
const { logKeyUsage }  = require('../../utils/keyLogger');

module.exports = {
  method:     'GET',
  path:       '/download/twitter',
  middleware: ['requireApiKey'],

  async handler(req, res) {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({ success: false, message: 'url query parameter is required.' });
      }

      const data = await fetchTwitter(url);
      await logKeyUsage(req, '/api/download/twitter');
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
