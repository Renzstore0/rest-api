'use strict';

const axios               = require('axios');
const { createReadStream,
        existsSync,
        unlinkSync,
        statSync }        = require('fs');
const tokenStore          = require('../../services/proxyTokenStore');
const { isAllowedCdnUrl } = require('../../utils/cdnValidator');
const { BROWSER_UA }      = require('../../utils/constants');

const YOUTUBE_CDN_RE   = /googlevideo\.com/i;
const INVIDIOUS_CDN_RE = /invidious|yewtu\.be|nadeko\.net|datura\.network/i;
const FACEBOOK_CDN_RE  = /fbcdn\.net|fbsbx\.com/i;

module.exports = {
  method:     'GET',
  path:       '/download/proxy/:token',
  middleware: [],

  async handler(req, res) {
    const rawToken = req.params.token.replace(/\.[a-z0-9]+$/i, '');
    const ext      = req.params.token.match(/\.([a-z0-9]+)$/i)?.[1] ?? 'mp4';

    const entry = tokenStore.getEntry(rawToken);
    if (!entry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
    }

    // ── Local muxed file (YouTube DASH → ffmpeg) ─────────────────────────────
    if (entry.localPath) {
      if (!existsSync(entry.localPath)) {
        return res.status(404).json({ success: false, message: 'Muxed file not found or already consumed.' });
      }

      const stat = statSync(entry.localPath);

      const localExt  = ext === 'm4a' ? 'mp3' : ext;
      const localName = `${Date.now()}${Math.floor(Math.random() * 1e6)}.${localExt}`;
      res.setHeader('Content-Type',                localExt === 'mp3' ? 'audio/mpeg' : 'video/mp4');
      res.setHeader('Content-Disposition',         `attachment; filename="${localName}"`);
      res.setHeader('Content-Length',              stat.size);
      res.setHeader('Cache-Control',               'no-store');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const stream = createReadStream(entry.localPath);
      stream.on('error', (streamErr) => {
        if (!res.headersSent) res.status(500).json({ success: false, message: streamErr.message });
        else res.destroy();
      });
      stream.on('close', () => {
        try { unlinkSync(entry.localPath); } catch {}
      });
      stream.pipe(res);
      return;
    }

    // ── CDN proxy (Instagram / Facebook / YouTube DASH individual streams) ───
    const cdnUrl = entry.cdnUrl;

    if (!isAllowedCdnUrl(cdnUrl)) {
      return res.status(403).json({ success: false, message: 'URL is not from an allowed CDN domain.' });
    }

    try {
      const isYouTube   = YOUTUBE_CDN_RE.test(cdnUrl);
      const isInvidious = INVIDIOUS_CDN_RE.test(cdnUrl);
      const isFacebook  = FACEBOOK_CDN_RE.test(cdnUrl);

      let upstreamHeaders;
      if (isYouTube) {
        upstreamHeaders = {
          'User-Agent':      'com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip',
          'Accept':          '*/*',
          'Accept-Encoding': 'identity',
          'Connection':      'keep-alive',
        };
      } else if (isInvidious) {
        upstreamHeaders = {
          'User-Agent':      BROWSER_UA,
          'Accept':          '*/*',
          'Accept-Encoding': 'identity',
        };
      } else if (isFacebook) {
        upstreamHeaders = {
          'User-Agent':      BROWSER_UA,
          'Referer':         'https://www.facebook.com/',
          'Accept':          '*/*',
          'Accept-Encoding': 'identity',
        };
      } else {
        upstreamHeaders = {
          'User-Agent':      BROWSER_UA,
          'Referer':         'https://www.instagram.com/',
          'Accept':          '*/*',
          'Accept-Encoding': 'identity',
        };
      }

      if (req.headers['range'])  upstreamHeaders['Range'] = req.headers['range'];
      else if (isYouTube)        upstreamHeaders['Range'] = 'bytes=0-';

      const upstream = await axios.get(cdnUrl, {
        responseType: 'stream',
        headers:      upstreamHeaders,
        timeout:      120_000,
        maxRedirects: 5,
      });

      const contentType = upstream.headers['content-type'] || 'application/octet-stream';

      res.status(upstream.status || 200);
      res.setHeader('Content-Type',                contentType);
      const cdnExt  = ext === 'm4a' ? 'mp3' : ext;
      const cdnName = `${Date.now()}${Math.floor(Math.random() * 1e6)}.${cdnExt}`;
      res.setHeader('Content-Disposition',         `attachment; filename="${cdnName}"`);
      res.setHeader('Cache-Control',               'public, max-age=300');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (upstream.headers['content-length'])  res.setHeader('Content-Length',  upstream.headers['content-length']);
      if (upstream.headers['content-range'])   res.setHeader('Content-Range',   upstream.headers['content-range']);
      if (upstream.headers['accept-ranges'])   res.setHeader('Accept-Ranges',   upstream.headers['accept-ranges']);

      upstream.data.on('error', (streamErr) => {
        if (!res.headersSent) res.status(502).json({ success: false, message: 'Stream error: ' + streamErr.message });
        else res.destroy();
      });

      upstream.data.pipe(res);

    } catch (err) {
      if (res.headersSent) return;
      const status = err.response?.status ?? 502;
      if (status === 403 || status === 429) return res.redirect(302, cdnUrl);
      res.status(status).json({ success: false, message: 'Failed to fetch from CDN: ' + err.message });
    }
  }
};
