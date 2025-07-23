
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  async execute(interaction, client) {
    const [action, ...params] = interaction.customId.split('_');

    if (action === 'help') {
      if (params[0] === 'category') {
        const categoria = interaction.values[0];
        await showCategory(interaction, categoria, 0);
      } else if (params[0] === 'home') {
        await showMainHelp(interaction);
      } else if (params[0] === 'prev') {
        const categoria = params[1];
        const currentPage = parseInt(params[2]);
        const newPage = Math.max(0, currentPage - 1);
        await showCategory(interaction, categoria, newPage);
      } else if (params[0] === 'next') {
        const categoria = params[1];
        const currentPage = parseInt(params[2]);
        await showCategory(interaction, categoria, currentPage + 1);
      }
    }
  }
};

async function showMainHelp(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('📚 Panel de Ayuda')
    .setDescription('¡Bienvenido al sistema de ayuda! Selecciona una categoría para ver los comandos disponibles.')
    .addFields(
  { name: '🛡️ Moderación', value: 'Comandos para moderar el servidor', inline: true },
  { name: '🎮 Diversión', value: 'Comandos divertidos y entretenimiento', inline: true },
  { name: '💰 Economía', value: 'Sistema económico del servidor', inline: true },
  { name: '🔧 Utilidades', value: 'Herramientas útiles del servidor', inline: true },
  { name: '📊 Información', value: 'Mira el sistema de levels y la información del bot y servidor', inline: true },
  { name: '🎯 Juegos', value: 'Juegos interactivos con ranking, dificultad y premios', inline: true },
  { name: '🎰 Casino', value: 'Slots, blackjack, ruleta, crash, lotería, poker y más', inline: true },
  { name: '🎁 Giveaways', value: 'Sorteos automáticos y personalizables en el servidor', inline: true },
  { name: '🧠 Trivia', value: 'Preguntas por categorías, niveles y modo multijugador', inline: true },
  { name: '🔒 AutoMod', value: 'Sistema automático de moderación avanzada', inline: true },
  { name: '⭐ Especiales', value: 'Eventos únicos, misiones diarias y logros por actividad', inline: true },
  { name: '🏆 Rankings', value: 'Tops de economía, juegos, casino y eventos globales', inline: true },
  { name: '🧳 Mochila', value: 'Inventario de objetos y sistema de ítems con rarezas', inline: true },
  { name: '📦 Caja Sorpresa', value: 'Abre lucky boxes con premios aleatorios', inline: true },
  { name: '⚙️ Configuración', value: 'Ajustes del servidor, notificaciones y preferencias', inline: true }
)
.setColor('#0099ff')
.setFooter({ text: 'vK Bot • Usa el menú para navegar' })
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
    { label: 'Juegos', value: 'games', emoji: '🎯' },
    { label: 'Casino', value: 'casino', emoji: '🎰' },
    { label: 'Giveaways', value: 'giveaways', emoji: '🎁' },
    { label: 'Trivia', value: 'trivia', emoji: '🧠' },
    { label: 'AutoMod', value: 'automod', emoji: '🔒' },
    { label: 'Especiales', value: 'special', emoji: '⭐' },
    { label: 'Rankings', value: 'rankings', emoji: '🏆' },
    { label: 'Mochila', value: 'backpack', emoji: '🧳' },
    { label: 'Caja Sorpresa', value: 'luckybox', emoji: '📦' },
    { label: 'Configuración', value: 'config', emoji: '⚙️' }
  ]);

const row = new ActionRowBuilder().addComponents(selectMenu);

await interaction.update({ embeds: [embed], components: [row] });
}

