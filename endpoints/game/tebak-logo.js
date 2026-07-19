'use strict';

const { pickLogoQuestion } = require('../../services/gameLogoService');
const { buildClue }        = require('../../utils/quizUtils');
const { logKeyUsage }      = require('../../utils/keyLogger');

async function handleTebakLogo(req, params, res) {
  const { answer, image } = pickLogoQuestion();

  await logKeyUsage(req, '/api/game/tebak-logo');
  res.json({
    success: true,
    data: {
      category: 'logo',
      question: 'Logo brand apakah ini?',
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
      path:       '/game/tebak-logo',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakLogo(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
