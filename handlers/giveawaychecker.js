const path = require('path');
async function finalizarSorteo(client, messageId) {
}

function initGiveawayChecker(client) {
  setInterval(() => {
    client.config.sorteosDb.all(
      `SELECT * FROM sorteos WHERE finaliza <= ?`,
      [Date.now()],
      async (err, rows) => {
        if (err) return console.error('Error leyendo sorteos:', err);
        for (const sorteo of rows) {
          await finalizarSorteo(client, sorteo.message_id);
          client.config.sorteosDb.run(`DELETE FROM sorteos WHERE message_id = ?`, [sorteo.message_id]);
        }
      }
    );
  }, 60 * 1000); 
}

module.exports = { initGiveawayChecker };
