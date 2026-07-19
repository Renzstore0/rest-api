'use strict';

const publicApiKeyRepo = require('../../repositories/publicApiKeyRepo');
const turnstileService = require('../../services/turnstileService');
const { getClientIp }  = require('../../utils/keyLogger');

const ALLOWED_ORIGINS = [process.env.APP_URL, ...(process.env.CORS_ORIGINS || '').split(',')]
  .map(s => s?.trim())
  .filter(Boolean);
const BOT_UA = /curl|wget|python-requests|scrapy|go-http-client|node-fetch|^$/i;

const isTrustedOrigin = (req) => {
  const val = req.get('origin') || req.get('referer') || '';
  return val && ALLOWED_ORIGINS.some(o => val.startsWith(o));
};

module.exports = {
  method:     'POST',
  path:       '/apikey/public/reveal',
  middleware: ['publicKeyRevealLimiter'],

  async handler(req, res) {
    try {
      if (!isTrustedOrigin(req) || BOT_UA.test(req.get('user-agent') || ''))
        return res.status(403).json({ success: false, message: 'Forbidden' });

      const verified = await turnstileService.verify(req.body?.token, getClientIp(req));
      if (!verified)
        return res.status(403).json({ success: false, message: 'Verification failed. Please retry.' });

      const record = await publicApiKeyRepo.ensureSeeded();
      if (!record.enabled)
        return res.status(404).json({ success: false, message: 'Public API key is currently unavailable.' });

      res.json({ success: true, data: { api_key: record.api_key } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
