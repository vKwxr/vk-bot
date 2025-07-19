
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  async execute(interaction, client) {
    const [action, ...params] = interaction.customId.split('_');

    if (action === 'help') {
      if (params[0] === 'category') {
        // Handle select menu
        const categoria = interaction.values[0];
        await showCategory(interaction, categoria, 0);
      } else if (params[0] === 'home') {
        // Show main help
        await showMainHelp(interaction);
      } else if (params[0] === 'prev') {
        // Previous page
        const categoria = params[1];
        const currentPage = parseInt(params[2]);
        const newPage = Math.max(0, currentPage - 1);
        await showCategory(interaction, categoria, newPage);
      } else if (params[0] === 'next') {
        // Next page
        const categoria = params[1];
        const currentPage = parseInt(params[2]);
        await showCategory(interaction, categoria, currentPage + 1);
      }
    }
  }
};

async function showMainHelp(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('📚 Panel de Ayuda - VK Community')
    .setDescription('¡Bienvenido al sistema de ayuda! Selecciona una categoría para ver los comandos disponibles.')
    .addFields(
      { name: '🛡️ Moderación', value: 'Comandos para moderar el servidor', inline: true },
      { name: '🎮 Diversión', value: 'Comandos divertidos y entretenimiento', inline: true },
      { name: '💰 Economía', value: 'Sistema económico del servidor', inline: true },
      { name: '🔧 Utilidades', value: 'Herramientas útiles del servidor', inline: true },
      { name: '📊 Información', value: 'Información del bot y servidor', inline: true },
      { name: '🎯 Juegos', value: 'Juegos interactivos', inline: true }
    )
    .setColor('#0099ff')
    .setFooter({ text: 'VK Community • Usa el menú para navegar' })
    .setTimestamp();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category')
    .setPlaceholder('🔍 Selecciona una categoría')
    .addOptions([
      { label: 'Moderación', value: 'moderation', emoji: '🛡️' },
      { label: 'Diversión', value: 'fun', emoji: '🎮' },
      { label: 'Economía', value: 'economy', emoji: '💰' },
      { label: 'Utilidades', value: 'utils', emoji: '🔧' },
      { label: 'Información', value: 'info', emoji: '📊' },
      { label: 'Juegos', value: 'games', emoji: '🎯' }
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.update({ embeds: [embed], components: [row] });
}

async function showCategory(interaction, categoria, page = 0) {
  const comandos = {
    moderation: [
      { name: 'ban', description: 'Banear un usuario', usage: '/ban @usuario [razón]' },
      { name: 'kick', description: 'Expulsar un usuario', usage: '/kick @usuario [razón]' },
      { name: 'timeout', description: 'Aislar temporalmente', usage: '/timeout @usuario <tiempo>' },
      { name: 'warn', description: 'Advertir a un usuario', usage: '/warn @usuario [razón]' },
      { name: 'clear', description: 'Borrar mensajes', usage: '/clear <cantidad>' },
      { name: 'addrole', description: 'Agregar rol a usuario', usage: '/addrole @usuario @rol' }
    ],
    fun: [
      { name: 'hola', description: 'Saludo personalizado', usage: '/hola' },
      { name: '8ball', description: 'Bola mágica 8', usage: '/8ball <pregunta>' },
      { name: 'chiste', description: 'Contar un chiste', usage: '/chiste' },
      { name: 'dado', description: 'Lanzar un dado', usage: '/dado [lados]' },
      { name: 'moneda', description: 'Lanzar una moneda', usage: '/moneda' },
      { name: 'insulto', description: 'Insulto gracioso', usage: '/insulto [@usuario]' }
    ],
    economy: [
      { name: 'balance', description: 'Ver tu dinero', usage: '/balance [@usuario]' },
      { name: 'daily', description: 'Recompensa diaria', usage: '/daily' },
      { name: 'weekly', description: 'Recompensa semanal', usage: '/weekly' },
      { name: 'work', description: 'Trabajar por dinero', usage: '/work' },
      { name: 'jobs', description: 'Sistema de trabajos', usage: '/jobs list' },
      { name: 'shop', description: 'Tienda del servidor', usage: '/shop' }
    ],
    utils: [
      { name: 'avatar', description: 'Ver avatar de usuario', usage: '/avatar [@usuario]' },
      { name: 'userinfo', description: 'Info de usuario', usage: '/userinfo [@usuario]' },
      { name: 'serverinfo', description: 'Info del servidor', usage: '/serverinfo' },
      { name: 'say', description: 'Hacer hablar al bot', usage: '/say <mensaje>' },
      { name: 'reminder', description: 'Crear recordatorio', usage: '/reminder <tiempo> <mensaje>' },
      { name: 'translate', description: 'Traducir texto', usage: '/translate <idioma> <texto>' }
    ],
    info: [
      { name: 'ping', description: 'Latencia del bot', usage: '/ping' },
      { name: 'uptime', description: 'Tiempo activo', usage: '/uptime' },
      { name: 'support', description: 'Servidor de soporte', usage: '/support' },
      { name: 'ask', description: 'Preguntar a la IA', usage: '/ask <pregunta>' }
    ],
    games: [
      { name: 'guess', description: 'Adivina el número', usage: '/guess' },
      { name: 'trivia', description: 'Preguntas de trivia', usage: '/trivia' }
    ]
  };

  const categoryCommands = comandos[categoria] || [];
  const itemsPerPage = 6;
  const totalPages = Math.ceil(categoryCommands.length / itemsPerPage);
  const currentPage = Math.min(page, totalPages - 1);
  
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageCommands = categoryCommands.slice(startIndex, endIndex);

  const categoryNames = {
    moderation: '🛡️ Moderación',
    fun: '🎮 Diversión', 
    economy: '💰 Economía',
    utils: '🔧 Utilidades',
    info: '📊 Información',
    games: '🎯 Juegos'
  };

  const embed = new EmbedBuilder()
    .setTitle(`${categoryNames[categoria] || '❓ Categoría'} - Comandos`)
    .setDescription(`Página ${currentPage + 1} de ${totalPages}`)
    .setColor('#0099ff')
    .setFooter({ text: `VK Community • ${pageCommands.length} comandos mostrados` })
    .setTimestamp();

  pageCommands.forEach(cmd => {
    embed.addFields({
      name: `\`${cmd.name}\``,
      value: `${cmd.description}\n📝 **Uso:** \`${cmd.usage}\``,
      inline: true
    });
  });

  const buttons = new ActionRowBuilder();
  
  buttons.addComponents(
    new ButtonBuilder()
      .setCustomId(`help_prev_${categoria}_${currentPage}`)
      .setLabel('◀️ Anterior')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 0),
    new ButtonBuilder()
      .setCustomId('help_home')
      .setLabel('🏠 Inicio')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`help_next_${categoria}_${currentPage}`)
      .setLabel('Siguiente ▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages - 1)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}
