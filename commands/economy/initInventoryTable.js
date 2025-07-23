const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./economy.sqlite');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      user_id TEXT PRIMARY KEY,
      items TEXT
    )
  `, err => {
    if (err) return console.error('❌ Error creando tabla inventory:', err);
    console.log('✅ Tabla inventory creada correctamente.');
  });
});

db.close();
