const { syncJugador } = require('./sync');
const pool = require('./db');

async function syncTodos() {
  const { rows } = await pool.query('SELECT steam_id64 FROM jugadores WHERE activo = true');

  console.log(`Sincronizando ${rows.length} jugador(es)...`);

  for (const jugador of rows) {
    try {
      const { nombre } = await syncJugador(jugador.steam_id64);
      console.log(`OK: ${nombre} (${jugador.steam_id64})`);
    } catch (err) {
      console.error(`FALLO con ${jugador.steam_id64}:`, err.message);
    }
    await new Promise(r => setTimeout(r, 500)); // throttling entre jugadores
  }

  console.log('Sync completo.');
  await pool.end();
}

syncTodos();