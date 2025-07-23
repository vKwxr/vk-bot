// utils/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Asegúrate de que la carpeta de la DB exista
const dbFolder = path.join(__dirname, '..'); // Cambia si prefieres guardar en otra carpeta
const dbPath = path.join(dbFolder, 'database.db');

// Si la base de datos no existe, se crea automáticamente
if (!fs.existsSync(dbPath)) {
  console.log('📦 Base de datos no encontrada. Creando nueva base de datos...');
  fs.writeFileSync(dbPath, '');
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite.');
  }
});

// Crear tablas si no existen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS automod (
    guild_id TEXT PRIMARY KEY,
    anti_invite INTEGER DEFAULT 0,
    anti_caps INTEGER DEFAULT 0,
    anti_spam INTEGER DEFAULT 0,
    anti_links INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS warns (
    guild_id TEXT,
    user_id TEXT,
    moderator_id TEXT,
    reason TEXT,
    timestamp INTEGER
  )`);
});

module.exports = db;
