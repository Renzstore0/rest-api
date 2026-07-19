'use strict';

const { fetchPinterestPin } = require('../../services/searchService');
const { logKeyUsage }       = require('../../utils/keyLogger');

function validateUrl(url, res) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    res.status(400).json({ success: false, message: 'url parameter is required.' });
    return false;
  }
  return true;
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/download/pinterest',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          const { url } = req.query;
          if (!validateUrl(url, res)) return;

          const data = await fetchPinterestPin(url.trim());
          await logKeyUsage(req, '/api/download/pinterest');
          res.json({ success: true, data });
        } catch (err) {
          res.status(500).json({ success: false, message: err.message });
        }
      }
    },

    {
      method:     'POST',
      path:       '/download/pinterest',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          const { url } = req.body;
          if (!validateUrl(url, res)) return;

          const data = await fetchPinterestPin(url.trim());
          await logKeyUsage(req, '/api/download/pinterest');
          res.json({ success: true, data });
        } catch (err) {
          res.status(500).json({ success: false, message: err.message });
        }
      }
    }
  ]
};