async function showCategory(interaction, categoria, page = 0) {
  const comandos = {
  moderation: [
    { name: 'ban', description: 'Banear un usuario 🛡', usage: '/ban @usuario [razón] | vk ban @usuario [razón]' },
    { name: 'kick', description: 'Expulsar un usuario', usage: '/kick @usuario [razón] | vk kick @usuario [razón]' },
    { name: 'timeout', description: 'Aislar temporalmente', usage: '/timeout @usuario <tiempo> | vk timeout @usuario <tiempo>' },
    { name: 'mute', description: 'Mutea a un usuario', usage: '/mute | vk mute [ @usuario ]' },
    { name: 'warn', description: 'Advertir a un usuario', usage: '/warn @usuario [razón] | vk warn @usuario [razón]' },
    { name: 'warnings', description: 'Mira las advertencias que tiene un usuario', usage: '/warnings [ @usuario ]' },
    { name: 'clear', description: 'Borra una pequeña cantida de mensajes en el canal 1-100', usage: '/clear <cantidad> | vk clear <cantidad>' },
    { name: 'addrole', description: 'Agregarle rol a un usuario', usage: '/addrole @usuario @rol | vk addrole @usuario @rol' },
    { name: 'anuncio', description: 'Crea un anuncio oficial', usage: '/anuncio' },
    { name: 'ticket', description: 'Mira la lista de tickets abiertos actualmente', usage: '/tickets' },
    { name: 'tickets stats', description: 'mira las estadisticas de los tickets \n Solo admins', usage: '/ticketstats' },
    { name: 'panel de tickets', description: 'Enviar el panel de ticekts al canal seleccionado', usage: '/paneltckets [ Canal ]' },
    { name: 'ticket priority', description: 'Cambia la prioridad del ticket', usage: '/ticketpriority' },
    { name: 'assignticket', description: 'Asigna el ticket a otro staff', usage: '/assignticket [ @Staff ]' },
    { name: 'close ticket', description: 'Cierra el ticket actual [canal de soporte]', usage: '/closeticket [razon por la que cerraras el ticket]' },
    { name: 'rename ticket', description: 'Renombra el ticket con el nombre correcto segun el tipo de ticket', usage: '/renameticket' },
    { name: 'remove user', description: 'remueve a un usuario del ticket', usage: '/removeuser' },
    { name: 'level channel', description: 'Configura el canal para enviar las notificaciones de levels', usage: '/levelchannel' },
  ],
  fun: [
    { name: 'hola', description: 'El bot envia un saludo aleatorio', usage: '/hola | vk hola' },
    { name: 'hug', description: 'Dale un tierno abrazo a otro usuario', usage: '/hug | vk hug [ @usuario ]' },
    { name: 'kiss', description: 'Dale un tierno y lindo beso a otro usuario', usage: 'vk kiss [ @usuario ]' },
    { name: 'pat', description: 'Hazle caricias de manera tierna a otro usuario', usage: '/pat [ @usuario ]| vk pat [ @usuario ]' },
    { name: 'poke', description: 'Molesta a un usuario dandole toques', usage: '/poke [ @usuario ] | vk poke [ @usuario ]' },
    { name: '8ball', description: 'Pregunta algo que su respuesta sea [ Si | No ]', usage: '/8ball <pregunta> | vk 8ball <pregunta>' },
    { name: 'chiste', description: 'El bot dice un chiste random \n puedes abrir un ticket para dar una idea de chiste al dev \n seccion [ Sugerencia ]', usage: '/chiste | vk chiste' },
    { name: 'dado', description: 'El bot lanza un dado de 6 caras', usage: '/dado [lados] | vk dado para un lado random | vk dado [lados] numero de lados para una suma mayor' },
    { name: 'moneda', description: 'El bot lanza una moneda | cara o cruz', usage: '/moneda | vk moneda ' },
    { name: 'insulto', description: 'El bot dice Insultos | leves', usage: '/insulto [@usuario] | vk insulto [@usuario]' },
    { name: 'lucky', description: '¿ Quieres saber que tanta suerte tienes el dia de hoy ?\n con este comando puedes medir tu nivel de suerte ', usage: '/lucky | vk lucky' },
    { name: 'banana', description: '¿Quieres saber cuanto te mide? \n utiliza este comando para saber cuanto te mide la banana', usage: '/banana [@user] | vk banana [@user]' },
    { name: 'funCommands', description: 'Comandos de interacción con botones (beso, abrazo, rechazar, etc.)', usage: 'vk kiss, vk hug, vk pat, etc.' }
  ],
  economy: [
    { name: 'balance', description: 'Ves tu dinero o el de los demas', usage: '/balance [@usuario] | vk balance [@user]' },
    { name: 'daily', description: 'Recibe una recompensa diaria | vk coins', usage: '/daily | vk daily' },
    { name: 'weekly', description: 'Recibe una recompensa semanal | vk coins', usage: '/weekly | vk weekly' },
    { name: 'work', description: 'Trabaja para ganar dinero | disponible cada 2 horas', usage: '/work | vk work' },
    { name: 'jobs', description: 'Mira la lista de trabajos a la cual te puedes postular', usage: '/jobs list' },
    { name: 'jobs current', description: 'Mira tu trabajo actual', usage: '/jobs current' },
    { name: 'jobs quit', description: 'Renuncia a tu trabajo actual', usage: '/jobs quit' },
    { name: 'shop', description: 'Mira la tienda del servidor donde puedes comprar items de la guild', usage: '/shop | vk shop' },
    { name: 'buy', description: 'Compra articulos de la tienda de la guild', usage: '/buy [articulo]' },
    { name: 'inventory', description: 'Mira tu mochila con los objetos que has comprado', usage: '/inventory | vk inventory' },
    { name: 'use', description: 'Utiliza un item especial de tu mochila', usage: '/use [item]' },
    { name: 'give', description: 'Regala un item de tu mochila a otro usuario', usage: '/give @usuario [item]' },
    { name: 'sell', description: 'Vende un item de tu inventario', usage: '/sell [item]' },
    { name: 'open', description: 'Abre una lucky box o item especial', usage: '/open [item]' },
    { name: 'trade', description: 'Intercambia objetos con otro usuario', usage: '/trade @usuario [item]' },
    { name: 'gamble', description: 'Apuesta un item y gana algo mejor o pierdelo todo', usage: '/gamble [item]' },
    { name: 'leaderboard', description: 'Top global de usuarios más ricos de la guild', usage: '/leaderboard' },
    { name: 'resetinventory', description: 'Resetea tu inventario completamente (cuidado)', usage: '/inventory reset' },
    { name: 'deposit', description: 'Deposita la cantidad de vk coins que elijas al banco de la guild', usage: '/donate' },
    { name: 'withdraw', description: 'Retira dinero del banco', usage: '/withdraw [cantidad]' },
    { name: 'donate', description: 'Donale vk coins a otro usuario', usage: '/donate [ @usuario ]' },
    { name: 'shop manager add', description: 'Agrega nuevos articulos a la tienda | solo Admins', usage: '/shopmanager add' },
    { name: 'shopmanager list', description: 'Ver todos los articulos de la tienda con sus IDs', usage: '/shopmanager list' },
    { name: 'shopmanager remove', description: 'Elimina articulos de la tienda ', usage: '/shopmanager remove' },
    { name: 'shop manager update', description: 'actualiza articulos de la tienda existentes', usage: '/shopmanager update' },
  ],
  utils: [
    { name: 'avatar', description: 'Mira el avatar de usuario', usage: '/avatar [@usuario] | vk avatar [@usuario]' },
    { name: 'banner', description: 'Mira el banner de otros usuarios \n [opcion para ver banners de usuarios que posean discord nitro]', usage: '/banner | vk banner [ @usuario ]' },
    { name: 'userinfo', description: 'Mira la info de un usuario', usage: '/userinfo [@usuario] | vk userinfo [@usuario]' },
    { name: 'serverinfo', description: 'Mira info del servidor', usage: '/serverinfo | vk serverinfo' },
    { name: 'create role personalizado', description: 'Crea tu propio rol personalizado en el servidor \n solo disponible para aquellos que compraron el comando en la tienda de la guild', usage: '/createrole' },
    { name: 'say', description: 'Hace hablar al bot por ti', usage: '/say <mensaje>' },
    { name: 'jumbo', description: 'Agranda un emoji con el bot', usage: '/jumbo | vk jumbo [emoji]' },
    { name: 'poll', description: 'Crea una encuenta publica', usage: '/poll ' },
    { name: 'skin', description: 'Mira tu skin de minecraft y tu id ', usage: '/skin [ nick de minecraft ] | vk skin [nick de minecraft]' },
    { name: 'reminder', description: 'Crear recordatorio | Alarma ', usage: '/reminder <tiempo> <mensaje> | vk reminder <tiempo> <mensaje>' },
    { name: 'birthday set', description: 'Establece tu fecha de cumpleaños', usage: '/birthday set' },
    { name: 'birthday delete', description: 'Elimina tu fecha de cumpleaños', usage: '/birthday delete' },
    { name: 'birthday view', description: 'Mira la fecha de cumpleaños de otros usuarios', usage: '/birthday view' },
    { name: 'translate', description: 'Traducir texto en el idioma seleccionado\n idiomas disponibles para el prefix\n en (Ingles)\n fr (Frances)\n de (Aleman)\n it (Italiano)\n pt (Portugues)', usage: '/translate <idioma> <texto> | vk translate <idioma> <texto>' }
  ],
  info: [
    { name: 'ping', description: 'Mira la latencia del bot', usage: '/ping | vk ping' },
    { name: 'rank', description: 'Mira el top de levels de la guild', usage: '/rank | vk rank' },
    { name: 'level', description: 'Mira que nivel eres en la guild o el de otro | puedes subir de level hablando o estando en call', usage: '/level | vk level [ @usuario ]' },
    { name: 'uptime', description: 'Mira tiempo del bot activo', usage: '/uptime | vk uptime' },
    { name: 'support', description: '¿Necesitas soporte? \n ¿o algun problema relacionado con el bot? \n ¿o solo una sugerencia para añadir al bot?\n puedes ponerte en contacto con los admninistradores del bot con este comando', usage: '/support | vk support' },
    { name: 'ask', description: 'Hazle una pregunta coherente a la IA del bot', usage: '/ask <pregunta> | vk ask <pregunta>' },
    { name: 'askbot', description: '¿Necesitas informacion sobre un comando del bot? \n usa este comando para saber todo lo que hace un comando\n Ej. vk askbot sitema de economia [el bot te dira toda la info sobre la economia de la guild ]', usage: '/askbot | vk askbot' },
    { name: 'special', description: 'Obtén recompensas especiales por tiempo limitado', usage: '/special' },
    { name: 'event', description: 'Reclama recompensas del evento activo', usage: '/event' },
    { name: 'achievements', description: 'Revisa tus logros desbloqueados', usage: '/achievements' },
    { name: 'missions', description: 'Consulta tus misiones activas y reclamables', usage: '/missions' },
  ],
  games: [
    { name: 'guess', description: 'Adivina el número que esta pensando en bot | 1 - 100', usage: '/guess | vk guess' },
    { name: 'trivia', description: 'Preguntas de trivia', usage: '/trivia | vk trivia' },
    { name: 'facha', description: '¿Quieres saber que tan fachero eres?\n con este comando podras saber si eres muy fachero o no tanto', usage: '/facha | vk facha' },
    { name: 'slots', description: 'Juega tragamonedas y gana coins', usage: '/slots | vk slots' },
    { name: 'blackjack', description: 'Juega blackjack contra el bot', usage: '/blackjack | vk blackjack' },
    { name: 'roulette', description: 'Apuesta al rojo, negro o número', usage: '/roulette | vk roulette' },
    { name: 'coinflip', description: 'Lanza una moneda y apuesta cara o cruz', usage: '/coinflip | vk coinflip' },
    { name: 'dice', description: 'Apuesta al lanzar un dado', usage: '/dice | vk dice' },
    { name: 'lottery', description: 'Participa en la lotería del día', usage: '/lottery | vk lottery' },
    { name: 'jackpot', description: 'Apuesta para ganar el bote acumulado', usage: '/jackpot | vk jackpot' },
    { name: 'luckywheel', description: 'Gira la ruleta de la suerte', usage: '/luckywheel | vk luckywheel' },
    { name: 'poker', description: 'Juega poker contra otros o el bot', usage: '/poker | vk poker' },
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
