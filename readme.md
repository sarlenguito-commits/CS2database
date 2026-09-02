# CS2database TNL

Plataforma tipo CRM para el seguimiento de estadísticas de un grupo de jugadores de Counter-Strike 2, con sincronización automática desde las APIs oficiales de **FACEIT** y **Steam**.

🔗 **Web en producción:** https://cs2databasetnl.onrender.com

---

## ¿Qué hace?

- Permite dar de alta un jugador pegando la URL de su perfil de Steam o su SteamID64.
- Sincroniza automáticamente, cada 4 horas, los datos públicos de FACEIT y Steam de todos los jugadores activos: nivel y ELO de FACEIT, K/D, HS%, winrate, horas jugadas, historial de bans, armas favoritas, entre otros.
- Si el perfil de Steam de un jugador está en privado, igual se da de alta con los datos de FACEIT disponibles; los campos de Steam se completan solos en el próximo sync si el jugador abre su perfil más adelante.
- Cruza horas jugadas vs. nivel de FACEIT para etiquetar el estilo de juego de cada jugador (Grindeador / Eficiente / Casual).

## Stack técnico

**Backend**
- Node.js + Express
- PostgreSQL (hosteado en [Neon](https://neon.tech), plan gratuito permanente)
- [`node-cron`](https://www.npmjs.com/package/node-cron) para el sync automático (00, 04, 08, 12, 16 y 20 hs)
- Desplegado en [Render](https://render.com)

**Frontend**
- React + Vite
- [`lucide-react`](https://lucide.dev/) para iconografía
- [`flag-icons`](https://github.com/lipis/flag-icons) para banderas de país
- Desplegado en Render como Static Site

## Estructura del repo

```
CS2database/
├── server.js          # Servidor Express + rutas de la API + cron del sync
├── db.js              # Conexión a PostgreSQL (Neon)
├── sync.js            # Lógica de sincronización con FACEIT y Steam
├── schema.sql          # Esquema de la base de datos
├── .env.example        # Plantilla de variables de entorno (sin datos reales)
└── frontend/
    ├── src/
    │   └── App.jsx      # UI principal: alta de jugadores + listado de tarjetas
    └── vite.config.js
```

## Variables de entorno

**Raíz del proyecto** (`.env`, no versionado — usar `.env.example` como plantilla):

| Variable | Descripción |
|---|---|
| `FACEIT_API_KEY` | API key de desarrollador de FACEIT ([developers.faceit.com](https://developers.faceit.com)) |
| `STEAM_API_KEY` | API key de Steam Web API |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Credenciales de conexión a la base en Neon |

**`frontend/`** (configurada en Render, no en el repo):

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend en producción. Si no está definida, el frontend detecta el entorno automáticamente por `hostname` (local vs. producción) |

## Correr en local

Backend (desde la raíz del proyecto):
```bash
node server.js
```

Frontend:
```bash
cd frontend
npm run dev
```

## Privacidad

El proyecto usa únicamente información pública expuesta por las APIs oficiales de FACEIT y Steam a partir del perfil que cada jugador vincula. No se accede a datos de cuenta (mail, contraseña), no se comparte información con terceros y cualquier jugador puede pedir la baja de su perfil en cualquier momento. Más detalle en el modal de política de privacidad dentro de la propia web.

## Roadmap

- [ ] CS Rating de Premier de CS2 (pausado — depende de que los jugadores vinculen su cuenta a un tracker de terceros)
- [ ] Buscador de grupo y armador de lobbys
- [ ] Comparación histórica y matcheo de equipos


- **Web en producción:** https://cs2databasetnl.onrender.com
  

---

© 2026 Esteban Sarlengo · Proyecto independiente, sin fines comerciales, para uso interno de un grupo de amigos.