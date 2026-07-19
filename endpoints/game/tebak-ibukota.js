'use strict';

const { pickCapitalQuestion } = require('../../services/gameCapitalService');
const { buildClue }           = require('../../utils/quizUtils');
const { logKeyUsage }         = require('../../utils/keyLogger');

async function handleTebakIbukota(req, params, res) {
  const { country, code, image, answer } = pickCapitalQuestion();

  await logKeyUsage(req, '/api/game/tebak-ibukota');
  res.json({
    success: true,
    data: {
      category: 'capital',
      question: `Apa ibukota negara ${country}?`,
      image,
      answer,
      clue: buildClue(answer),
      meta: { country, code },
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-ibukota',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakIbukota(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
