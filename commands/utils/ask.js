
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
    const lowerPregunta = pregunta.toLowerCase();
    
    // Saludos
    if (lowerPregunta.match(/\b(hola|hi|hello|buenos días|buenas tardes|buenas noches|que tal|como estas)\b/)) {
      const saludos = [
        "¡Hola! 👋 Soy VK AI, tu asistente inteligente. ¿En qué puedo ayudarte hoy?",
        "¡Qué tal! 😊 Estoy aquí para responder tus preguntas y ayudarte con lo que necesites.",
        "¡Hola! 🤖 Soy la IA avanzada de VK Community. ¿Tienes alguna pregunta para mí?"
      ];
      return saludos[Math.floor(Math.random() * saludos.length)];
    }

    // Preguntas sobre el clima
    if (lowerPregunta.includes('clima') || lowerPregunta.includes('tiempo')) {
      return "🌤️ No tengo acceso a datos meteorológicos en tiempo real, pero te recomiendo usar una app del clima o Google para obtener información precisa sobre el tiempo en tu ubicación.";
    }

    // Preguntas sobre programación
    if (lowerPregunta.match(/\b(programar|código|javascript|python|programación|desarrollo|software)\b/)) {
      return "💻 ¡Me encanta hablar de programación! Puedo ayudarte con conceptos básicos, buenas prácticas y resolver dudas sobre diferentes lenguajes como JavaScript, Python, etc. ¿Hay algo específico que te gustaría saber?";
    }

    // Preguntas sobre matemáticas
    if (lowerPregunta.match(/\b(matemáticas|calcular|suma|resta|multiplicar|dividir|ecuación)\b/)) {
      return "🧮 Puedo ayudarte con matemáticas básicas y conceptos. Si necesitas cálculos específicos, puedes escribir la operación y te ayudo a resolverla.";
    }

    // Preguntas sobre Discord
    if (lowerPregunta.includes('discord')) {
      return "🎮 Discord es una plataforma increíble para comunidades. Aquí en VK Community tenemos muchas funciones geniales. ¿Te gustaría saber algo específico sobre Discord o sobre nuestro servidor?";
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

    // Respuestas contextuales específicas
    const respuestasInteligentes = [
      `🧠 Interesante pregunta sobre "${pregunta}". Basándome en mi conocimiento, puedo decirte que esto es un tema complejo que puede tener múltiples perspectivas.`,
      `🤖 He procesado tu consulta sobre "${pregunta}" y creo que la mejor forma de abordar esto es considerar diferentes factores y contextos.`,
      `💭 Tu pregunta me hace reflexionar. Sobre "${pregunta}", puedo sugerir que explores diferentes enfoques y busques múltiples fuentes de información.`,
      `📚 Respecto a "${pregunta}", mi análisis indica que esto requiere un enfoque cuidadoso y bien informado.`,
      `🔍 He analizado tu pregunta sobre "${pregunta}" y considero que la respuesta depende del contexto específico y los objetivos que tengas.`
    ];

    return respuestasInteligentes[Math.floor(Math.random() * respuestasInteligentes.length)];
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
