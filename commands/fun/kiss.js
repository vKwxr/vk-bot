const path = require('path');

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kiss')
    .setDescription('💋 Besa a alguien de manera dulce')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a quien besar')
        .setRequired(true)
    ),

  name: 'kiss',
  description: 'Besa a alguien',
  usage: 'vk kiss @usuario',

  async execute(interaction, client) {
    const target = interaction.options.getUser('usuario');
    await this.handleKiss(interaction, interaction.user, target, client);
  },

  async run(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply('❌ **Debes mencionar a alguien**\n📝 Uso: `vk kiss @usuario`');
    }
    await this.handleKiss(message, message.author, target, client);
  },

  async handleKiss(context, author, target, client) {
    if (target.id === author.id) {
      return context.reply('😅 ¡No puedes besarte a ti mismo! Encuentra a alguien especial.');
    }

    const gifUrl = await this.getGiphyGif('anime kiss', client);

    const embed = new EmbedBuilder()
      .setTitle('💋 ¡Beso Dulce!')
      .setDescription(`${author} le da un tierno beso a ${target} 💕`)
      .setImage(gifUrl)
      .setColor('#FF69B4')
      .setFooter({ text: 'VK Community • Reacciona para responder' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_kiss_${author.id}_${target.id}`)
          .setLabel('💋 Aceptar Beso')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject_kiss_${author.id}_${target.id}`)
          .setLabel('👋 Rechazar')
          .setStyle(ButtonStyle.Danger)
      );

    const isInteraction = context.replied !== undefined;
    const sentMessage = isInteraction 
      ? await context.reply({ embeds: [embed], components: [row] })
      : await context.reply({ embeds: [embed], components: [row] });

    const message = isInteraction ? await context.fetchReply() : sentMessage;

    const filter = i => 
      (i.customId.startsWith('accept_kiss') || i.customId.startsWith('reject_kiss')) &&
      i.user.id === target.id;

    const collector = message.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      const [action] = i.customId.split('_');
      
      if (action === 'accept') {
        await i.update({
          content: `💋🥰 ${author} y ${target} se dieron un dulce beso`,
          embeds: [],
          components: []
        });
      } else if (action === 'reject') {
        const slapGif = await this.getGiphyGif('anime slap', client);
        
        const rejectEmbed = new EmbedBuilder()
          .setDescription(`👋😠 ${target} le da una cachetada a ${author}`)
          .setImage(slapGif)
          .setColor('#FF0000');

        await i.update({
          content: null,
          embeds: [rejectEmbed],
          components: []
        });
      }
      collector.stop();
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        message.edit({ 
          content: '⏰ Tiempo agotado, nadie respondió', 
          embeds: [], 
          components: [] 
        });
      }
    });
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
