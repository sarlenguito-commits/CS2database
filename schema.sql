-- ============================================================
-- CS2database - Esquema de base de datos (versión actualizada)
-- ============================================================

-- Tabla principal: estado ACTUAL de cada jugador (una fila por persona)
CREATE TABLE jugadores (
    id                     SERIAL PRIMARY KEY,

    -- Steam es obligatorio: todo jugador tiene que tener esto
    steam_id64             VARCHAR(20) UNIQUE NOT NULL,
    steam_display_name     VARCHAR(100),
    steam_perfil_publico   BOOLEAN DEFAULT false,
    fecha_creacion_steam   TIMESTAMP,
    ultima_conexion_steam  TIMESTAMP,

    -- FACEIT es opcional: puede no existir para este jugador
    faceit_player_id       VARCHAR(50) UNIQUE,
    faceit_nickname        VARCHAR(100),

    -- Metadata del jugador dentro de la app
    activo                 BOOLEAN DEFAULT true,
    tags                   TEXT,

    fecha_alta             TIMESTAMP NOT NULL DEFAULT now(),
    ultima_actualizacion   TIMESTAMP
);

-- Historial de stats: una fila NUEVA por cada sync, nunca se pisa
CREATE TABLE historial_stats (
    id                SERIAL PRIMARY KEY,
    jugador_id        INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
    fecha_snapshot    TIMESTAMP NOT NULL DEFAULT now(),

    -- Nullable: si el jugador no tiene FACEIT, estos quedan vacíos
    faceit_nivel      SMALLINT,
    faceit_elo        INTEGER,
    kd_faceit         NUMERIC(5,2),
    hs_pct_faceit     NUMERIC(5,2),
    winrate           NUMERIC(5,2),   -- winrate de FACEIT
    matches_faceit    INTEGER,
    racha_actual      SMALLINT,
    mejor_racha       SMALLINT,
    mvps_promedio     NUMERIC(5,2),
    ranking_pais      INTEGER,
    mejor_mapa        VARCHAR(50),
    avatar_url        TEXT,
    pais_faceit       VARCHAR(5),

    -- Nullable: si Steam está privado, no hay dato disponible
    kd                NUMERIC(5,2),
    hs_pct            NUMERIC(5,2),
    winrate_steam     NUMERIC(5,2),
    horas_jugadas     NUMERIC(8,1),

    -- Siempre disponibles vía Steam, público o privado
    vac_ban           BOOLEAN DEFAULT false,
    game_ban_count    SMALLINT DEFAULT 0
);

-- Historial de kills por arma: una fila por arma, por snapshot
CREATE TABLE historial_armas (
    id                SERIAL PRIMARY KEY,
    jugador_id        INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
    fecha_snapshot    TIMESTAMP NOT NULL DEFAULT now(),
    arma              VARCHAR(30) NOT NULL,
    kills_totales     INTEGER DEFAULT 0
);

-- Índices para que las consultas más comunes sean rápidas
CREATE INDEX idx_historial_stats_jugador ON historial_stats(jugador_id);
CREATE INDEX idx_historial_armas_jugador ON historial_armas(jugador_id);
CREATE INDEX idx_jugadores_steam_id ON jugadores(steam_id64);