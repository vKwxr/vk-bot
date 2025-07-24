const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 📁 Ruta a economy.db (asegúrate que esté en la raíz del proyecto)
const dbPath = path.join(__dirname, '..', 'economy.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
  } else {
    console.log('✅ Conectado a la base de datos economy.db');
    initializeTables();
  }
});

// 🛠️ Crear tablas si no existen
function initializeTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS levels (
        user_id TEXT,
        username TEXT,
        level INTEGER DEFAULT 1
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS economy (
        user_id TEXT,
        username TEXT,
        coins INTEGER DEFAULT 0
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS games (
        user_id TEXT,
        username TEXT,
        wins INTEGER DEFAULT 0
      )
    `);
  });
}

// 🏆 Top de niveles
function getTopLevels() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT username, level AS score FROM levels ORDER BY level DESC LIMIT 10`,
      [],
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
  });
}

// 🪙 Top de economía
function getTopCoins() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT username, coins AS score FROM economy ORDER BY coins DESC LIMIT 10`,
      [],
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
  });
}

// 🕹️ Top de juegos
function getTopGames() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT username, wins AS score FROM games ORDER BY wins DESC LIMIT 10`,
      [],
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
  });
}

module.exports = {
  db,
  getTopLevels,
  getTopCoins,
  getTopGames,
};
