'use strict';

const { fetchYouTube, wrapYouTubeProxy } = require('../../services/downloadService');
const { logKeyUsage }                     = require('../../utils/keyLogger');

const VALID_TYPES   = new Set(['video', 'audio']);
const MIN_QUALITY   = 144;
const MAX_QUALITY   = 720;

function validateParams(url, type, quality, res) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    res.status(400).json({ success: false, message: 'url parameter is required.' });
    return false;
  }
  if (!type || !VALID_TYPES.has(type)) {
    res.status(400).json({ success: false, message: 'type parameter is required. Use "video" or "audio".' });
    return false;
  }
  if (quality != null && quality !== '') {
    const q = Number(quality);
    if (!Number.isFinite(q) || q < MIN_QUALITY || q > MAX_QUALITY) {
      res.status(400).json({ success: false, message: `quality must be a number between ${MIN_QUALITY} and ${MAX_QUALITY}.` });
      return false;
    }
  }
  return true;
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/download/youtube',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          const { url, type, quality } = req.query;
          if (!validateParams(url, type, quality, res)) return;
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const raw  = await fetchYouTube(url, type, quality);
          const data = wrapYouTubeProxy(raw, baseUrl, type);
          await logKeyUsage(req, '/api/download/youtube');
          res.json({ success: true, data });
        } catch (err) {
          res.status(500).json({ success: false, message: err.message });
        }
      },
    },

    {
      method:     'POST',
      path:       '/download/youtube',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          const { url, type, quality } = req.body;
          if (!validateParams(url, type, quality, res)) return;
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const raw  = await fetchYouTube(url, type, quality);
          const data = wrapYouTubeProxy(raw, baseUrl, type);
          await logKeyUsage(req, '/api/download/youtube');
          res.json({ success: true, data });
        } catch (err) {
          res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
