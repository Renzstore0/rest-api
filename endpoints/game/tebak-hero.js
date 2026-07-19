'use strict';

const { loadHeroPool } = require('../../services/gameHeroService');
const { buildClue }    = require('../../utils/quizUtils');
const { logKeyUsage }  = require('../../utils/keyLogger');

async function handleTebakHero(req, params, res) {
  const pool = await loadHeroPool();
  const hero = pool[Math.floor(Math.random() * pool.length)];

  await logKeyUsage(req, '/api/game/tebak-hero');
  res.json({
    success: true,
    data: {
      category: 'hero',
      question: 'Siapakah nama hero MOBA ini?',
      image: hero.image,
      answer: hero.name,
      clue: buildClue(hero.name),
      meta: { game: hero.game, title: hero.title },
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-hero',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakHero(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
