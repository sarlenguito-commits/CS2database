import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Gamepad2, Flame, Skull } from 'lucide-react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://cs2database-backend.onrender.com');

const IMAGENES_FONDO = [
  '/images/bg-warzone.jpg',
  '/images/bg-warzone1.jpg',
  '/images/bg-warzone2.jpg',
  '/images/bg-warzone3.jpg',
  '/images/bg-warzone4.jpg',
  '/images/bg-warzone5.jpg',
];
const ALTURA_FRANJA = 800;

function calcularEstiloJuego(horas, nivel) {
  if (!horas || !nivel) return null;
  const horasPorNivel = horas / nivel;
  if (horasPorNivel > 100) return 'Grindeador';
  if (horasPorNivel < 40) return 'Eficiente';
  return 'Casual';
}

function codigoPaisNormalizado(codigoPais) {
  if (!codigoPais || codigoPais.length !== 2) return null;
  return codigoPais.toLowerCase();
}

function mostrarValor(valor, sufijo = '') {
  if (valor === null || valor === undefined) return '—';
  return `${valor}${sufijo}`;
}

function extraerSteamId(input) {
  const texto = input.trim();
  const matchUrl = texto.match(/profiles\/(\d{17})/);
  if (matchUrl) return matchUrl[1];
  if (/^\d{17}$/.test(texto)) return texto;
  return null;
}

function extraerVanityUrl(input) {
  const texto = input.trim();
  const matchUrl = texto.match(/\/id\/([^/]+)/);
  if (matchUrl) return matchUrl[1];
  return null;
}

function ModalPrivacidad({ onAceptar }) {
  return (
    <div className="overlay-modal">
      <div className="modal-privacidad">
        <h2>Antes de continuar</h2>

        <h3>¿Qué es CS2database?</h3>
        <p>
          Un proyecto independiente, sin fines comerciales, armado para uso interno de este grupo.
        </p>

        <h3>¿Qué datos usa?</h3>
        <p>
          Únicamente información pública que las APIs oficiales de FACEIT y Steam devuelven a partir
          del perfil que vos mismo vinculás: nivel y ELO de FACEIT, estadísticas de tus partidas de
          CS2 (K/D, HS%, winrate), historial de bans (VAC/FACEIT), horas jugadas y tu nickname actual.
        </p>

        <h3>¿Qué pasa si tengo el perfil de Steam en privado?</h3>
        <p>
          Igual quedás dado de alta con lo que FACEIT sí puede exponer. Las estadísticas de juego de
          Steam (K/D, HS%, winrate, armas) van a mostrarse como "N/D" hasta que hagas público tu
          perfil — no se intenta obtener ese dato por otra vía.
        </p>

        <h3>¿Qué NO usa?</h3>
        <p>
          No pedimos ni accedemos a tu mail, contraseña, ni ningún dato de tu cuenta. Lo único que
          necesitamos es tu nickname de FACEIT o el link de tu perfil de Steam — el mismo que
          cualquiera puede ver entrando a tu perfil público.
        </p>

        <h3>¿Para qué se usa?</h3>
        <p>
          Los datos se usan para armar comparaciones y evaluaciones dentro del grupo. No se comparten
          ni se venden a terceros, ni se usan con fines comerciales.
        </p>

        <h3>¿Cómo se actualiza?</h3>
        <p>
          Periódicamente, directo desde las APIs oficiales de FACEIT y Steam. No se modifica ni se
          completa con información de otras fuentes.
        </p>

        <h3>¿Me puedo bajar?</h3>
        <p>Cuando quieras. Pedímelo directamente y se elimina tu perfil de la base.</p>

        <hr />

        <p className="texto-confirmacion">Al continuar, confirmás que estás de acuerdo con lo anterior.</p>

        <button className="boton-aceptar" onClick={onAceptar}>Acepto y continúo</button>
      </div>
    </div>
  );
}

