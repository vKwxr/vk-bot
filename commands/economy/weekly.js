const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weekly')
    .setDescription('📅 Reclama tu recompensa semanal'),

  async execute(interaction, client) {
    const userId = interaction.user.id;
    const member = await interaction.guild.members.fetch(userId);

    // Lista de roles con bonus
    const rolesBonus = [
      { name: 'Patrocinador', bonus: 0.5 },
      { name: 'VIP', bonus: 0.25 }
    ];

    let bonusMultiplier = 0;
    for (const role of rolesBonus) {
      const guildRole = interaction.guild.roles.cache.find(r => r.name === role.name);
      if (guildRole && member.roles.cache.has(guildRole.id)) {
        bonusMultiplier += role.bonus;
      }
    }

    const { economyDb } = client.config;

    economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (err) {
          console.error(err);
          return interaction.reply({
            content: '❌ Error al acceder a la base de datos.',
            ephemeral: true
          });
        }

        const now = new Date();
        const lastWeekly = row?.last_weekly ? new Date(row.last_weekly) : null;

        // Validar si ya lo reclamó
        if (lastWeekly && (now - lastWeekly) < 7 * 24 * 60 * 60 * 1000) {
          const timeLeft = 7 * 24 * 60 * 60 * 1000 - (now - lastWeekly);
          const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

          const embed = new EmbedBuilder()
            .setTitle('⏰ Recompensa Semanal')
            .setDescription(`Ya reclamaste tu recompensa semanal.\nPodrás volver en **${hoursLeft}h ${minutesLeft}m**`)
            .setColor('#ff4444')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

          return interaction.reply({ embeds: [embed] });
        }

        // Cálculo de recompensa
        const baseReward = Math.floor(Math.random() * 4001) + 3000; // 3000 - 7000
        const bonusExtra = Math.floor(baseReward * bonusMultiplier);
        const bonusRandom = Math.floor(Math.random() * 2001); // 0 - 2000
        const totalReward = baseReward + bonusExtra + bonusRandom;

        // Guardar en la DB
        if (row) {
          economyDb.run(
            `UPDATE economy SET wallet = wallet + ?, last_weekly = ? WHERE user_id = ?`,
            [totalReward, now.toISOString(), userId]
          );
        } else {
          economyDb.run(
            `INSERT INTO economy (user_id, wallet, last_weekly) VALUES (?, ?, ?)`,
            [userId, totalReward, now.toISOString()]
          );
        }

        const embed = new EmbedBuilder()
          .setTitle('📅 Recompensa Semanal Reclamada')
          .setDescription(`¡Has recibido tu recompensa semanal!`)
          .addFields(
            { name: '💰 Base', value: `**${baseReward.toLocaleString()}** monedas`, inline: true },
            { name: '🎁 Bonus rol', value: `**${bonusExtra.toLocaleString()}** monedas`, inline: true },
            { name: '🍀 Bonus random', value: `**${bonusRandom.toLocaleString()}** monedas`, inline: true },
            { name: '🏆 Total', value: `**${totalReward.toLocaleString()}** monedas`, inline: false }
          )
          .setColor('#00ff88')
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: 'Vuelve en 7 días para más monedas 🤑' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    );
  }
};
