const path = require('path');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } = require('discord.js');

const commandsData = [
  {
    name: 'poke',
    description: 'Poke a alguien para llamar su atención',
    acceptGif: 'https://media.giphy.com/media/3o6Zt8MgUuvSbkZYWc/giphy.gif',
    rejectGif: 'https://media.giphy.com/media/1BXa2alBjrCXC/giphy.gif',
    acceptText: '¡Poke aceptado! 👈',
    rejectText: '¡Poke rechazado y un manazo! 👋',
  },
  {
    name: 'slap',
    description: 'Dar una bofetada divertida a alguien',
    acceptGif: 'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
    rejectGif: 'https://media.giphy.com/media/jLeyZWgtwgr2U/giphy.gif',
    acceptText: '¡Bofetada recibida! 😵',
    rejectText: '¡Bofetada evitada, contraataque! 🥊',
  },
  {
    name: 'tickle',
    description: 'Hacer cosquillas a alguien',
    acceptGif: 'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif',
    rejectGif: 'https://media.giphy.com/media/3o6ZtpxSZbQRRnwCKQ/giphy.gif',
    acceptText: '¡Cosquillas aceptadas! 😂',
    rejectText: '¡No me hagas cosquillas! 🙅‍♂️',
  },
  {
    name: 'highfive',
    description: 'Choca esos cinco con alguien',
    acceptGif: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    rejectGif: 'https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/giphy.gif',
    acceptText: '¡High five aceptado! ✋',
    rejectText: '¡No me choca la mano! ✋❌',
  },
  {
    name: 'cuddle',
    description: 'Abrazar a alguien con cariño',
    acceptGif: 'https://media.giphy.com/media/3ZnBrkqoaI2hq/giphy.gif',
    rejectGif: 'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
    acceptText: '¡Abrazos recibidos! 🤗',
    rejectText: '¡No quiero abrazos! 😬',
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('funcommands')
    .setDescription('Comandos interactivos de diversión: poke, slap, tickle, highfive, cuddle')
    .addSubcommand(sub =>
      sub.setName('poke').setDescription('Poke a alguien').addUserOption(opt => opt.setName('target').setDescription('Usuario a pokear').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('slap').setDescription('Dar una bofetada').addUserOption(opt => opt.setName('target').setDescription('Usuario a bofetear').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('tickle').setDescription('Hacer cosquillas').addUserOption(opt => opt.setName('target').setDescription('Usuario para hacer cosquillas').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('highfive').setDescription('Chocar esos cinco').addUserOption(opt => opt.setName('target').setDescription('Usuario para chocar mano').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('cuddle').setDescription('Abrazar').addUserOption(opt => opt.setName('target').setDescription('Usuario a abrazar').setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser('target');

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'No puedes usar este comando contigo mismo 😅', ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: 'No puedes usar este comando con bots 🤖', ephemeral: true });
    }

    const cmdData = commandsData.find(c => c.name === subcommand);
    if (!cmdData) return interaction.reply({ content: 'Comando no encontrado', ephemeral: true });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept')
        .setLabel('Aceptar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('reject')
        .setLabel('Rechazar')
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${interaction.user.username} quiere ${subcommand} a ${target.username}`)
      .setDescription('¿Aceptas?')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], components: [row] });

    const filter = i => ['accept', 'reject'].includes(i.customId) && i.user.id === target.id;

    try {
      const confirmation = await interaction.channel.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 30000 });

      if (confirmation.customId === 'accept') {
        const acceptEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle(`${target.username} aceptó el ${subcommand}`)
          .setDescription(cmdData.acceptText)
          .setImage(cmdData.acceptGif)
          .setTimestamp();

        await confirmation.update({ embeds: [acceptEmbed], components: [] });
      } else if (confirmation.customId === 'reject') {
        const rejectEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle(`${target.username} rechazó el ${subcommand}`)
          .setDescription(cmdData.rejectText)
          .setImage(cmdData.rejectGif)
          .setTimestamp();

        await confirmation.update({ embeds: [rejectEmbed], components: [] });
      }
    } catch (error) {
      // Tiempo agotado
      await interaction.editReply({ content: 'No hubo respuesta a tiempo. Comando cancelado.', embeds: [], components: [] });
    }
  },
};
