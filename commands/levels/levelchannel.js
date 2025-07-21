const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelchannel')
    .setDescription('🆙 Configura el canal para notificaciones de nivel')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal donde se enviarán las notificaciones de nivel')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText) // Solo canales de texto
    ),
  name: 'levelchannel',
  description: 'Configura el canal de notificaciones de nivel',
  usage: 'vk levelchannel #canal',

  async execute(interaction, client) {
    // Verificar permisos
if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({
        content: '❌ Necesitas permisos de Gestionar Servidor para usar este comando.',
        ephemeral: true,
      });
    }

    const canal = interaction.options.getChannel('canal');

    // Validar que el canal sea de texto
    if (canal.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: '❌ Debes seleccionar un canal de texto válido.',
        ephemeral: true,
      });
    }

    // Verificar permisos del bot en el canal
    if (!canal.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({
        content: '❌ No tengo permisos para enviar mensajes en ese canal.',
        ephemeral: true,
      });
    }

    const { db } = client.config;

    // Verificar que la base de datos esté inicializada
    if (!db) {
      return interaction.reply({
        content: '❌ Error en la configuración de la base de datos. Contacta al administrador.',
        ephemeral: true,
      });
    }

    try {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR REPLACE INTO level_config (guild_id, level_channel_id) VALUES (?, ?)',
          [interaction.guild.id, canal.id],
          function (err) {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      const embed = new EmbedBuilder()
        .setTitle('✅ ¡Canal de Niveles Configurado')
        .setDescription('Las notificaciones de nivel se enviarán a ${canal}')
        .addFields(
          { name: '📍 Canal', value: canal.toString(), inline: true },
          { name: '🆔 ID', value: canal.id, inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
console.error('Error al configurar el canal de niveles:', err);
      return interaction.reply({
        content:  'Error al guardar la configuración: ${err.message}',
        ephemeral: true,
      });
    }
  },

  async run(message, args, client) {
    // Verificar permisos
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply('❌ Necesitas permisos de Gestionar Servidor para usar este comando.');
    }

    const canal = message.mentions.channels.first();
    if (!canal) {
      return message.reply('❌ Debes mencionar un canal válido.\n📝 Uso: vk levelchannel #canal');
    }

    // Validar que el canal sea de texto
    if (canal.type !== ChannelType.GuildText) {
      return message.reply('❌ Debes mencionar un canal de texto válido.');
    }

    // Verificar permisos del bot en el canal
    if (!canal.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
      return message.reply('❌ ¡Nya! No tengo permisos para enviar mensajes en ese canal.');
    }

    const { db } = client.config;

    // Verificar que la base de datos esté inicializada
    if (!db) {
      return message.reply('❌ ¡Nya! Error en la configuración de la base de datos. Contacta al administrador.');
    }

    try {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR REPLACE INTO level_config (guild_id, level_channel_id) VALUES (?, ?)',
          [message.guild.id, canal.id],
          function (err) {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      const embed = new EmbedBuilder()
        .setTitle('✅ ¡Canal de Niveles Configurado, nya!')
        .setDescription('Las notificaciones de nivel se enviarán a ${canal}')
        .addFields(
          { name: '📍 Canal', value: canal.toString(), inline: true },
          { name: '🆔 ID', value: canal.id, inline: true }
        )
.setColor('#00ff00')
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Error al configurar el canal de niveles:', err);
      return message.reply(' Error al guardar la configuración: ${err.message}');
    }
  },
};