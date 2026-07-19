'use strict';

const { pickFlagQuestion } = require('../../services/gameFlagService');
const { buildClue }        = require('../../utils/quizUtils');
const { logKeyUsage }      = require('../../utils/keyLogger');

async function handleTebakBendera(req, params, res) {
  const { answer, code, image } = pickFlagQuestion();
  await logKeyUsage(req, '/api/game/tebak-bendera');
  res.json({
    success: true,
    data: {
      category: 'flag',
      question: 'Bendera negara manakah ini?',
      image,
      answer,
      clue: buildClue(answer),
      meta: { code },
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-bendera',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakBendera(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
