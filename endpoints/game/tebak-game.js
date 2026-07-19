'use strict';

const { fetchGamePool } = require('../../services/gameGuessService');
const { buildClue }     = require('../../utils/quizUtils');
const { logKeyUsage }   = require('../../utils/keyLogger');

async function handleTebakGame(req, params, res) {
  const pool = await fetchGamePool();
  const game = pool[Math.floor(Math.random() * pool.length)];

  await logKeyUsage(req, '/api/game/tebak-game');
  res.json({
    success: true,
    data: {
      category: 'game',
      question: 'Apa judul game ini?',
      image: game.thumbnail,
      answer: game.title,
      clue: buildClue(game.title),
      meta: { genre: game.genre ?? null, platform: game.platform ?? null, releaseDate: game.release_date ?? null },
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-game',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakGame(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
