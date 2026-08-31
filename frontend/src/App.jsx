import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/jugadores')
      .then(res => res.json())
      .then(data => {
        setJugadores(data);
        setCargando(false);
      })
      .catch(err => {
        console.error('Error cargando jugadores:', err);
        setCargando(false);
      });
  }, []);

  if (cargando) return <p>Cargando jugadores...</p>;

  return (
    <div>
      <h1>CS2database</h1>
      <div className="lista-jugadores">
        {jugadores.map(j => (
          <div key={j.id} className="tarjeta-jugador">
            <h2>{j.steam_display_name}</h2>
            <p>
              STEAM {j.steam_perfil_publico ? '✓' : '◐'} &nbsp;
              FACEIT {j.faceit_player_id ? '✓' : '✗'}
            </p>

            <div className="bloque-steam">
              <h3>Steam</h3>
              <p>KD: {j.kd ?? 'N/D'} | HS%: {j.hs_pct ? `${j.hs_pct}%` : 'N/D'}</p>
              <p>Winrate: {j.winrate_steam ? `${j.winrate_steam}%` : 'N/D'}</p>
              <p>Horas jugadas: {j.horas_jugadas ?? 'N/D'}</p>
              <p>Bans: {j.vac_ban ? 'VAC ban' : 'Ninguno'}</p>
              {j.fecha_creacion_steam && (
                <p>Cuenta creada: {new Date(j.fecha_creacion_steam).toLocaleDateString('es-AR')}</p>
              )}
              {j.ultima_conexion_steam && (
                <p>Última conexión: {new Date(j.ultima_conexion_steam).toLocaleDateString('es-AR')}</p>
              )}
            </div>

            {j.faceit_player_id && (
              <div className="bloque-faceit">
                <h3>FACEIT</h3>
                <p>Nivel {j.faceit_nivel} | {j.faceit_elo} ELO</p>
                <p>KD: {j.kd_faceit ?? 'N/D'} | HS%: {j.hs_pct_faceit ? `${j.hs_pct_faceit}%` : 'N/D'}</p>
                <p>Winrate: {j.winrate ? `${j.winrate}%` : 'N/D'} ({j.matches_faceit ?? '?'} partidas)</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;