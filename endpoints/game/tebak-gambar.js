'use strict';

const { pickObjectQuestion } = require('../../services/gameObjectService');
const { buildClue }          = require('../../utils/quizUtils');
const { logKeyUsage }        = require('../../utils/keyLogger');

async function handleTebakGambar(req, params, res) {
  const { answer, image } = await pickObjectQuestion();

  await logKeyUsage(req, '/api/game/tebak-gambar');
  res.json({
    success: true,
    data: {
      category: 'object',
      question: 'Apa nama benda pada gambar ini?',
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
      path:       '/game/tebak-gambar',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakGambar(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
