
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

const categories = {
  'moderation': { name: '🛡️ Moderación', emoji: '🛡️' },
  'fun': { name: '🎮 Diversión', emoji: '🎮' },
  'economy': { name: '💰 Economía', emoji: '💰' },
  'tickets': { name: '🎫 Tickets', emoji: '🎫' },
  'utils': { name: '🔧 Utilidades', emoji: '🔧' },
  'games': { name: '🎲 Juegos', emoji: '🎲' },
  'levels': { name: '🏆 Niveles', emoji: '🏆' },
  'info': { name: 'ℹ️ Información', emoji: 'ℹ️' }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📚 Muestra la lista de comandos disponibles')
    .addStringOption(option =>
      option.setName('categoria')
        .setDescription('Categoría específica de comandos')
        .setRequired(false)
        .addChoices(
          { name: '🛡️ Moderación', value: 'moderation' },
          { name: '🎮 Diversión', value: 'fun' },
          { name: '💰 Economía', value: 'economy' },
          { name: '🎫 Tickets', value: 'tickets' },
          { name: '🔧 Utilidades', value: 'utils' },
          { name: '🎲 Juegos', value: 'games' },
          { name: '🏆 Niveles', value: 'levels' },
          { name: 'ℹ️ Información', value: 'info' }
        )),

  async execute(interaction, client) {
    const categoria = interaction.options.getString('categoria');

    if (categoria) {
      await showCategoryHelp(interaction, categoria, client);
    } else {
      await showMainHelp(interaction, client);
    }
  },

  name: 'help',
  async run(message, args, client) {
    if (args[0]) {
      await showCategoryHelp(message, args[0], client, true);
    } else {
      await showMainHelp(message, client, true);
    }
  }
};

async function showMainHelp(interaction, client, isMessage = false) {
  const embed = new EmbedBuilder()
    .setTitle('📚 Centro de Ayuda - VK Community Bot')
    .setDescription('Selecciona una categoría para ver los comandos disponibles.')
    .addFields(
      { name: '🛡️ Moderación', value: 'Comandos para moderar el servidor', inline: true },
      { name: '🎮 Diversión', value: 'Comandos entretenidos y juegos', inline: true },
      { name: '💰 Economía', value: 'Sistema de monedas y tienda', inline: true },
      { name: '🎫 Tickets', value: 'Sistema de soporte', inline: true },
      { name: '🔧 Utilidades', value: 'Herramientas útiles', inline: true },
      { name: '🎲 Juegos', value: 'Juegos interactivos', inline: true },
      { name: '🏆 Niveles', value: 'Sistema de experiencia', inline: true },
      { name: 'ℹ️ Información', value: 'Info del bot y servidor', inline: true }
    )
    .setColor('#9966ff')
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: 'Usa /help [categoría] para ver comandos específicos' })
    .setTimestamp();

  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('📚 Selecciona una categoría')
        .addOptions(
          Object.entries(categories).map(([key, value]) => ({
            label: value.name,
            value: key,
            emoji: value.emoji,
            description: `Ver comandos de ${value.name.toLowerCase()}`
          }))
        )
    );

  if (isMessage) {
    await interaction.channel.send({ embeds: [embed], components: [selectMenu] });
  } else {
    await interaction.reply({ embeds: [embed], components: [selectMenu] });
  }
}

async function showCategoryHelp(interaction, categoria, client, isMessage = false) {
  const categoryInfo = categories[categoria];
  if (!categoryInfo) {
    const content = '❌ Categoría no encontrada.';
    if (isMessage) {
      return interaction.channel.send(content);
    } else {
      return interaction.reply({ content, ephemeral: true });
    }
  }

  // Aquí deberías cargar los comandos de la categoría específica
  // Por ahora, muestro un ejemplo
  const embed = new EmbedBuilder()
    .setTitle(`${categoryInfo.emoji} Comandos de ${categoryInfo.name}`)
    .setDescription('Lista de comandos disponibles en esta categoría')
    .setColor('#9966ff')
    .setThumbnail(client.user.displayAvatarURL())
    .setTimestamp();

  // Agregar comandos según la categoría
  switch (categoria) {
    case 'moderation':
      embed.addFields(
        { name: '/ban', value: 'Banea a un usuario', inline: true },
        { name: '/kick', value: 'Expulsa a un usuario', inline: true },
        { name: '/timeout', value: 'Silencia a un usuario', inline: true },
        { name: '/clear', value: 'Elimina mensajes', inline: true },
        { name: '/warn', value: 'Advierte a un usuario', inline: true },
        { name: '/warnings', value: 'Ve advertencias', inline: true }
      );
      break;
    case 'fun':
      embed.addFields(
        { name: '/hola', value: 'Saludo personalizado', inline: true },
        { name: '/8ball', value: 'Pregunta al oráculo', inline: true },
        { name: '/banana', value: 'Mide tu banana', inline: true },
        { name: '/jumbo', value: 'Agranda un emoji', inline: true }
      );
      break;
    // Agregar más categorías...
  }

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back')
        .setLabel('Volver al menú principal')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️')
    );

  if (isMessage) {
    await interaction.channel.send({ embeds: [embed], components: [backButton] });
  } else {
    await interaction.reply({ embeds: [embed], components: [backButton] });
  }
}
