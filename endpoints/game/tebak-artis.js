'use strict';

const { fetchArtistPool } = require('../../services/gameArtistService');
const { buildClue }       = require('../../utils/quizUtils');
const { logKeyUsage }     = require('../../utils/keyLogger');

async function handleTebakArtis(req, params, res) {
  const pool   = await fetchArtistPool();
  const artist = pool[Math.floor(Math.random() * pool.length)];

  await logKeyUsage(req, '/api/game/tebak-artis');
  res.json({
    success: true,
    data: {
      category: 'artist',
      question: 'Siapakah nama artis/musisi ini?',
      image: artist.picture_big,
      answer: artist.name,
      clue: buildClue(artist.name),
      meta: { fans: artist.nb_fan ?? null, link: artist.link ?? null },
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-artis',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakArtis(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
