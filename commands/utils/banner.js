
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('🎨 Muestra el banner de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del cual ver el banner')
        .setRequired(false)),

  async execute(interaction, client) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    
    try {
      const fetchedUser = await client.users.fetch(user.id, { force: true });
      
      if (!fetchedUser.banner) {
        return interaction.reply({
          content: `❌ ${user.username} no tiene banner configurado.`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🎨 Banner de ${user.username}`)
        .setImage(fetchedUser.bannerURL({ size: 512, extension: 'png' }))
        .setColor('#5865F2')
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setURL(fetchedUser.bannerURL({ size: 1024, extension: 'png' }))
            .setLabel('Abrir imagen')
            .setStyle(ButtonStyle.Link)
            .setEmoji('🔗')
        );

      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      await interaction.reply({
        content: '❌ Error al obtener el banner del usuario.',
        ephemeral: true
      });
    }
  },

  name: 'banner',
  async run(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    
    try {
      const fetchedUser = await client.users.fetch(user.id, { force: true });
      
      if (!fetchedUser.banner) {
        return message.reply(`❌ ${user.username} no tiene banner configurado.`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`🎨 Banner de ${user.username}`)
        .setImage(fetchedUser.bannerURL({ size: 512, extension: 'png' }))
        .setColor('#5865F2')
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setURL(fetchedUser.bannerURL({ size: 1024, extension: 'png' }))
            .setLabel('Abrir imagen')
            .setStyle(ButtonStyle.Link)
            .setEmoji('🔗')
        );

      await message.channel.send({ embeds: [embed], components: [row] });
    } catch (error) {
      await message.reply('❌ Error al obtener el banner del usuario.');
    }
  }
};
