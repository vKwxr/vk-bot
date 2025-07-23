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
      .setTitle('📚 Panel de Ayuda - vK')
      .setDescription('👋 ¡Bienvenido al **Panel de Ayuda de vK**!\n\nAquí encontrarás todas las funciones y comandos organizados por categorías.\n\n📂 Usa el **menú desplegable** de abajo para explorar cada sección y descubrir todo lo que el bot puede hacer.\n\n⚡ Desde utilidades, moderación, entretenimiento y mucho más…\n\n¡Elige una categoría y empieza a sacarle el máximo provecho a vK!')
      .addFields(
      )
      .setColor('#0099ff')
      .setFooter({ text: '• vK Bot' })
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
  { name: 'ban', description: 'Banear un usuario', usage: '`/ban` y `vk ban` @usuario [razón]' },
  { name: 'kick', description: 'Expulsar un usuario', usage: '`/kick` y `vk kick` @usuario [razón]' },
  { name: 'timeout', description: 'Aislar temporalmente a un usuario', usage: '`/timeout` y `vk timeout` @usuario <tiempo>' },
  { name: 'warn', description: 'Advertir a un usuario', usage: '`/warn` y `vk warn` @usuario [razón]' },
  { name: 'warnings', description: 'Ver advertencias de un usuario', usage: '`/warnings`' },
  { name: 'clear', description: 'Borrar mensajes del canal', usage: '`/clear` y `vk clear` <cantidad>' },
  { name: 'addrole', description: 'Agregar un rol a un usuario', usage: '`/addrole`' },
  { name: 'removerole', description: 'Quitar un rol de un usuario', usage: '`/removerole`' },
  { name: 'createrole', description: 'Crear un nuevo rol', usage: '`/createrole`' },
  { name: 'paneltickets', description: 'Mostrar el panel de creación de tickets', usage: '`/paneltickets`' },
  { name: 'setup', description: 'Configurar el sistema de tickets o funciones', usage: '`/setup`' },
  { name: 'mute', description: 'Silenciar a un usuario (timeout)', usage: '`/timeout` y `vk mute` @usuario <tiempo>' }
],
     fun: [
  { name: 'hola', description: 'Saludo personalizado con IA', usage: '`/hola` y `vk hola`' },
  { name: '8ball', description: 'Bola mágica que responde preguntas', usage: '`/8ball` y `vk 8ball` <pregunta>' },
  { name: 'chiste', description: 'Contar un chiste aleatorio', usage: '`/chiste` y `vk chiste`' },
  { name: 'dado', description: 'Lanzar un dado con cantidad de caras opcional', usage: '`/dado` y `vk dado` [lados]' },
  { name: 'moneda', description: 'Lanzar una moneda (cara o sello)', usage: '`/moneda` y `vk moneda`' },
  { name: 'insulto', description: 'Decir un insulto gracioso a alguien', usage: '`/insulto` y `vk insulto` [@usuario]' },
  { name: 'hug', description: 'Abrazar a otro usuario con un GIF', usage: '`/hug` y `vk hug` @usuario' },
  { name: 'kiss', description: 'Besar a otro usuario con un GIF', usage: '`/kiss` y `vk kiss` @usuario' },
  { name: 'pat', description: 'Dar palmadas (pat) a otro usuario', usage: '`/pat` y `vk pat` @usuario' },
  { name: 'poke', description: 'Picar (poke) a otro usuario', usage: '`/poke` y `vk poke` @usuario' }
],
      economy: [
  { name: 'balance', description: 'Ver tu dinero o el de otro usuario', usage: '`/balance` y `vk balance` [@usuario]' },
  { name: 'daily', description: 'Cobrar tu recompensa diaria', usage: '`/daily` y `vk daily`' },
  { name: 'weekly', description: 'Cobrar tu recompensa semanal', usage: '`/weekly` y `vk weekly`' },
  { name: 'work', description: 'Trabajar para ganar dinero', usage: '`/work` y `vk work`' },
  { name: 'jobs', description: 'Ver y usar trabajos disponibles', usage: '`/jobs` y `vk jobs` <acción>' },
  { name: 'shop', description: 'Mostrar la tienda del servidor', usage: '`/shop` y `vk shop`' },
  { name: 'buy', description: 'Comprar un artículo de la tienda', usage: '`/buy` y `vk buy` <artículo>' }
],
      utils: [
  { name: 'avatar', description: 'Ver avatar de usuario', usage: '`vk avatar` [@usuario]' },
  { name: 'userinfo', description: 'Info de usuario', usage: '`vk userinfo` [@usuario]' },
  { name: 'serverinfo', description: 'Info del servidor', usage: '`vk serverinfo`' },
  { name: 'say', description: 'Hacer hablar al bot', usage: '`vk say` <mensaje>' },
  { name: 'reminder', description: 'Crear recordatorio', usage: '`vk reminder` <tiempo> <mensaje>' },
  { name: 'translate', description: 'Traducir texto', usage: '`vk translate` <idioma> <texto>' },
  { name: 'birthday', description: 'Configurar cumpleaños', usage: '`vk birthday` <fecha>' },
  { name: 'level', description: 'Ver tu nivel', usage: '`vk level` [@usuario]' },
  { name: 'rank', description: 'Ver ranking de niveles', usage: '`vk rank`' },

  { name: 'giveaway', description: 'Iniciar un nuevo sorteo', usage: '`/giveaway`' },
  { name: 'reroll', description: 'Elegir nuevos ganadores para un sorteo', usage: '`/reroll` <messageId>' },
  { name: 'edit', description: 'Editar un sorteo activo', usage: '`/edit` <messageId>' },
  { name: 'rollback', description: 'Revertir un sorteo cancelado', usage: '`/rollback` <messageId>' }
],
 info: [
  { name: 'ping', description: 'Ver la latencia del bot', usage: '`/ping` y `vk ping`' },
  { name: 'uptime', description: 'Tiempo que lleva activo el bot', usage: '`/uptime` y `vk uptime`' },
  { name: 'support', description: 'Enlace al servidor de soporte', usage: '`/support` y `vk support`' },
  { name: 'ask', description: 'Haz una pregunta a la IA de VK (respuesta general)', usage: '`/ask` y `vk ask` <pregunta>' },
  { name: 'askbot', description: 'Preguntar cómo usar las funciones del bot (IA guía)', usage: '`vk askbot` <comando o pregunta>' },
  
  { name: 'setup-tickets', description: 'Configura el sistema de tickets en el servidor', usage: '`/setup tickets`' },
  { name: 'paneltickets', description: 'Enviar el panel interactivo de tickets', usage: '`/paneltickets`' },
  { name: 'config', description: 'Ver o modificar la configuración del servidor', usage: '`/config`' },
  { name: 'autoroles', description: 'Configurar roles automáticos y por niveles', usage: '`/autoroles`' },
  { name: 'tutorial', description: 'Ver tutorial de comandos del bot', usage: '`/tutorial`' }
],

      games: [
        { name: 'guess', description: 'Adivina el número', usage: '`vk guess`' },
        { name: 'trivia', description: 'Preguntas de trivia', usage: '`vk trivia`' }
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
      .setFooter({ text: `vK • ${pageCommands.length} comandos mostrados` })
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
        .setLabel('◀◀')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0)
    );

    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId('help_home')
        .setLabel('🏠 ')
        .setStyle(ButtonStyle.Secondary)
    );

    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId(`help_next_${categoria}_${currentPage}`)
        .setLabel('▶▶')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages - 1)
    );

    const isInteraction = context.replied !== undefined;
    return isInteraction 
      ? await context.reply({ embeds: [embed], components: [buttons] })
      : await context.reply({ embeds: [embed], components: [buttons] });
  }
};