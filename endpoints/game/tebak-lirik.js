'use strict';

const { pickLyricsQuestion } = require('../../services/gameLyricsGuessService');
const { buildClue }          = require('../../utils/quizUtils');
const { logKeyUsage }        = require('../../utils/keyLogger');

async function handleTebakLirik(req, params, res) {
  const { answer, snippet, artist, image } = await pickLyricsQuestion();

  await logKeyUsage(req, '/api/game/tebak-lirik');
  res.json({
    success: true,
    data: {
      category: 'lyrics',
      question: `Lagu apakah yang lirik reff/bait berikut ini?\n"${snippet}"`,
      image,
      answer,
      clue: buildClue(answer),
      meta: { artist },
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-lirik',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakLirik(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
