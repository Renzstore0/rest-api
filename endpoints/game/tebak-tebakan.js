'use strict';

const { pickRiddleQuestion } = require('../../services/gameRiddleService');
const { buildClue }          = require('../../utils/quizUtils');
const { logKeyUsage }        = require('../../utils/keyLogger');

async function handleTebakTebakan(req, params, res) {
  const { question, answer } = pickRiddleQuestion();

  await logKeyUsage(req, '/api/game/tebak-tebakan');
  res.json({
    success: true,
    data: {
      category: 'riddle',
      question,
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
      path:       '/game/tebak-tebakan',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakTebakan(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
