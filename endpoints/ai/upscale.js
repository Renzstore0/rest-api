'use strict';

const upscaleService     = require('../../services/upscaleService');
const { logKeyUsage }    = require('../../utils/keyLogger');
const { randomFilename } = require('../../utils/randomFilename');

function validateParams(params) {
  const { url, scale } = params;
  if (!url || typeof url !== 'string') return { error: 'url is required' };
  try {
    const { protocol } = new URL(url);
    if (protocol !== 'http:' && protocol !== 'https:') throw 0;
  } catch {
    return { error: 'url must be a valid http(s) address' };
  }
  if (scale && !upscaleService.SCALE_OPTIONS.includes(String(scale))) {
    return { error: `scale must be one of: ${upscaleService.SCALE_OPTIONS.join(', ')}` };
  }
  return { url, scale: scale ? String(scale) : undefined };
}

async function handle(req, params, res, asAttachment) {
  const v = validateParams(params);
  if (v.error) return res.status(400).json({ success: false, message: v.error });

  const result = await upscaleService.upscale(v.url, v.scale);

  await logKeyUsage(req, '/api/ai/upscale');

  if (asAttachment) {
    res.set('Content-Type', result.mimeType);
    res.set('Content-Disposition', `attachment; filename="${randomFilename(result.ext)}"`);
    return res.send(result.buffer);
  }

  const image = `data:${result.mimeType};base64,${result.buffer.toString('base64')}`;
  res.json({ success: true, data: { image, format: result.ext } });
}

module.exports = {
  routes: [
    {
      method: 'POST', path: '/ai/upscale', middleware: ['requireApiKey', 'upscaleRateLimiter'],
      async handler(req, res) {
        try   { await handle(req, req.body, res, false); }
        catch (err) { if (!res.headersSent) res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
      },
    },
    {
      method: 'GET', path: '/ai/upscale', middleware: ['requireApiKey', 'upscaleRateLimiter'],
      async handler(req, res) {
        try   { await handle(req, req.query, res, true); }
        catch (err) { if (!res.headersSent) res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
      },
    },
  ],
};
