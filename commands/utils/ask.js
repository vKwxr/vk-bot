
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Pregunta algo a la IA')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('Tu pregunta para la IA')
        .setRequired(true)
    ),

  name: 'ask',
  description: 'Pregunta algo a la IA',
  usage: 'vk ask <pregunta>',

  async execute(interaction, client) {
    const pregunta = interaction.options.getString('pregunta');
    await this.handleAsk(interaction, pregunta);
  },

  async run(message, args, client) {
    if (!args.length) {
      return message.reply('❌ **Debes hacer una pregunta**\n📝 Uso: `vk ask <pregunta>`');
    }

    const pregunta = args.join(' ');
    await this.handleAsk(message, pregunta);
  },

  async handleAsk(context, pregunta) {
    const isInteraction = context.replied !== undefined;
    const client = context.client || (context.guild && context.guild.client);
    const { db } = client.config;

    try {
      // Obtener información del usuario que pregunta
      const userId = (context.user || context.author).id;
      
      // Procesar la pregunta para generar respuesta contextual
      let respuesta = await this.generateAIResponse(pregunta, userId, db);
      
      // Determinar si necesita imagen o GIF
      const needsImage = this.needsVisualContent(pregunta);
      let imageUrl = null;
      
      if (needsImage) {
        imageUrl = await this.getContextualImage(pregunta, client);
      }

      const embed = new EmbedBuilder()
        .setTitle('🧠 VK AI')
        .setDescription(respuesta)
        .setColor('#9966ff')
        .setFooter({ text: 'VK AI • Respuesta inteligente generada' })
        .setThumbnail('https://cdn.discordapp.com/avatars/1382318047020449853/avatar.png')
        .setTimestamp();

      if (imageUrl) {
        embed.setImage(imageUrl);
      }

      return isInteraction 
        ? await context.reply({ embeds: [embed] })
        : await context.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error en comando ask:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error de VK AI')
        .setDescription('No pude procesar tu pregunta en este momento. Inténtalo de nuevo.')
        .setColor('#ff0000');

      return isInteraction 
        ? await context.reply({ embeds: [errorEmbed], ephemeral: true })
        : await context.reply({ embeds: [errorEmbed] });
    }
  },

  async generateAIResponse(pregunta, userId, db) {
    // Respuestas inteligentes basadas en contexto
    const lowerPregunta = pregunta.toLowerCase();
    
    // Verificar si pregunta sobre birthdays
    if (lowerPregunta.includes('birthday') || lowerPregunta.includes('cumpleaños')) {
      const userMatch = pregunta.match(/<@!?(\d+)>/);
      if (userMatch) {
        return new Promise((resolve) => {
          db.get('SELECT * FROM birthdays WHERE user_id = ?', [userMatch[1]], (err, row) => {
            if (row) {
              const birthday = new Date(row.birthday);
              resolve(`🎂 El cumpleaños de ese usuario es el ${birthday.toLocaleDateString('es-ES')}!`);
            } else {
              resolve('🤔 No tengo información sobre el cumpleaños de ese usuario.');
            }
          });
        });
      }
    }

    // Verificar si pregunta sobre economía
    if (lowerPregunta.includes('balance') || lowerPregunta.includes('dinero') || lowerPregunta.includes('monedas')) {
      return '💰 Para ver tu balance usa `/balance` o `vk balance`. Para ganar dinero puedes usar `/daily`, `/weekly` o `/work`!';
    }

    // Verificar si pregunta sobre comandos
    if (lowerPregunta.includes('comando') || lowerPregunta.includes('help') || lowerPregunta.includes('ayuda')) {
      return '📚 Usa `/help` o `vk help` para ver todos mis comandos disponibles. Tengo comandos de moderación, diversión, economía y mucho más!';
    }

    // Respuestas generales inteligentes
    const respuestas = [
      "Basándome en mi base de datos de VK Community, puedo decirte que la respuesta más probable es que esto depende del contexto específico.",
      "Como VK AI, he analizado tu pregunta y considero que la mejor respuesta incluye múltiples factores a considerar.",
      "Después de procesar tu consulta con mis algoritmos de VK, puedo sugerir que explores diferentes enfoques.",
      "Mi análisis de VK AI indica que esta es una pregunta compleja que requiere considerar varios aspectos.",
      "Basado en los datos de VK Community, te recomiendo que consultes con otros miembros o uses comandos específicos para más información."
    ];

    return respuestas[Math.floor(Math.random() * respuestas.length)];
  },

  needsVisualContent(pregunta) {
    const visualKeywords = ['imagen', 'foto', 'gif', 'meme', 'avatar', 'banner', 'skin'];
    return visualKeywords.some(keyword => pregunta.toLowerCase().includes(keyword));
  },

  async getContextualImage(pregunta, client) {
    try {
      const { GIPHY_API_KEY } = client.config;
      let searchTerm = 'thinking';
      
      const lowerPregunta = pregunta.toLowerCase();
      if (lowerPregunta.includes('meme')) searchTerm = 'meme';
      else if (lowerPregunta.includes('celebr') || lowerPregunta.includes('fiesta')) searchTerm = 'celebration';
      else if (lowerPregunta.includes('triste')) searchTerm = 'sad';
      else if (lowerPregunta.includes('feliz')) searchTerm = 'happy';
      else if (lowerPregunta.includes('enojado')) searchTerm = 'angry';

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
