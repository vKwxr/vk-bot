
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'guildMemberUpdate',
  
  async execute(oldMember, newMember, client) {
    // Detectar si alguien boosteó el servidor
    if (oldMember.premiumSince === null && newMember.premiumSince !== null) {
      await this.handleNewBoost(newMember, client);
    }
  },

  async handleNewBoost(member, client) {
    try {
      // Canal para enviar mensajes de boost (configurable)
      const boostChannelId = '1394028954527989938'; // Cambia esto por el ID del canal
      const boostChannel = member.guild.channels.cache.get(boostChannelId);
      
      if (!boostChannel) return;

      // Obtener GIF aleatorio de celebración
      const gifUrl = await this.getRandomBoostGif(client);

      const embed = new EmbedBuilder()
        .setTitle('🚀 ¡Nuevo Boost!')
        .setDescription(`🎉 **${member.user.username}** acaba de boostear el servidor!\n\n💜 ¡Gracias por tu apoyo!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage(gifUrl)
        .setColor('#ff73fa')
        .setFooter({ text: 'VK Community • ¡Eres increíble!' })
        .setTimestamp();

      await boostChannel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error manejando boost:', error);
    }
  },

  async getRandomBoostGif(client) {
    try {
      const { GIPHY_API_KEY } = client.config;
      const searchTerms = ['celebration', 'party', 'boost', 'rocket', 'fireworks'];
      const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

      const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
        params: {
          api_key: GIPHY_API_KEY,
          q: randomTerm,
          limit: 20,
          rating: 'pg'
        }
      });

      if (response.data.data && response.data.data.length > 0) {
        const randomGif = response.data.data[Math.floor(Math.random() * response.data.data.length)];
        return randomGif.images.original.url;
      }
    } catch (error) {
      console.error('Error obteniendo GIF de boost:', error);
    }
    
    return 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif';
  }
};
