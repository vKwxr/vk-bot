const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../../sorteos.sqlite');

let sorteosDb;
try {
  sorteosDb = new Database(dbPath);
  console.log('Conexión a la base de datos establecida correctamente.');
} catch (error) {
  console.error('Error al conectar con la base de datos:', error);
  return; 
}


const createTable = `
  CREATE TABLE IF NOT EXISTS sorteos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    canal_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    premio TEXT NOT NULL,
    ganadores INTEGER NOT NULL,
    finaliza INTEGER NOT NULL,
    rol_requerido TEXT,
    imagen TEXT,
    participantes TEXT,
    patrocinador_id TEXT NOT NULL,
    min_invites INTEGER,
    activo INTEGER
  );
`;

try {
  sorteosDb.prepare(createTable).run();
} catch (error) {
  console.error("Error al crear la tabla:", error);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('🎉 Crear un sorteo automático')
    .addChannelOption(option =>
      option.setName('canal').setDescription('Canal donde se publicará').setRequired(true))
    .addUserOption(option =>
      option.setName('patrocinador').setDescription('Usuario que patrocina el sorteo').setRequired(true))
    .addStringOption(option =>
      option.setName('titulo').setDescription('Título del sorteo').setRequired(true))
    .addStringOption(option =>
      option.setName('premio').setDescription('Premio del sorteo').setRequired(true))
    .addStringOption(option =>
      option.setName('duracion').setDescription('Duración (ej: 2h, 1d)').setRequired(true))
    .addIntegerOption(option =>
      option.setName('ganadores').setDescription('Número de ganadores').setRequired(false).setMinValue(1).setMaxValue(10))
    .addRoleOption(option =>
      option.setName('rol_requerido').setDescription('Rol requerido para participar').setRequired(false))
    .addIntegerOption(option =>
      option.setName('invites_minimas').setDescription('Invitaciones mínimas requeridas').setRequired(false).setMinValue(0))
    .addStringOption(option =>
      option.setName('imagen').setDescription('URL de imagen (opcional)').setRequired(false))
    .addBooleanOption(option =>
      option.setName('mencionar_everyone').setDescription('¿Mencionar @everyone?').setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Solo administradores pueden crear sorteos.', ephemeral: true });
    }

    const canal = interaction.options.getChannel('canal');
    const titulo = interaction.options.getString('titulo');
    const premio = interaction.options.getString('premio');
    const duracion = interaction.options.getString('duracion');
    const ganadores = interaction.options.getInteger('ganadores') || 1;
    const rolRequerido = interaction.options.getRole('rol_requerido');
    const invitesMinimas = interaction.options.getInteger('invites_minimas') || 0;
    const imagen = interaction.options.getString('imagen');
    const mencionarEveryone = interaction.options.getBoolean('mencionar_everyone') ?? false;
    const patrocinador = interaction.options.getUser('patrocinador');

   const timeMatch = duracion.match(/^(\d+)([mhd])$/); // acepta m, h y d
    if (!timeMatch) {
    return interaction.reply({ content: '❌ Formato de duración inválido. Usa `10m`, `2h` o `1d`.', ephemeral: true });
}

  const [, tiempo, unidad] = timeMatch;
  let ms;
  switch (unidad) {
  case 'm': ms = parseInt(tiempo) * 60000; break;
  case 'h': ms = parseInt(tiempo) * 3600000; break;
  case 'd': ms = parseInt(tiempo) * 86400000; break;
}

const finaliza = Date.now() + ms;


    const embed = new EmbedBuilder()
      .setTitle(`🎉 ${titulo}`)
      .setDescription(
        `\`\`\`
🎁 Premio: ${premio}
👥 Ganadores: ${ganadores}
⏰ Finaliza: <t:${Math.floor(finaliza / 1000)}:R>
${rolRequerido ? `🎭 Rol requerido: ${rolRequerido.name}\n` : ''}${invitesMinimas > 0 ? `📨 Invitaciones mínimas: ${invitesMinimas}` : ''}
\`\`\`
👥 Participantes: 0
¡Haz clic en el botón para participar!`
      )
      .setColor('#ffb300')
      .setFooter({ text: `Patrocinado por ${patrocinador.tag}` })
      .setTimestamp();

    if (imagen?.startsWith('http')) {
      embed.setImage(imagen);
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_join')
        .setLabel('Participar')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎉'),
      new ButtonBuilder()
        .setCustomId('giveaway_list')
        .setLabel('Ver Participantes')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📋')
    );

    const mensaje = await canal.send({
      content: mencionarEveryone ? '@everyone' : rolRequerido ? `${rolRequerido}` : '',
      embeds: [embed],
      components: [row]
    });

    sorteosDb.prepare(
      `INSERT INTO sorteos (message_id, canal_id, titulo, premio, ganadores, finaliza, rol_requerido, imagen, participantes, patrocinador_id, min_invites, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      mensaje.id,
      canal.id,
      titulo,
      premio,
      ganadores,
      finaliza,
      rolRequerido?.id || null,
      imagen || null,
      JSON.stringify([]),
      patrocinador.id,
      invitesMinimas,
      1
    );

    await interaction.reply({ content: '✅ Sorteo creado correctamente.', ephemeral: true });
  }
};
