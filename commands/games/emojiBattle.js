const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emojibattle')
    .setDescription('Duelos rápidos de emojis con otro jugador')
    .addUserOption(option =>
      option.setName('oponente')
        .setDescription('Elige a quién retar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const challenger = interaction.user;
    const opponent = interaction.options.getUser('oponente');

    if (opponent.bot || opponent.id === challenger.id) {
      return interaction.reply({ content: '❌ No puedes retarte a ti mismo ni a un bot.', ephemeral: true });
    }

    const emojis = ['🔥', '⚡', '💥', '🧊', '🍄', '🍌', '🎯'];
    const chosen = emojis[Math.floor(Math.random() * emojis.length)];

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('press')
        .setLabel('Presiona aquí rápido')
        .setEmoji(chosen)
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      content: `⚔️ ${challenger} ha retado a ${opponent} a un duelo de reflejos.\nCuando vean el emoji, ¡presionen el botón lo más rápido posible!`,
      components: [row]
    });

    const filter = i =>
      (i.user.id === challenger.id || i.user.id === opponent.id) &&
      i.customId === 'press';

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      max: 1,
      time: 10000
    });

    collector.on('collect', async i => {
      await i.update({ content: `🏆 ¡${i.user} fue más rápido con el emoji ${chosen}!`, components: [] });
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({ content: '⏱️ Nadie presionó a tiempo. ¡Empate aburrido!', components: [] });
      }
    });
  }
};
