
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moneda')
    .setDescription('🪙 Lanza una moneda al aire'),

  async execute(interaction, client) {
    const resultado = Math.random() < 0.5 ? 'cara' : 'cruz';
    const emoji = resultado === 'cara' ? '🟨' : '⚪';

    const embed = new EmbedBuilder()
      .setTitle('🪙 Lanzamiento de Moneda')
      .setDescription(`${emoji} **¡Ha salido ${resultado.toUpperCase()}!**`)
      .setColor(resultado === 'cara' ? '#ffcc00' : '#cccccc')
      .setFooter({ text: `Lanzado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'moneda',
  async run(message, args, client) {
    const resultado = Math.random() < 0.5 ? 'cara' : 'cruz';
    const emoji = resultado === 'cara' ? '🟨' : '⚪';

    const embed = new EmbedBuilder()
      .setTitle('🪙 Lanzamiento de Moneda')
      .setDescription(`${emoji} **¡Ha salido ${resultado.toUpperCase()}!**`)
      .setColor(resultado === 'cara' ? '#ffcc00' : '#cccccc')
      .setFooter({ text: `Lanzado por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
