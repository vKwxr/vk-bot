const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sorteos.sqlite');

function getGiveawayData(messageId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM sorteos WHERE message_id = ?`, [messageId], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);

      try {
        const data = {
          channelId: row.channel_id,
          prize: row.premio,
          winners: row.ganadores,
          participants: JSON.parse(row.participantes || '[]')
        };

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}

function editGiveawayData(messageId, updates) {
  return new Promise((resolve, reject) => {
    const updateFields = [];
    const values = [];

    if (updates.winners !== undefined) {
      updateFields.push('ganadores = ?');
      values.push(updates.winners);
    }

    if (updates.prize !== undefined) {
      updateFields.push('premio = ?');
      values.push(updates.prize);
    }

    if (updateFields.length === 0) return resolve(false);

    values.push(messageId);

    const sql = `UPDATE sorteos SET ${updateFields.join(', ')} WHERE message_id = ?`;

    db.run(sql, values, function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

module.exports = {
  getGiveawayData,
  editGiveawayData
};
