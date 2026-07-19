'use strict';

const { fetchPokemonPool } = require('../../services/gamePokemonService');
const { buildClue }        = require('../../utils/quizUtils');
const { logKeyUsage }      = require('../../utils/keyLogger');

async function handleTebakPokemon(req, params, res) {
  const pool    = await fetchPokemonPool();
  const pokemon = pool[Math.floor(Math.random() * pool.length)];

  await logKeyUsage(req, '/api/game/tebak-pokemon');
  res.json({
    success: true,
    data: {
      category: 'pokemon',
      question: 'Pokemon apakah ini?',
      image: pokemon.image,
      answer: pokemon.name,
      clue: buildClue(pokemon.name),
      meta: { id: Number(pokemon.id) },
    },
  });
}

module.exports = {
  routes: [
    {
      method:     'GET',
      path:       '/game/tebak-pokemon',
      middleware: ['requireApiKey'],

      async handler(req, res) {
        try {
          await handleTebakPokemon(req, req.query, res);
        } catch (err) {
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }
      },
    },
  ],
};
