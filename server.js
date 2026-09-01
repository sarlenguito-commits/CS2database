const express = require('express');
const cors = require('cors');
const pool = require('./db');
const cron = require('node-cron');
const { syncJugador, resolverVanityUrl, syncTodosLosJugadores } = require('./sync');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/jugadores -> lista de todos los jugadores activos con su último snapshot
app.get('/api/jugadores', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT j.id, j.steam_id64, j.steam_display_name, j.steam_perfil_publico,
             j.faceit_player_id, j.faceit_nickname, j.tags, j.ultima_actualizacion,
             j.fecha_creacion_steam, j.ultima_conexion_steam,
             hs.faceit_nivel, hs.faceit_elo, hs.kd, hs.hs_pct, hs.winrate,
             hs.winrate_steam, hs.horas_jugadas, hs.vac_ban, hs.game_ban_count,
             hs.kd_faceit, hs.hs_pct_faceit, hs.matches_faceit,
             hs.racha_actual, hs.mejor_racha, hs.mvps_promedio, hs.ranking_pais,
             hs.mejor_mapa, hs.avatar_url, hs.pais_faceit, hs.ultima_partida_faceit,
             armasagg.armas
      FROM jugadores j
      LEFT JOIN LATERAL (
        SELECT * FROM historial_stats hs2
        WHERE hs2.jugador_id = j.id
        ORDER BY id DESC
        LIMIT 1
      ) hs ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('arma', arma, 'kills', kills_totales) ORDER BY kills_totales DESC) AS armas
        FROM historial_armas ha
        WHERE ha.jugador_id = j.id
          AND ha.fecha_snapshot = (SELECT MAX(fecha_snapshot) FROM historial_armas WHERE jugador_id = j.id)
      ) armasagg ON true
      WHERE j.activo = true
      ORDER BY j.steam_display_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jugadores/:id -> detalle de un jugador, incluyendo sus armas
app.get('/api/jugadores/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const jugadorRes = await pool.query(`
      SELECT j.*, hs.faceit_nivel, hs.faceit_elo, hs.kd, hs.hs_pct, hs.winrate,
             hs.winrate_steam, hs.horas_jugadas, hs.vac_ban, hs.game_ban_count,
             hs.kd_faceit, hs.hs_pct_faceit, hs.matches_faceit,
             hs.racha_actual, hs.mejor_racha, hs.mvps_promedio, hs.ranking_pais,
             hs.mejor_mapa, hs.avatar_url, hs.pais_faceit, hs.ultima_partida_faceit
      FROM jugadores j
      LEFT JOIN LATERAL (
        SELECT * FROM historial_stats hs2
        WHERE hs2.jugador_id = j.id
        ORDER BY id DESC
        LIMIT 1
      ) hs ON true
      WHERE j.id = $1
    `, [id]);

    if (jugadorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    const armasRes = await pool.query(`
      SELECT arma, kills_totales FROM historial_armas
      WHERE jugador_id = $1
        AND fecha_snapshot = (SELECT MAX(fecha_snapshot) FROM historial_armas WHERE jugador_id = $1)
    `, [id]);

    res.json({ ...jugadorRes.rows[0], armas: armasRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jugadores/:id/historial-elo -> evolución de nivel/ELO de FACEIT en el tiempo
app.get('/api/jugadores/:id/historial-elo', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT fecha_snapshot, faceit_nivel, faceit_elo
      FROM historial_stats
      WHERE jugador_id = $1
        AND faceit_elo IS NOT NULL
      ORDER BY fecha_snapshot ASC
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jugadores -> dar de alta un jugador nuevo por SteamID64 o vanity URL
app.post('/api/jugadores', async (req, res) => {
  try {
    let { steamId64, vanityUrl } = req.body;

    if (!steamId64 && vanityUrl) {
      steamId64 = await resolverVanityUrl(vanityUrl);
      if (!steamId64) {
        return res.status(404).json({ error: `No se encontró ningún perfil de Steam con el nombre "${vanityUrl}"` });
      }
    }

    if (!steamId64) {
      return res.status(400).json({ error: 'Falta steamId64 o vanityUrl' });
    }

    const resultado = await syncJugador(steamId64);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync automático 6 veces por día, cada 4 horas (hora de la PC)
cron.schedule('0 0,4,8,12,16,20 * * *', () => {
  console.log(`[Sync automático] Disparo programado de las ${new Date().toLocaleTimeString('es-AR')}`);
  syncTodosLosJugadores();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
  console.log('Sync automático programado para las 00, 04, 08, 12, 16 y 20 hs (mientras el backend esté corriendo)');
});