function FondoRepetido({ alturaPx }) {
  const cantidadFranjas = Math.max(1, Math.ceil(alturaPx / ALTURA_FRANJA) + 1);
  const franjas = Array.from({ length: cantidadFranjas }, (_, i) => IMAGENES_FONDO[i % IMAGENES_FONDO.length]);

  return (
    <div className="fondo-repetido" style={{ height: alturaPx }}>
      {franjas.map((src, i) => (
        <div
          key={i}
          className="franja-fondo"
          style={{ backgroundImage: `url(${src})`, top: i * ALTURA_FRANJA }}
        />
      ))}
    </div>
  );
}

function App() {
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [errorAlta, setErrorAlta] = useState(null);
  const [expandidos, setExpandidos] = useState({});
  const [alturaPagina, setAlturaPagina] = useState(0);
  const paginaRef = useRef(null);

  useEffect(() => {
    const yaAcepto = localStorage.getItem('cs2database_privacidad_aceptada');
    if (!yaAcepto) setMostrarModal(true);
  }, []);

  const handleAceptarModal = () => {
    localStorage.setItem('cs2database_privacidad_aceptada', 'true');
    setMostrarModal(false);
  };

  const cargarJugadores = () => {
    setCargando(true);
    fetch(`${API_URL}/api/jugadores`)
      .then(res => res.json())
      .then(data => {
        setJugadores(data);
        setCargando(false);
      })
      .catch(err => {
        console.error('Error cargando jugadores:', err);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarJugadores();
  }, []);

  // Recalcula la altura real de la página cada vez que cambia el contenido
  // (más jugadores, expandir "Ver más", etc.) para que el fondo repetido
  // siempre cubra hasta el final, sin cortarse.
  useLayoutEffect(() => {
    if (!paginaRef.current) return;
    const medir = () => setAlturaPagina(paginaRef.current.scrollHeight);
    medir();

    const observer = new ResizeObserver(medir);
    observer.observe(paginaRef.current);
    return () => observer.disconnect();
  }, [jugadores, expandidos, cargando]);

  const toggleExpandido = (id) => {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAgregarJugador = async (e) => {
    e.preventDefault();
    setErrorAlta(null);

    const steamId64 = extraerSteamId(inputUrl);
    const vanityUrl = !steamId64 ? extraerVanityUrl(inputUrl) : null;

    if (!steamId64 && !vanityUrl) {
      setErrorAlta('No pude reconocer un perfil de Steam válido en eso que pegaste.');
      return;
    }

    setAgregando(true);
    try {
      const res = await fetch(`${API_URL}/api/jugadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(steamId64 ? { steamId64 } : { vanityUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar el jugador');

      setInputUrl('');
      cargarJugadores();
    } catch (err) {
      setErrorAlta(err.message);
    } finally {
      setAgregando(false);
    }
  };

  return (
    <div className="pagina" ref={paginaRef}>
      <FondoRepetido alturaPx={alturaPagina} />

      {mostrarModal && <ModalPrivacidad onAceptar={handleAceptarModal} />}

      <h1>CS2database TNL</h1>

      <div className="bloque-legal">
        <button className="link-legal" onClick={() => setMostrarModal(true)}>
          Ver política de privacidad
        </button>
      </div>

      <form className="form-agregar" onSubmit={handleAgregarJugador}>
        <input
          type="text"
          placeholder="Pegá la URL del perfil de Steam o el SteamID64"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
        />
        <button type="submit" disabled={!inputUrl || agregando}>
          {agregando ? 'Agregando...' : 'Agregar jugador'}
        </button>
        {errorAlta && <p className="error-alta">{errorAlta}</p>}
      </form>

      {cargando ? (
        <p className="cargando">Cargando jugadores...</p>
      ) : (
        <div className="lista-jugadores">
          {jugadores.map(j => {
            const estiloJuego = calcularEstiloJuego(j.horas_jugadas, j.faceit_nivel);

            return (
              <div key={j.id} className="tarjeta-jugador">
                <div className="header-jugador">
                  {j.avatar_url && (
                    <img src={j.avatar_url} alt={j.faceit_nickname || j.steam_display_name} className="avatar-jugador" />
                  )}
                  <div>
                    <h2>{j.steam_display_name}</h2>
                    <p className="estado-plataformas">
                      STEAM {j.steam_perfil_publico ? '✓' : '◐'} &nbsp;
                      FACEIT {j.faceit_player_id ? '✓' : '✗'}
                    </p>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="bloque-steam">
                    <h3>
                      <Gamepad2 size={16} className="icono-titulo icono-steam" />
                      Steam
                    </h3>
                    <p>KD: {mostrarValor(j.kd)} | HS%: {mostrarValor(j.hs_pct, '%')}</p>
                    <p>Winrate: {mostrarValor(j.winrate_steam, '%')}</p>
                    <p>Horas jugadas: {mostrarValor(j.horas_jugadas)}</p>
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
                      <h3>
                        <Flame size={16} className="icono-titulo icono-faceit" />
                        FACEIT
                      </h3>

                      <div className="badges-faceit">
                        <span className="badge">Nivel {mostrarValor(j.faceit_nivel || null)} · {mostrarValor(j.faceit_elo || null)} ELO</span>
                        {j.ranking_pais > 0 && (
                          <span className="badge badge-pais">
                            {codigoPaisNormalizado(j.pais_faceit) && (
                              <span className={`fi fi-${codigoPaisNormalizado(j.pais_faceit)}`}></span>
                            )}
                            {j.pais_faceit?.toUpperCase()} · #{j.ranking_pais}
                          </span>
                        )}
                        {j.racha_actual > 0 && <span className="badge badge-racha">🔥 {j.racha_actual} seguidas</span>}
                        {j.mejor_racha > 0 && <span className="badge">Racha máx: {j.mejor_racha}</span>}
                        {estiloJuego && (
                          <span
                            className="badge badge-estilo"
                            title="Calculado cruzando horas jugadas en Steam vs nivel de FACEIT"
                          >
                            Estilo: {estiloJuego}
                          </span>
                        )}
                      </div>

                      <p>KD: {mostrarValor(j.kd_faceit)} | HS%: {mostrarValor(j.hs_pct_faceit, '%')}</p>
                      <p>Winrate: {mostrarValor(j.winrate, '%')} ({mostrarValor(j.matches_faceit)} partidas)</p>
                      {j.mvps_promedio && <p>MVPs promedio: {j.mvps_promedio} por partida</p>}
                      {j.ultima_partida_faceit && (
                        <p>Última partida: {new Date(j.ultima_partida_faceit).toLocaleDateString('es-AR')}</p>
                      )}
                    </div>
                  )}
                </div>

                {j.armas && j.armas.filter(a => a.kills > 0).length > 0 && (
                  <div className="seccion-expandible">
                    <button
                      className="boton-expandir"
                      onClick={() => toggleExpandido(j.id)}
                    >
                      {expandidos[j.id] ? '▲ Ver menos' : '▼ Ver más'}
                    </button>

                    {expandidos[j.id] && (
                      <div className="contenido-expandido">
                        <h4>Armas favoritas</h4>
                        <div className="top-armas">
                          {j.armas
                            .filter(a => a.kills > 0)
                            .slice(0, 5)
                            .map(a => (
                              <span key={a.arma} className="badge-arma">
                                {a.arma.toUpperCase()}
                                <span className="kills-arma">
                                  <Skull size={11} />
                                  {a.kills} kills
                                </span>
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <footer className="footer-pagina">
        <p>© {new Date().getFullYear()} Esteban Sarlengo · Todos los derechos reservados</p>
        <p className="footer-nota">
          Proyecto en mejora continua · Próximamente: buscador de grupo y armador de lobbys
        </p>
      </footer>
    </div>
  );
}

export default App;
