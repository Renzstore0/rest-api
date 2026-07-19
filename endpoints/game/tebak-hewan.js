'use strict';

const { pickAnimalQuestion } = require('../../services/gameAnimalService');
const { buildClue }          = require('../../utils/quizUtils');
const { logKeyUsage }        = require('../../utils/keyLogger');

async function handleTebakHewan(req, params, res) {
  const { answer, image } = await pickAnimalQuestion();

  await logKeyUsage(req, '/api/game/tebak-hewan');
  res.json({
    success: true,
    data: {
      category: 'animal',
      question: 'Hewan apakah ini?',
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
      path:       '/game/tebak-hewan',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakHewan(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
