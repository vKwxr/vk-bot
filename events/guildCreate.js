
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildCreate',
  once: false,
  async execute(guild, client) {
    console.log(`✅ Bot agregado a nuevo servidor: ${guild.name} (${guild.id})`);
    
    const MAIN_LOGS_CHANNEL = '1394028954527989939';
    const ADMIN_USER_ID = '880567084436844594'; 
    
    const logsChannel = client.channels.cache.get(MAIN_LOGS_CHANNEL);
    
    if (logsChannel) {
      const embed = new EmbedBuilder()
        .setTitle('🎉 Bot Agregado a Nuevo Servidor')
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '🏷️ Nombre', value: guild.name, inline: true },
          { name: '🆔 ID', value: guild.id, inline: true },
          { name: '👑 Propietario', value: `<@${guild.ownerId}>`, inline: true },
          { name: '👥 Miembros', value: guild.memberCount.toString(), inline: true },
          { name: '📅 Creado', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '📊 Total Servidores', value: `${client.guilds.cache.size}`, inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();

      await logsChannel.send({ 
        content: `<@${ADMIN_USER_ID}>`, 
        embeds: [embed] 
      });
    }
  }
};
