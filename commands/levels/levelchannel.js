
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelchannel')
    .setDescription('🆙 Configurar canal para notificaciones de nivel')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal donde se enviarán las notificaciones de nivel')
        .setRequired(true)
    ),

  name: 'levelchannel',
  description: 'Configurar canal de notificaciones de nivel',
  usage: 'vk levelchannel #canal',

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({
        content: '❌ Necesitas permisos de **Gestionar Servidor** para usar este comando.',
        ephemeral: true
      });
    }

    const canal = interaction.options.getChannel('canal');
    const { db } = client.config;

    // Guardar configuración en la base de datos
    db.run(
      'INSERT OR REPLACE INTO level_config (guild_id, level_channel_id) VALUES (?, ?)',
      [interaction.guild.id, canal.id],
      function(err) {
        if (err) {
          return interaction.reply({
            content: '❌ Error al configurar el canal de niveles.',
            ephemeral: true
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('✅ Canal de Niveles Configurado')
          .setDescription(`Las notificaciones de nivel se enviarán a ${canal}`)
          .addFields(
            { name: '📍 Canal', value: canal.toString(), inline: true },
            { name: '🆔 ID', value: canal.id, inline: true }
          )
          .setColor('#00ff00')
          .setTimestamp();

        interaction.reply({ embeds: [embed] });
      }
    );
  },

  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply('❌ Necesitas permisos de **Gestionar Servidor** para usar este comando.');
    }

    const canal = message.mentions.channels.first();
    if (!canal) {
      return message.reply('❌ Debes mencionar un canal válido.\n📝 Uso: `vk levelchannel #canal`');
    }

    const { db } = client.config;

    db.run(
      'INSERT OR REPLACE INTO level_config (guild_id, level_channel_id) VALUES (?, ?)',
      [message.guild.id, canal.id],
      function(err) {
        if (err) {
          return message.reply('❌ Error al configurar el canal de niveles.');
        }

        const embed = new EmbedBuilder()
          .setTitle('✅ Canal de Niveles Configurado')
          .setDescription(`Las notificaciones de nivel se enviarán a ${canal}`)
          .setColor('#00ff00')
          .setTimestamp();

        message.reply({ embeds: [embed] });
      }
    );
  }
};
