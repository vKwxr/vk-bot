
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('🤗 Abraza a alguien de manera tierna')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a quien abrazar')
        .setRequired(true)
    ),

  name: 'hug',
  description: 'Abraza a alguien',
  usage: 'vk hug @usuario',

  async execute(interaction, client) {
    const target = interaction.options.getUser('usuario');
    await this.handleHug(interaction, interaction.user, target, client);
  },

  async run(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply('❌ **Debes mencionar a alguien**\n📝 Uso: `vk hug @usuario`');
    }
    await this.handleHug(message, message.author, target, client);
  },

  async handleHug(context, author, target, client) {
    if (target.id === author.id) {
      return context.reply('🤔 ¡No puedes abrazarte a ti mismo! Encuentra a alguien más.');
    }

    const gifUrl = await this.getGiphyGif('anime hug', client);

    const embed = new EmbedBuilder()
      .setTitle('🤗 ¡Abrazo Tierno!')
      .setDescription(`${author} le da un cálido abrazo a ${target} 💕`)
      .setImage(gifUrl)
      .setColor('#FFC0CB')
      .setFooter({ text: 'VK Community • Reacciona para responder' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_hug_${author.id}_${target.id}`)
          .setLabel('🤗 Aceptar Abrazo')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject_hug_${author.id}_${target.id}`)
          .setLabel('👋 Rechazar')
          .setStyle(ButtonStyle.Danger)
      );

    const isInteraction = context.replied !== undefined;
    const sentMessage = isInteraction 
      ? await context.reply({ embeds: [embed], components: [row] })
      : await context.reply({ embeds: [embed], components: [row] });

    const message = isInteraction ? await context.fetchReply() : sentMessage;

    const filter = i => 
      (i.customId.startsWith('accept_hug') || i.customId.startsWith('reject_hug')) &&
      i.user.id === target.id;

    const collector = message.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      const [action] = i.customId.split('_');
      
      if (action === 'accept') {
        await i.update({
          content: `🤗💕 ${author} y ${target} se dieron un hermoso abrazo`,
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
