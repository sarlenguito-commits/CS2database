const pool = require('./db');
const { syncJugador } = require('./sync');
require('dotenv').config();

const steamId64 = process.argv[2] || '76561198129034232';

syncJugador(steamId64)
  .then((resultado) => {
    console.log(`Jugador sincronizado: ${resultado.nombre} (id interno: ${resultado.jugadorId})`);
    return pool.end();
  })
  .catch((err) => {
    console.error('Error en el sync:', err);
    process.exit(1);
  });