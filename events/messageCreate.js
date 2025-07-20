const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    // Sistema AFK
    const userId = message.author.id;

    // Verificar si el usuario está AFK y removerlo
    client.config.db.get(
      `SELECT * FROM afk_users WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (row) {
          const tiempoAFK = new Date() - new Date(row.timestamp);
          const tiempoFormateado = Math.floor(tiempoAFK / 1000 / 60); // minutos

          client.config.db.run(
            `DELETE FROM afk_users WHERE user_id = ?`,
            [userId]
          );

          const embed = new EmbedBuilder()
            .setTitle('👋 Bienvenido de vuelta!')
            .setDescription(`${message.author} ya no está AFK`)
            .addFields(
              { name: '⏱️ Tiempo AFK', value: `${tiempoFormateado} minutos`, inline: true },
              { name: '💭 Razón anterior', value: row.reason, inline: true }
            )
            .setColor('#00ff00')
            .setTimestamp();

          const afkMessage = await message.channel.send({ embeds: [embed] });

          // Eliminar mensaje después de 5 segundos
          setTimeout(() => afkMessage.delete().catch(() => {}), 5000);
        }
      }
    );

    // Verificar menciones a usuarios AFK
    if (message.mentions.users.size > 0) {
      message.mentions.users.forEach(user => {
        if (user.bot) return;

        client.config.db.get(
          `SELECT * FROM afk_users WHERE user_id = ?`,
          [user.id],
          async (err, row) => {
            if (row) {
              const tiempoAFK = new Date() - new Date(row.timestamp);
              const tiempoFormateado = Math.floor(tiempoAFK / 1000 / 60);

              const embed = new EmbedBuilder()
                .setTitle('😴 Usuario AFK')
                .setDescription(`${user} está actualmente AFK`)
                .addFields(
                  { name: '💭 Razón', value: row.reason, inline: true },
                  { name: '⏱️ Desde hace', value: `${tiempoFormateado} minutos`, inline: true }
                )
                .setColor('#ffaa00')
                .setTimestamp();

              const afkNotice = await message.channel.send({ embeds: [embed] });

              // Eliminar aviso después de 10 segundos
              setTimeout(() => afkNotice.delete().catch(() => {}), 10000);
            }
          }
        );
      });
    }

    // Sistema de niveles (XP)
    if (message.guild) {
      // Dar XP aleatoria (15-25) por mensaje
      const xpGained = Math.floor(Math.random() * 10) + 15;

      client.config.levelsDb.get(
        `SELECT * FROM levels WHERE user_id = ?`,
        [userId],
        async (err, row) => {
          if (!row) {
            // Crear usuario en la base de datos
            client.config.levelsDb.run(
              `INSERT INTO levels (user_id, xp, level) VALUES (?, ?, ?)`,
              [userId, xpGained, 1]
            );
          } else {
            const newXp = row.xp + xpGained;
            const newLevel = Math.floor(newXp / 1000) + 1; // Cada 1000 XP = 1 nivel

            client.config.levelsDb.run(
              `UPDATE levels SET xp = ?, level = ? WHERE user_id = ?`,
              [newXp, newLevel, userId]
            );

            // Verificar si subió de nivel
            if (newLevel > row.level) {
              const levelUpEmbed = new EmbedBuilder()
                .setTitle('🎉 ¡Nivel Superior!')
                .setDescription(`¡Felicidades ${message.author}! Has alcanzado el **nivel ${newLevel}**`)
                .addFields(
                  { name: '⭐ Nivel anterior', value: `${row.level}`, inline: true },
                  { name: '🆕 Nuevo nivel', value: `${newLevel}`, inline: true },
                  { name: '💫 XP total', value: `${newXp}`, inline: true }
                )
                .setColor('#FFD700')
                .setThumbnail(message.author.displayAvatarURL())
                .setTimestamp();

              const levelMessage = await message.channel.send({ embeds: [levelUpEmbed] });

              // Eliminar después de 10 segundos
              setTimeout(() => levelMessage.delete().catch(() => {}), 10000);
            }
          }
        }
      );
    }
  },
};