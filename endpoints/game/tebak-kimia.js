'use strict';

const { pickChemistryQuestion } = require('../../services/gameChemistryService');
const { buildClue }             = require('../../utils/quizUtils');
const { logKeyUsage }           = require('../../utils/keyLogger');

async function handleTebakKimia(req, params, res) {
  const { question, answer, symbol } = pickChemistryQuestion();

  await logKeyUsage(req, '/api/game/tebak-kimia');
  res.json({
    success: true,
    data: {
      category: 'chemistry',
      question,
      image: null,
      answer,
      clue: buildClue(answer),
      meta: { symbol },
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-kimia',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakKimia(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
