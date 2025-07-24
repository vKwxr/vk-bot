const path = require('path');

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poke')
    .setDescription('👈 Hazle poke a alguien')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a quien hacerle poke')
        .setRequired(true)
    ),

  name: 'poke',
  description: 'Hazle poke a alguien',
  usage: 'vk poke @usuario',

  async execute(interaction, client) {
    const target = interaction.options.getUser('usuario');
    await this.handlePoke(interaction, interaction.user, target, client);
  },

  async run(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply('❌ **Debes mencionar a alguien**\n📝 Uso: `vk poke @usuario`');
    }
    await this.handlePoke(message, message.author, target, client);
  },

  async handlePoke(context, author, target, client) {
    if (target.id === author.id) {
      return context.reply('🤔 ¡No puedes hacerte poke a ti mismo!');
    }

    const gifUrl = await this.getGiphyGif('anime poke', client);

    const embed = new EmbedBuilder()
      .setTitle('👈 ¡Poke!')
      .setDescription(`${author} le hace poke a ${target} 👈✨`)
      .setImage(gifUrl)
      .setColor('#FFB6C1')
      .setFooter({ text: 'VK Community • ¡Poke poke!' })
      .setTimestamp();

    const isInteraction = context.replied !== undefined;
    return isInteraction 
      ? await context.reply({ embeds: [embed] })
      : await context.reply({ embeds: [embed] });
  },

  async getGiphyGif(searchTerm, client) {
    try {
      const { GIPHY_API_KEY } = client.config;
      const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
        params: {
          api_key: GIPHY_API_KEY,
          q: searchTerm,
          limit: 10,
          rating: 'pg'
        }
      });

      if (response.data.data && response.data.data.length > 0) {
        const randomGif = response.data.data[Math.floor(Math.random() * response.data.data.length)];
        return randomGif.images.original.url;
      }
    } catch (error) {
      console.error('Error obteniendo GIF de Giphy:', error);
    }
    
    return 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif';
  }
};
