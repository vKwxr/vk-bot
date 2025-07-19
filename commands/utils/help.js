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
        { name: 'ban', description: 'Banear un usuario', usage: '`/ban` o `vk ban` @usuario [razón]' },
        { name: 'kick', description: 'Expulsar un usuario', usage: '`/kick` o `vk kick` @usuario [razón]' },
        { name: 'timeout', description: 'Aislar temporalmente', usage: '`/timeout` o `vk timeout` @usuario <tiempo>' },
        { name: 'warn', description: 'Advertir a un usuario', usage: '`/warn` o `vk warn` @usuario [razón]' },
        { name: 'clear', description: 'Borrar mensajes', usage: '`/clear` o `vk clear` <cantidad>' },
        { name: 'addrole', description: 'Agregar rol a usuario', usage: '`/addrole` o `vk addrole` @usuario @rol' }
      ],
      fun: [
        { name: 'hola', description: 'Saludo personalizado con IA', usage: '`/hola` o `vk hola`' },
        { name: '8ball', description: 'Bola mágica 8', usage: '`/8ball` o `vk 8ball` <pregunta>' },
        { name: 'chiste', description: 'Contar un chiste', usage: '`/chiste` o `vk chiste`' },
        { name: 'dado', description: 'Lanzar un dado', usage: '`/dado` o `vk dado` [lados]' },
        { name: 'moneda', description: 'Lanzar una moneda', usage: '`/moneda` o `vk moneda`' },
        { name: 'insulto', description: 'Insulto gracioso', usage: '`/insulto` o `vk insulto` [@usuario]' }
      ],
      economy: [
        { name: 'balance', description: 'Ver tu dinero', usage: '`/balance` o `vk balance` [@usuario]' },
        { name: 'daily', description: 'Recompensa diaria', usage: '`/daily` o `vk daily`' },
        { name: 'weekly', description: 'Recompensa semanal', usage: '`/weekly` o `vk weekly`' },
        { name: 'work', description: 'Trabajar por dinero', usage: '`/work` o `vk work`' },
        { name: 'jobs', description: 'Sistema de trabajos', usage: '`/jobs` o `vk jobs` <acción>' },
        { name: 'shop', description: 'Tienda del servidor', usage: '`/shop` o `vk shop`' },
        { name: 'buy', description: 'Comprar artículos', usage: '`/buy` o `vk buy` <artículo>' }
      ],
      utils: [
        { name: 'avatar', description: 'Ver avatar de usuario', usage: '`/avatar` o `vk avatar` [@usuario]' },
        { name: 'userinfo', description: 'Info de usuario', usage: '`/userinfo` o `vk userinfo` [@usuario]' },
        { name: 'serverinfo', description: 'Info del servidor', usage: '`/serverinfo` o `vk serverinfo`' },
        { name: 'say', description: 'Hacer hablar al bot', usage: '`/say` o `vk say` <mensaje>' },
        { name: 'reminder', description: 'Crear recordatorio', usage: '`/reminder` o `vk reminder` <tiempo> <mensaje>' },
        { name: 'translate', description: 'Traducir texto', usage: '`/translate` o `vk translate` <idioma> <texto>' },
        { name: 'birthday', description: 'Configurar cumpleaños', usage: '`/birthday` o `vk birthday` <fecha>' }
      ],
      info: [
        { name: 'ping', description: 'Latencia del bot', usage: '`/ping` o `vk ping`' },
        { name: 'uptime', description: 'Tiempo activo', usage: '`/uptime` o `vk uptime`' },
        { name: 'support', description: 'Servidor de soporte', usage: '`/support` o `vk support`' },
        { name: 'ask', description: 'Preguntar a VK AI', usage: '`/ask` o `vk ask` <pregunta>' }
      ],
      games: [
        { name: 'guess', description: 'Adivina el número', usage: '`/guess` o `vk guess`' },
        { name: 'trivia', description: 'Preguntas de trivia', usage: '`/trivia` o `vk trivia`' }
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