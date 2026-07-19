'use strict';

const userRepo      = require('../repositories/userRepo');
const analyticsRepo = require('../repositories/analyticsRepo');
const apiKeyRepo    = require('../repositories/apiKeyRepo');
const publicApiKeyRepo = require('../repositories/publicApiKeyRepo');
const { WIB_OFFSET_MIN, wibDateStr } = require('../utils/wib');
const { FEATURE_NAMES_SORTED, CATEGORY_KEYS } = require('../utils/featureRegistry');

async function renderIndex(req, res) {
  const today     = wibDateStr();
  const yesterday = wibDateStr(new Date(Date.now() - 24 * 60 * 60 * 1000));
  try {
    await analyticsRepo.incrementPageView(today);
    const [totalRequests, todayRequests, totalViewers, yesterdayViewers] = await Promise.all([
      analyticsRepo.getTotalRequests(),
      analyticsRepo.getTodayRequestsByOffset(WIB_OFFSET_MIN),
      analyticsRepo.getTotalPageViews(),
      analyticsRepo.getYesterdayPageViews(yesterday),
    ]);
    res.render('index', {
      user:             req.session?.user || null,
      title:            'Lumpo - REST API untuk AI, anime, downloader & maker tools',
      description:      'Lumpo - REST API performa tinggi untuk AI, data anime, media downloader, dan image generation. Ambil API key, mulai dalam hitungan menit.',
      totalRequests:    Number(totalRequests)    || 0,
      todayRequests:    Number(todayRequests)    || 0,
      totalViewers:     Number(totalViewers)     || 0,
      yesterdayViewers: Number(yesterdayViewers) || 0,
    });
  } catch {
    res.render('index', {
      user:             req.session?.user || null,
      title:            'Lumpo - REST API untuk AI, anime, downloader & maker tools',
      description:      'Lumpo - REST API performa tinggi untuk AI, data anime, media downloader, dan image generation. Ambil API key, mulai dalam hitungan menit.',
      totalRequests:    0,
      todayRequests:    0,
      totalViewers:     0,
      yesterdayViewers: 0,
    });
  }
}

function renderCategories(req, res) {
  const { cat = '', sub = '' } = req.query;
  const validCats = CATEGORY_KEYS;
  const validSubs = { anime: ['myanimelist', 'samehadaku'] };
  const initialCat = validCats.includes(cat) ? cat : '';
  const initialSub = initialCat && validSubs[initialCat]?.includes(sub) ? sub : '';
  res.render('categories', {
    user:       req.session?.user || null,
    title:      'Docs - Lumpo',
    initialCat,
    initialSub
  });
}

async function renderFeature(req, res) {
  const { category, slug } = req.params;
  const feature = FEATURE_NAMES_SORTED[category]?.[slug];
  if (!feature) return res.redirect('/docs');
  let userApiKey = '';
  if (req.session?.user) {
    try {
      const keyRecord = await apiKeyRepo.findByUserId(req.session.user.id);
      if (keyRecord) userApiKey = keyRecord.api_key;
    } catch {}
  }
  if (!userApiKey) {
    try {
      const publicKey = await publicApiKeyRepo.get();
      if (publicKey?.enabled) userApiKey = publicKey.api_key;
    } catch {}
  }
  res.render('feature', {
    user:       req.session?.user || null,
    category,
    feature,
    userApiKey,
    turnstileSiteKey: process.env.CF_TURNSTILE_SITE_KEY || '',
    title:       `${feature} - Lumpo`,
    description: `${feature} API endpoint - dokumentasi interaktif, live testing, dan code snippet otomatis.`
  });
}

function renderAdmin(req, res) {
  res.render('admin', {
    user:  req.session.user,
    title: 'Admin - Lumpo'
  });
}

async function renderProfile(req, res) {
  if (!req.session?.user) return res.redirect('/');
  try {
    const dbUser = await userRepo.findById(req.session.user.id);
    if (!dbUser) return res.redirect('/');

    const fresh = {
      ...dbUser,
      createdAt:     dbUser.created_at,
      roleExpiresAt: dbUser.role_expires_at || null,
      roleGrantedAt: dbUser.role_granted_at || null,
    };

    const keyRecord = await apiKeyRepo.findByUserId(fresh.id);
    if (keyRecord) {
      fresh.apiKey        = keyRecord.api_key;
      fresh.limit         = keyRecord.total_limit;
      fresh.totalRequests = keyRecord.used_count;

      try {
        const [todayCount, ips] = await Promise.all([
          apiKeyRepo.getTodayUsageByKeyId(keyRecord.id),
          apiKeyRepo.getRecentIps(keyRecord.id, 5)
        ]);
        fresh.todayRequests = todayCount;
        fresh.recentIps     = ips.map(r => ({
          address:  r.ip_address,
          count:    r.request_count,
          lastSeen: r.last_seen
        }));
      } catch {
        fresh.todayRequests = 0;
        fresh.recentIps     = [];
      }
    }

    req.session.user = fresh;
    res.render('profile', { user: fresh, title: 'Profil - Lumpo' });
  } catch {
    res.render('profile', { user: req.session.user, title: 'Profil - Lumpo' });
  }
}

function renderUpgrade(req, res) {
  if (!req.session?.user) return res.redirect('/login');
  if (req.session.user.role === 'admin') return res.redirect('/profile');
  res.render('upgrade', { user: req.session.user, title: 'Upgrade Role - Lumpo' });
}

function renderLogin(req, res) {
  if (req.session?.user) return res.redirect('/');
  res.render('login', { title: 'Masuk - Lumpo', turnstileSiteKey: process.env.CF_TURNSTILE_SITE_KEY || '' });
}

function renderRegister(req, res) {
  if (req.session?.user) return res.redirect('/');
  res.render('register', { title: 'Daftar - Lumpo', turnstileSiteKey: process.env.CF_TURNSTILE_SITE_KEY || '' });
}

module.exports = { renderIndex, renderCategories, renderFeature, renderAdmin, renderProfile, renderUpgrade, renderLogin, renderRegister };
