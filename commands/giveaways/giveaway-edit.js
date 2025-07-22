const { SlashCommandBuilder } = require('discord.js');
const { editGiveawayData, getGiveawayData } = require('../../utils/giveawayUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-edit')
    .setDescription('Edita un sorteo activo')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('ID del mensaje del sorteo')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('winners')
        .setDescription('Nuevo número de ganadores')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('prize')
        .setDescription('Nuevo premio del sorteo')
        .setRequired(false)
    ),

  async execute(interaction) {
    const messageId = interaction.options.getString('message_id');
    const newWinners = interaction.options.getInteger('winners');
    const newPrize = interaction.options.getString('prize');

    const giveaway = await getGiveawayData(messageId);

    if (!giveaway) {
      return interaction.reply({ content: '❌ No se encontró un sorteo con ese ID.', ephemeral: true });
    }

    if (newWinners === null && !newPrize) {
      return interaction.reply({ content: '⚠️ Debes proporcionar al menos un campo para editar.', ephemeral: true });
    }

    const success = await editGiveawayData(messageId, {
      winners: newWinners ?? undefined,
      prize: newPrize ?? undefined
    });

    if (!success) {
      return interaction.reply({ content: '❌ No se pudo actualizar el sorteo.', ephemeral: true });
    }

    await interaction.reply({
      content: `✅ El sorteo fue actualizado.\n${
        newWinners !== null ? `• Ganadores: **${newWinners}**\n` : ''
      }${
        newPrize ? `• Premio: **${newPrize}**` : ''
      }`,
      ephemeral: true
    });
  }
};
