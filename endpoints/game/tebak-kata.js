'use strict';

const { pickWordQuestion } = require('../../services/gameWordService');
const { buildClue }        = require('../../utils/quizUtils');
const { logKeyUsage }      = require('../../utils/keyLogger');

async function handleTebakKata(req, params, res) {
  const { answer, clue } = pickWordQuestion();

  await logKeyUsage(req, '/api/game/tebak-kata');
  res.json({
    success: true,
    data: {
      category: 'word',
      question: clue,
      image: null,
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
      path:       '/game/tebak-kata',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakKata(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
