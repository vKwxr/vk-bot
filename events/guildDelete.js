const path = require('path');

const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildDelete',
  once: false,
  async execute(guild, client) {
    console.log(`❌ Bot removido del servidor: ${guild.name} (${guild.id})`);
    
    const MAIN_LOGS_CHANNEL = '1394028954527989939';
    const ADMIN_USER_ID = '1394028954079461488';
    
    const logsChannel = client.channels.cache.get(MAIN_LOGS_CHANNEL);
    
    if (logsChannel) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Bot Removido de Servidor')
        .addFields(
          { name: '🏷️ Nombre', value: guild.name, inline: true },
          { name: '🆔 ID', value: guild.id, inline: true },
          { name: '👥 Miembros', value: guild.memberCount.toString(), inline: true },
          { name: '📊 Total Servidores', value: `${client.guilds.cache.size}`, inline: true }
        )
        .setColor('#ff0000')
        .setTimestamp();

      await logsChannel.send({ 
        content: `<@${ADMIN_USER_ID}>`, 
        embeds: [embed] 
      });
    }
  }
};
