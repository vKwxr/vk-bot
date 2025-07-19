
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const respuestas = [
  "Es cierto",
  "Es decididamente así",
  "Sin duda",
  "Sí, definitivamente",
  "Puedes confiar en ello",
  "Como yo lo veo, sí",
  "Muy probablemente",
  "Las perspectivas son buenas",
  "Sí",
  "Las señales apuntan a que sí",
  "Respuesta confusa, vuelve a intentar",
  "Pregunta de nuevo más tarde",
  "Mejor no te lo digo ahora",
  "No se puede predecir ahora",
  "Concéntrate y pregunta de nuevo",
  "No cuentes con ello",
  "Mi respuesta es no",
  "Mis fuentes dicen que no",
  "Las perspectivas no son tan buenas",
  "Muy dudoso"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('🎱 Haz una pregunta al oráculo')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('Tu pregunta para el oráculo')
        .setRequired(true)),

  async execute(interaction, client) {
    const pregunta = interaction.options.getString('pregunta');
    const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];

    const embed = new EmbedBuilder()
      .setTitle('🎱 Bola Mágica 8')
      .addFields(
        { name: '❓ Pregunta', value: pregunta, inline: false },
        { name: '🔮 Respuesta', value: `**${respuesta}**`, inline: false }
      )
      .setColor('#9932cc')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: '8ball',
  async run(message, args, client) {
    const pregunta = args.join(' ');
    if (!pregunta) return message.reply('❌ Debes hacer una pregunta.');

    const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];

    const embed = new EmbedBuilder()
      .setTitle('🎱 Bola Mágica 8')
      .addFields(
        { name: '❓ Pregunta', value: pregunta, inline: false },
        { name: '🔮 Respuesta', value: `**${respuesta}**`, inline: false }
      )
      .setColor('#9932cc')
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
};
