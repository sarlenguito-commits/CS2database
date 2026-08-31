const pool = require('./db');
require('dotenv').config();

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`Fetch fallido (${res.status}): ${url} — ${texto.slice(0, 200)}`);
  }
  return res.json();
}

async function syncJugador(steamId64) {
  const fechaSnapshot = new Date();

  const steamPlayer = (await fetchJSON(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId64}`
  )).response.players[0];

  const esPublico = steamPlayer.communityvisibilitystate === 3;
  const fechaCreacion = steamPlayer.timecreated ? new Date(steamPlayer.timecreated * 1000) : null;
  const ultimaConexion = steamPlayer.lastlogoff ? new Date(steamPlayer.lastlogoff * 1000) : null;

  const bans = (await fetchJSON(
    `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${process.env.STEAM_API_KEY}&steamids=${steamId64}`
  )).players[0];

  const ownedData = await fetchJSON(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamId64}&include_played_free_games=1`
  );
  const juegos = ownedData.response?.games || [];
  const cs2 = juegos.find(j => j.appid === 730);
  const horasJugadas = cs2 ? (cs2.playtime_forever / 60).toFixed(1) : null;

  let kd = null, hsPct = null, winrateSteam = null, armas = [];
  if (esPublico) {
    try {
      const statsData = await fetchJSON(
        `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?appid=730&key=${process.env.STEAM_API_KEY}&steamid=${steamId64}`
      );
      const stats = statsData.playerstats?.stats || [];
      const buscar = (nombre) => stats.find(s => s.name === nombre)?.value ?? null;

      const totalKills = buscar('total_kills') || 0;
      const totalDeaths = buscar('total_deaths') || 0;
      const totalHeadshots = buscar('total_kills_headshot') || 0;
      const partidasJugadas = buscar('total_matches_played');
      const partidasGanadas = buscar('total_matches_won');

      kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : null;
      hsPct = totalKills > 0 ? ((totalHeadshots / totalKills) * 100).toFixed(2) : null;
      winrateSteam = (partidasJugadas && partidasGanadas)
        ? ((partidasGanadas / partidasJugadas) * 100).toFixed(2)
        : null;

      const armasClave = ['ak47', 'awp', 'm4a1', 'deagle', 'glock', 'usp'];
      armas = armasClave.map(arma => ({ arma, kills: buscar(`total_kills_${arma}`) || 0 }));
    } catch (err) {
      console.log(`  (stats de juego no disponibles para este perfil: ${err.message})`);
    }
  }

  let faceitPlayerId = null, faceitNickname = null, faceitNivel = null, faceitElo = null, winrateFaceit = null;
  let kdFaceit = null, hsPctFaceit = null, matchesFaceit = null;

  const faceitRes = await fetch(
    `https://open.faceit.com/data/v4/players?game=cs2&game_player_id=${steamId64}`,
    { headers: { Authorization: `Bearer ${process.env.FACEIT_API_KEY}` } }
  );

  if (faceitRes.ok) {
    const faceitData = await faceitRes.json();
    faceitPlayerId = faceitData.player_id;
    faceitNickname = faceitData.nickname;
    faceitNivel = faceitData.games.cs2.skill_level;
    faceitElo = faceitData.games.cs2.faceit_elo;

    const faceitStatsRes = await fetch(
      `https://open.faceit.com/data/v4/players/${faceitPlayerId}/stats/cs2`,
      { headers: { Authorization: `Bearer ${process.env.FACEIT_API_KEY}` } }
    );
    if (faceitStatsRes.ok) {
      const faceitStatsData = await faceitStatsRes.json();
      winrateFaceit = faceitStatsData.lifetime['Win Rate %'];
      kdFaceit = faceitStatsData.lifetime['Average K/D Ratio'];
      hsPctFaceit = faceitStatsData.lifetime['Average Headshots %'];
      matchesFaceit = faceitStatsData.lifetime['Matches'];
    }
  }

  const jugadorResult = await pool.query(
    `INSERT INTO jugadores (steam_id64, steam_display_name, steam_perfil_publico, faceit_player_id, faceit_nickname, fecha_creacion_steam, ultima_conexion_steam, ultima_actualizacion)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (steam_id64) DO UPDATE SET
       steam_display_name = EXCLUDED.steam_display_name,
       steam_perfil_publico = EXCLUDED.steam_perfil_publico,
       faceit_player_id = EXCLUDED.faceit_player_id,
       faceit_nickname = EXCLUDED.faceit_nickname,
       ultima_conexion_steam = EXCLUDED.ultima_conexion_steam,
       ultima_actualizacion = now()
     RETURNING id`,
    [steamId64, steamPlayer.personaname, esPublico, faceitPlayerId, faceitNickname, fechaCreacion, ultimaConexion]
  );
  const jugadorId = jugadorResult.rows[0].id;

  await pool.query(
    `INSERT INTO historial_stats (jugador_id, fecha_snapshot, faceit_nivel, faceit_elo, kd, hs_pct, winrate, winrate_steam, horas_jugadas, vac_ban, game_ban_count, kd_faceit, hs_pct_faceit, matches_faceit)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [jugadorId, fechaSnapshot, faceitNivel, faceitElo, kd, hsPct, winrateFaceit, winrateSteam, horasJugadas, bans.VACBanned, bans.NumberOfGameBans, kdFaceit, hsPctFaceit, matchesFaceit]
  );

  for (const a of armas) {
    await pool.query(
      `INSERT INTO historial_armas (jugador_id, fecha_snapshot, arma, kills_totales) VALUES ($1, $2, $3, $4)`,
      [jugadorId, fechaSnapshot, a.arma, a.kills]
    );
  }

  return { jugadorId, nombre: steamPlayer.personaname };
}

module.exports = { syncJugador };