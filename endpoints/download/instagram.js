'use strict';

const { fetchInstagram, fetchInstagramStory, remapUrls } = require('../../services/downloadService');
const { convertVideoToMp3 } = require('../../services/audioConvertService');
const { logKeyUsage }       = require('../../utils/keyLogger');
const { randomFilename }    = require('../../utils/randomFilename');
const tokenStore            = require('../../services/proxyTokenStore');
const { isAllowedCdnUrl }   = require('../../utils/cdnValidator');

const STORY_RE = /instagram\.com\/stories\//i;

async function fetchHandler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'url query parameter is required.' });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const isStory = STORY_RE.test(url);
    const raw     = isStory ? await fetchInstagramStory(url) : await fetchInstagram(url);
    const data    = remapUrls(raw, baseUrl);

    await logKeyUsage(req, '/api/download/instagram');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function audioHandler(req, res) {
  const rawToken = req.params.token.replace(/\.[a-z0-9]+$/i, '');

  const cdnUrl = tokenStore.get(rawToken);
  if (!cdnUrl) return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
  if (!isAllowedCdnUrl(cdnUrl)) return res.status(403).json({ success: false, message: 'URL is not from an allowed CDN domain.' });

  const filename = randomFilename('mp3');
  res.setHeader('Content-Type',                'audio/mpeg');
  res.setHeader('Content-Disposition',         `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control',               'public, max-age=300');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    await convertVideoToMp3(cdnUrl, res);
    if (!res.writableEnded) res.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
    else res.destroy();
  }
}

module.exports = {
  routes: [
    { method: 'GET', path: '/download/instagram',              middleware: ['requireApiKey'], handler: fetchHandler },
    { method: 'GET', path: '/download/instagram-audio/:token', middleware: [],                handler: audioHandler },
  ],
};
