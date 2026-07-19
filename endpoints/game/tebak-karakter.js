'use strict';

const { fetchCharacterPool } = require('../../services/gameCharacterService');
const { buildClue }          = require('../../utils/quizUtils');
const { logKeyUsage }        = require('../../utils/keyLogger');

async function handleTebakKarakter(req, params, res) {
  const pool = await fetchCharacterPool();
  const char = pool[Math.floor(Math.random() * pool.length)];

  await logKeyUsage(req, '/api/game/tebak-karakter');
  res.json({
    success: true,
    data: {
      category: 'character',
      question: 'Siapakah nama karakter anime ini?',
      image: char.image,
      answer: char.name,
      clue: buildClue(char.name),
      meta: { anime: char.anime },
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-karakter',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakKarakter(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
