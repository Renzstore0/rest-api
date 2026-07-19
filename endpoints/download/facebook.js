'use strict';

const { fetchFacebook, wrapFacebookProxy } = require('../../services/downloadService');
const { convertVideoToMp3 } = require('../../services/audioConvertService');
const { logKeyUsage }       = require('../../utils/keyLogger');
const { randomFilename }    = require('../../utils/randomFilename');
const tokenStore            = require('../../services/proxyTokenStore');
const { isAllowedCdnUrl }   = require('../../utils/cdnValidator');

const FACEBOOK_REFERER = 'https://www.facebook.com/';

function validateUrl(url, res) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    res.status(400).json({ success: false, message: 'url parameter is required.' });
    return false;
  }
  return true;
}

async function fetchAndRespond(url, req, res) {
  try {
    if (!validateUrl(url, res)) return;

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const raw     = await fetchFacebook(url.trim());
    const data    = wrapFacebookProxy(raw, baseUrl);

    await logKeyUsage(req, '/api/download/facebook');
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
    await convertVideoToMp3(cdnUrl, res, FACEBOOK_REFERER);
    if (!res.writableEnded) res.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
    else res.destroy();
  }
}

module.exports = {
  routes: [
    { method: 'GET',  path: '/download/facebook',              middleware: ['requireApiKey'], async handler(req, res) { await fetchAndRespond(req.query.url, req, res); } },
    { method: 'POST', path: '/download/facebook',              middleware: ['requireApiKey'], async handler(req, res) { await fetchAndRespond(req.body.url, req, res); } },
    { method: 'GET',  path: '/download/facebook-audio/:token', middleware: [],                handler: audioHandler },
  ],
};
