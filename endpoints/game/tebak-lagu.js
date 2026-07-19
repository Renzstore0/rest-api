'use strict';

const { fetchSongPool } = require('../../services/gameSongService');
const { buildClue }     = require('../../utils/quizUtils');
const { logKeyUsage }   = require('../../utils/keyLogger');

async function handleTebakLagu(req, params, res) {
  const pool  = await fetchSongPool();
  const track = pool[Math.floor(Math.random() * pool.length)];

  await logKeyUsage(req, '/api/game/tebak-lagu');
  res.json({
    success: true,
    data: {
      category: 'song',
      question: 'Apa judul lagu ini?',
      image: track.album?.cover_big ?? null,
      answer: track.title,
      clue: buildClue(track.title),
      meta: { artist: track.artist?.name ?? null, preview: track.preview ?? null },
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-lagu',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakLagu(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
