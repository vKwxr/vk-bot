
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('📊 Crea una encuesta')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('Pregunta de la encuesta')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('opcion1')
        .setDescription('Primera opción')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('opcion2')
        .setDescription('Segunda opción')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('opcion3')
        .setDescription('Tercera opción')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('opcion4')
        .setDescription('Cuarta opción')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('opcion5')
        .setDescription('Quinta opción')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('duracion')
        .setDescription('Duración en minutos (por defecto: sin límite)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(1440)),

  async execute(interaction, client) {
    const pregunta = interaction.options.getString('pregunta');
    const opciones = [
      interaction.options.getString('opcion1'),
      interaction.options.getString('opcion2'),
      interaction.options.getString('opcion3'),
      interaction.options.getString('opcion4'),
      interaction.options.getString('opcion5')
    ].filter(Boolean); 

    const duracion = interaction.options.getInteger('duracion');

    
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

    const embed = new EmbedBuilder()
      .setTitle('📊 Encuesta')
      .setDescription(`**${pregunta}**\n\n${opciones.map((opcion, index) => 
        `${emojis[index]} ${opcion}`
      ).join('\n')}`)
      .setColor('#9966ff')
      .setFooter({ 
        text: `Creada por ${interaction.user.tag}${duracion ? ` • Termina en ${duracion} minutos` : ''}`,
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();

    const mensaje = await interaction.reply({ embeds: [embed], fetchReply: true });

    for (let i = 0; i < opciones.length; i++) {
      try {
        await mensaje.react(emojis[i]);
      } catch (error) {
        console.error('Error añadiendo reacción:', error);
      }
    }

    if (duracion) {
      setTimeout(async () => {
        try {
          const updatedMessage = await mensaje.fetch();
          const reactions = updatedMessage.reactions.cache;

          let resultados = '';
          let maxVotos = 0;
          let ganadora = '';

          for (let i = 0; i < opciones.length; i++) {
            const reaction = reactions.get(emojis[i]);
            const votos = reaction ? reaction.count - 1 : 0; // -1 para excluir la reacción del bot
            
            resultados += `${emojis[i]} **${opciones[i]}**: ${votos} votos\n`;
            
            if (votos > maxVotos) {
              maxVotos = votos;
              ganadora = opciones[i];
            }
          }

          const embedFinal = new EmbedBuilder()
            .setTitle('📊 Encuesta Finalizada')
            .setDescription(`**${pregunta}**\n\n${resultados}\n🏆 **Ganadora**: ${ganadora} (${maxVotos} votos)`)
            .setColor('#00ff00')
            .setFooter({ 
              text: `Encuesta cerrada • ${maxVotos} votos totales`,
              iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

          await mensaje.edit({ embeds: [embedFinal] });

        } catch (error) {
          console.error('Error finalizando encuesta:', error);
        }
      }, duracion * 60000); // Convertir minutos a milisegundos
    }
  },

  name: 'poll',
  async run(message, args, client) {
    if (args.length < 3) {
      return message.reply('❌ Uso: `vkpoll <pregunta> | <opción1> | <opción2> [| opción3...]`\nEjemplo: `vkpoll ¿Cuál prefieres? | Pizza | Hamburguesa | Tacos`');
    }

    const contenido = args.join(' ');
    const partes = contenido.split(' | ');
    
    if (partes.length < 3) {
      return message.reply('❌ Debes proporcionar una pregunta y al menos 2 opciones separadas por " | "');
    }

    const pregunta = partes[0];
    const opciones = partes.slice(1);

    if (opciones.length > 5) {
      return message.reply('❌ Máximo 5 opciones permitidas.');
    }

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

    const embed = new EmbedBuilder()
      .setTitle('📊 Encuesta')
      .setDescription(`**${pregunta}**\n\n${opciones.map((opcion, index) => 
        `${emojis[index]} ${opcion}`
      ).join('\n')}`)
      .setColor('#9966ff')
      .setFooter({ 
        text: `Creada por ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL() 
      })
      .setTimestamp();

    const mensaje = await message.reply({ embeds: [embed] });

    // Añadir reacciones
    for (let i = 0; i < opciones.length; i++) {
      try {
        await mensaje.react(emojis[i]);
      } catch (error) {
        console.error('Error añadiendo reacción:', error);
      }
    }
  }
};
