const { SlashCommandBuilder } = require('discord.js');
const { getGiveawayData } = require('../../utils/giveawayUtils'); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-rollback')
    .setDescription('Rehace el sorteo de un giveaway finalizado')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('ID del mensaje del giveaway original')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const messageId = interaction.options.getString('message_id');

      const giveawayData = await getGiveawayData(messageId);

      if (!giveawayData) {
        return interaction.reply({ content: '❌ No se encontró el giveaway con ese ID.', ephemeral: true });
      }

      const participants = giveawayData.participants;
      const winnersCount = giveawayData.winners;
      const prize = giveawayData.prize;

      if (!participants || participants.length < winnersCount) {
        return interaction.reply({ content: '❌ No hay suficientes participantes para rehacer el sorteo.', ephemeral: true });
      }

      const shuffled = participants.sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, winnersCount);

      const winnerMentions = winners.map(w => `<@${w}>`).join(', ');

      const channel = await interaction.guild.channels.fetch(giveawayData.channelId);
      if (!channel) {
        return interaction.reply({ content: '❌ No se pudo encontrar el canal del giveaway.', ephemeral: true });
      }

      await channel.send(`🎉 **¡Nuevos ganadores del giveaway de ${prize}!** 🎉\nGanadores: ${winnerMentions}`);

      await interaction.reply({ content: '✅ Giveaway rehecho exitosamente.', ephemeral: true });

    } catch (error) {
      console.error('Error al rehacer el sorteo:', error);
      return interaction.reply({ content: '❌ Ocurrió un error al rehacer el giveaway.', ephemeral: true });
    }
  }
};
