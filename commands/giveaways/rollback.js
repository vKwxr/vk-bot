const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const { getGiveawayData } = require(path.join("..\\utils\\giveawayUtils"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-rollback')
    .setDescription('🎲 Rehace el sorteo de un giveaway ya finalizado.')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('🆔 ID del mensaje del giveaway original')
        .setRequired(true)
    ),

  async execute(interaction) {
    const messageId = interaction.options.getString('message_id');

    try {
      const giveaway = await getGiveawayData(messageId);
      if (!giveaway)
        return interaction.reply({ content: '❌ No se encontró un giveaway con ese ID.', ephemeral: true });

      const { participants, winners: winnersCount, prize, channelId } = giveaway;

      if (!participants || participants.length < winnersCount)
        return interaction.reply({ content: '❌ No hay suficientes participantes para rehacer el sorteo.', ephemeral: true });

      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, winnersCount).map(id => `<@${id}>`).join(', ');

      const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
      if (!channel)
        return interaction.reply({ content: '❌ No se pudo acceder al canal del giveaway.', ephemeral: true });

      await channel.send(`🎉 **¡Nuevos ganadores del giveaway de \`${prize}\`!** 🎉\n👑 Ganadores: ${winners}`);
      return interaction.reply({ content: '✅ Sorteo rehecho exitosamente.', ephemeral: true });

    } catch (error) {
      console.error('[❌] Error al rehacer el giveaway:', error);
      return interaction.reply({ content: '⚠️ Ocurrió un error al intentar rehacer el sorteo.', ephemeral: true });
    }
  }
};
