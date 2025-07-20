const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, client) {
    // Sistema de niveles por actividad en lugar de boost
    if (newMember.user.bot) return;

    try {
      const { levelsDb } = client.config;

      // Solo dar XP por actividad real (como estar en canales de voz)
      if (newMember.voice.channel && !oldMember.voice.channel) {
        levelsDb.get('SELECT * FROM levels WHERE user_id = ?', [newMember.id], (err, row) => {
          if (err) return;

          const currentXP = row ? row.xp : 0;
          const currentLevel = row ? row.level : 1;
          const xpGain = Math.floor(Math.random() * 15) + 5; // 5-20 XP por unirse a voz
          const newXP = currentXP + xpGain;
          const newLevel = Math.floor(newXP / 1000) + 1;

          if (row) {
            levelsDb.run('UPDATE levels SET xp = ?, level = ? WHERE user_id = ?', [newXP, newLevel, newMember.id]);
          } else {
            levelsDb.run('INSERT INTO levels (user_id, xp, level) VALUES (?, ?, ?)', [newMember.id, newXP, newLevel]);
          }

          // Notificar level up
          if (newLevel > currentLevel) {
            const levelUpEmbed = new EmbedBuilder()
              .setTitle('🆙 ¡Subiste de Nivel!')
              .setDescription(`¡Felicidades ${newMember}! Has alcanzado el **nivel ${newLevel}**`)
              .setColor('#00ff00')
              .setTimestamp();

            const generalChannel = newMember.guild.channels.cache.find(ch => ch.name.includes('general') || ch.name.includes('chat'));
            if (generalChannel) {
              generalChannel.send({ embeds: [levelUpEmbed] });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error en guildMemberUpdate:', error);
    }
  },
};