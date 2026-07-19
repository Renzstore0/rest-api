'use strict';

const { pickFoodQuestion } = require('../../services/gameFoodService');
const { buildClue }        = require('../../utils/quizUtils');
const { logKeyUsage }      = require('../../utils/keyLogger');

async function handleTebakMakanan(req, params, res) {
  const { answer, image } = await pickFoodQuestion();

  await logKeyUsage(req, '/api/game/tebak-makanan');
  res.json({
    success: true,
    data: {
      category: 'food',
      question: 'Makanan apakah ini?',
      image,
      answer,
      clue: buildClue(answer),
      meta: {},
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-makanan',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakMakanan(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
