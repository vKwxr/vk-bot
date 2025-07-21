
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
      const channelId = context.channel?.id;
      
      // Verificar si es una reply para continuar conversación
      let isReply = false;
      let conversationContext = '';
      
      if (!isInteraction && context.reference) {
        const repliedMessage = await context.channel.messages.fetch(context.reference.messageId);
        if (repliedMessage.author.id === client.user.id) {
          isReply = true;
          conversationContext = repliedMessage.embeds[0]?.description || '';
        }
      }
      
      // Procesar la pregunta para generar respuesta contextual
      let respuesta = await this.generateAIResponse(pregunta, userId, db, isReply, conversationContext);
      
      // Determinar si necesita imagen o GIF
      const needsImage = this.needsVisualContent(pregunta);
      let imageUrl = null;
      
      if (needsImage) {
        imageUrl = await this.getContextualImage(pregunta, client);
      }

      // Usar indicador de typing para ser más dinámico
      if (!isInteraction) {
        await context.channel.sendTyping();
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simular typing
      }

      const embed = new EmbedBuilder()
        .setTitle(isReply ? '🔄 VK AI (Conversación)' : '🧠 VK AI')
        .setDescription(respuesta)
        .setColor('#9966ff')
        .setFooter({ text: isReply ? 'VK AI • Continuando conversación' : 'VK AI • Nueva conversación' })
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
        .setDescription('No pude procesar tu pregunta en este momento.')
        .setColor('#ff0000');

      return isInteraction 
        ? await context.reply({ embeds: [errorEmbed], ephemeral: true })
        : await context.reply({ embeds: [errorEmbed] });
    }
  },

  async generateAIResponse(pregunta, userId, db, isReply = false, conversationContext = '') {
    const lowerPregunta = pregunta.toLowerCase();
    

    if (lowerPregunta.match(/\b(programar|código|javascript|python|programación|desarrollo)\b/)) {
      return "💻 ¿Qué necesitas saber sobre programación? Puedo ayudarte con JavaScript, Python y más.";
    }

    if (lowerPregunta.match(/\b(matemáticas|calcular|suma|resta|multiplicar|dividir)\b/)) {
      return "🧮 ¿Qué cálculo necesitas? Puedo ayudarte con operaciones básicas.";
    }

    if (lowerPregunta.includes('discord')) {
      return "🎮 ¿Qué quieres saber sobre Discord o VK Community?";
    }

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

    // Preguntas sobre juegos
    if (lowerPregunta.match(/\b(juego|game|jugar|gaming|videojuegos)\b/)) {
      return "🎮 ¡Los videojuegos son geniales! ¿Juegas algo en particular? En VK Community tenemos varios comandos de diversión y juegos que puedes probar.";
    }

    // Preguntas sobre música
    if (lowerPregunta.match(/\b(música|canción|artista|álbum|spotify)\b/)) {
      return "🎵 La música es universal. ¿Tienes algún género favorito? Me encanta escuchar sobre los gustos musicales de la comunidad.";
    }

    // Preguntas existenciales o filosóficas
    if (lowerPregunta.match(/\b(sentido de la vida|propósito|filosofía|existir|por qué)\b/)) {
      return "🤔 Preguntas profundas... Como IA, veo el valor en las conexiones que creamos, el conocimiento que compartimos y las experiencias que vivimos juntos en comunidades como esta.";
    }

    // Respuestas más concisas
    return this.getShortResponse(pregunta);
  },

  getShortResponse(pregunta) {
    const respuestas = [
      `Es interesante. ¿Quieres más detalles?`,
      `Depende del contexto. ¿Puedes ser más específico?`,
      `Buena pregunta. ¿En qué aspecto te interesa más?`,
      `Hay varias perspectivas sobre esto.`,
      `¿Te refieres a algo específico?`
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
      if (!GIPHY_API_KEY) {
        return 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif';
      }

      let searchTerm = 'thinking';
      
      const lowerPregunta = pregunta.toLowerCase();
      if (lowerPregunta.includes('meme')) searchTerm = 'funny meme';
      else if (lowerPregunta.includes('celebr') || lowerPregunta.includes('fiesta')) searchTerm = 'celebration party';
      else if (lowerPregunta.includes('triste')) searchTerm = 'sad crying';
      else if (lowerPregunta.includes('feliz')) searchTerm = 'happy smile';
      else if (lowerPregunta.includes('enojado')) searchTerm = 'angry mad';
      else if (lowerPregunta.includes('pregunta')) searchTerm = 'question thinking';

      const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
        params: {
          api_key: GIPHY_API_KEY,
          q: searchTerm,
          limit: 20,
          rating: 'pg',
          lang: 'es'
        },
        timeout: 5000
      });

      if (response.data?.data && response.data.data.length > 0) {
        const randomGif = response.data.data[Math.floor(Math.random() * response.data.data.length)];
        return randomGif.images.downsized_medium?.url || randomGif.images.original.url;
      }
    } catch (error) {
      console.error('Error obteniendo GIF de Giphy:', error.message);
    }
    
    return 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif';
  }
};
