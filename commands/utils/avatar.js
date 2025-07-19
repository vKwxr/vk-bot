
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('🖼️ Muestra el avatar de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del cual ver el avatar')
        .setRequired(false)),

  async execute(interaction, client) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Avatar de ${user.username}`)
      .setImage(user.displayAvatarURL({ size: 512, extension: 'png' }))
      .setColor('#5865F2')
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setURL(user.displayAvatarURL({ size: 1024, extension: 'png' }))
          .setLabel('Abrir imagen')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🔗')
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  name: 'avatar',
  async run(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Avatar de ${user.username}`)
      .setImage(user.displayAvatarURL({ size: 512, extension: 'png' }))
      .setColor('#5865F2')
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setURL(user.displayAvatarURL({ size: 1024, extension: 'png' }))
          .setLabel('Abrir imagen')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🔗')
      );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
};
