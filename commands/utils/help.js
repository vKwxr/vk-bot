
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra información sobre los comandos disponibles')
    .addStringOption(option =>
      option.setName('categoria')
        .setDescription('Categoría específica de comandos')
        .addChoices(
          { name: '🛡️ Moderación', value: 'moderation' },
          { name: '🎮 Diversión', value: 'fun' },
          { name: '💰 Economía', value: 'economy' },
          { name: '🔧 Utilidades', value: 'utils' },
          { name: '📊 Información', value: 'info' },
          { name: '🎯 Juegos', value: 'games' }
        )
    ),

  name: 'help',
  description: 'Muestra ayuda sobre comandos',
  usage: 'vk help [categoría]',

  async execute(interaction, client) {
    const categoria = interaction.options.getString('categoria');
    
    if (categoria) {
      await this.showCategory(interaction, categoria, 0);
    } else {
      await this.showMainHelp(interaction);
    }
  },

  async run(message, args, client) {
    if (args.length > 0) {
      const categoria = args[0].toLowerCase();
      await this.showCategory(message, categoria, 0);
    } else {
      await this.showMainHelp(message);
    }
  },

  async showMainHelp(context) {
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

    const isInteraction = context.replied !== undefined;
    return isInteraction 
      ? await context.reply({ embeds: [embed], components: [row] })
      : await context.reply({ embeds: [embed], components: [row] });
  },

  async showCategory(context, categoria, page = 0) {
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
    
    // Botón anterior
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId(`help_prev_${categoria}_${currentPage}`)
        .setLabel('◀️ Anterior')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0)
    );

    // Botón inicio
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId('help_home')
        .setLabel('🏠 Inicio')
        .setStyle(ButtonStyle.Secondary)
    );

    // Botón siguiente
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId(`help_next_${categoria}_${currentPage}`)
        .setLabel('Siguiente ▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages - 1)
    );

    const isInteraction = context.replied !== undefined;
    return isInteraction 
      ? await context.reply({ embeds: [embed], components: [buttons] })
      : await context.reply({ embeds: [embed], components: [buttons] });
  }
};
