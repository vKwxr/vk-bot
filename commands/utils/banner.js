const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('🎨 Muestra el banner de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del cual ver el banner')
        .setRequired(false)
    ),

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
        .setColor('#5865F2');

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
    let user = message.mentions.users.first();

    if (!user && args[0]) {
      user = message.guild.members.cache.find(m =>
        m.user.username.toLowerCase() === args[0].toLowerCase() ||
        m.user.tag.toLowerCase() === args[0].toLowerCase()
      )?.user;

      if (!user) {
        try {
          user = await client.users.fetch(args[0]);
        } catch (err) {
          return message.reply('❌ No encontré a ese usuario.');
        }
      }
    }

    if (!user) user = message.author;

    try {
      const fetchedUser = await client.users.fetch(user.id, { force: true });

      if (!fetchedUser.banner) {
        return message.reply(`❌ ${user.username} no tiene banner configurado.`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`🎨 Banner de ${user.username}`)
        .setImage(fetchedUser.bannerURL({ size: 512, extension: 'png' }))
        .setColor('#5865F2');

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
