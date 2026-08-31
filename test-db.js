const pool = require('./db');

async function testDB() {
  const result = await pool.query('SELECT NOW()');
  console.log('Conexión exitosa. Hora del servidor:', result.rows[0].now);
  await pool.end();
}

testDB();