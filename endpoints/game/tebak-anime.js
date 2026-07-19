'use strict';

const { getAnimePool } = require('../../services/anilistService');
const { buildClue }    = require('../../utils/quizUtils');
const { logKeyUsage }  = require('../../utils/keyLogger');

async function handleTebakAnime(req, params, res) {
  const page = Math.floor(Math.random() * 10) + 1;
  const pool = await getAnimePool(page, 25);

  const anime = pool[Math.floor(Math.random() * pool.length)];

  await logKeyUsage(req, '/api/game/tebak-anime');
  res.json({
    success: true,
    data: {
      category: 'anime',
      question: 'Apa judul anime ini?',
      image: anime.image,
      answer: anime.title,
      clue: buildClue(anime.title),
      meta: { score: anime.score, episodes: anime.episodes },
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-anime',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakAnime(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
