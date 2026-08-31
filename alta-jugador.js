const { syncJugador } = require('./sync');
const pool = require('./db');

const steamId64 = process.argv[2]; // lo pasamos como argumento al correr el comando

if (!steamId64) {
  console.error('Uso: node alta-jugador.js <steamId64>');
  process.exit(1);
}

syncJugador(steamId64)
  .then(({ nombre, jugadorId }) => {
    console.log(`Alta exitosa: ${nombre} (id interno: ${jugadorId})`);
  })
  .catch(err => console.error('Error:', err.message))
  .finally(() => pool.end());