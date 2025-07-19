
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

    try {
      if (isInteraction) {
        await context.deferReply();
      }

      const embed = new EmbedBuilder()
        .setTitle('🤖 Pregunta a la IA')
        .setDescription('Procesando tu pregunta...')
        .setColor('#00ff00')
        .setTimestamp();

      const response = isInteraction 
        ? await context.editReply({ embeds: [embed] })
        : await context.reply({ embeds: [embed] });

      // Simular respuesta de IA (reemplazar con API real si tienes una)
      const respuestas = [
        "Esa es una excelente pregunta. Basándome en mi conocimiento, creo que...",
        "Interesante consulta. Desde mi perspectiva como IA, considero que...",
        "Me parece una pregunta muy reflexiva. Mi análisis sugiere que...",
        "Esa pregunta requiere una respuesta cuidadosa. En mi opinión...",
        "Excelente pregunta. Después de procesar la información, pienso que..."
      ];

      const respuestaBase = respuestas[Math.floor(Math.random() * respuestas.length)];
      const respuestaCompleta = `${respuestaBase} la respuesta depende del contexto específico de tu situación. Te recomiendo considerar múltiples perspectivas y consultar fuentes adicionales si necesitas información más detallada.`;

      const finalEmbed = new EmbedBuilder()
        .setTitle('🤖 Respuesta de la IA')
        .setDescription(`**Pregunta:** ${pregunta}\n\n**Respuesta:**\n${respuestaCompleta}`)
        .setColor('#0099ff')
        .setFooter({ text: 'VK Community IA • Respuesta generada' })
        .setTimestamp();

      setTimeout(async () => {
        if (isInteraction) {
          await context.editReply({ embeds: [finalEmbed] });
        } else {
          await response.edit({ embeds: [finalEmbed] });
        }
      }, 2000);

    } catch (error) {
      console.error('Error en comando ask:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('Hubo un error al procesar tu pregunta. Inténtalo de nuevo.')
        .setColor('#ff0000');

      if (isInteraction) {
        if (context.deferred) {
          await context.editReply({ embeds: [errorEmbed] });
        } else {
          await context.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } else {
        await context.reply({ embeds: [errorEmbed] });
      }
    }
  }
};
