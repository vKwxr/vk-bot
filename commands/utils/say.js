const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('📢 Haz que el bot diga algo')
    .addStringOption(option =>
      option.setName('mensaje')
        .setDescription('Mensaje que el bot debe decir')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal donde enviar el mensaje')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('embed')
        .setDescription('Enviar como embed elegante')
        .setRequired(false)),

  async execute(interaction, client) {
    // ✅ Obtener miembro completo para asegurar permisos
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: '❌ Necesitas permisos de **Gestionar Mensajes** para usar este comando.',
        ephemeral: true
      });
    }

    const mensaje = interaction.options.getString('mensaje');
    const canal = interaction.options.getChannel('canal') || interaction.channel;
    const usarEmbed = interaction.options.getBoolean('embed') || false;

    // 🔒 Filtrar contenido inapropiado
    const palabrasProhibidas = ['@everyone', '@here', 'discord.gg/', 'https://discord.com/'];
    const contieneProhibida = palabrasProhibidas.some(palabra =>
      mensaje.toLowerCase().includes(palabra.toLowerCase())
    );

    if (contieneProhibida) {
      return interaction.reply({
        content: '❌ El mensaje contiene contenido no permitido (menciones masivas o invitaciones).',
        ephemeral: true
      });
    }

    try {
      if (usarEmbed) {
        const embed = new EmbedBuilder()
          .setDescription(mensaje)
          .setColor('#9966ff')
          .setFooter({ text: `Enviado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        await canal.send({ embeds: [embed] });
      } else {
        await canal.send(mensaje);
      }

      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Mensaje Enviado')
        .setDescription(`Mensaje enviado correctamente en ${canal}`)
        .addFields(
          { name: '📝 Contenido', value: mensaje.length > 100 ? `${mensaje.substring(0, 100)}...` : mensaje, inline: false },
          { name: '📊 Formato', value: usarEmbed ? 'Embed' : 'Texto plano', inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();

      await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Error al enviar el mensaje. Verifica que tenga permisos en ese canal.',
        ephemeral: true
      });
    }
  },

  // 🎯 Comando clásico (prefijo)
  name: 'say',
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply('❌ **No tienes permisos para usar este comando**');
    }

    if (!args.length) {
      return message.reply('❌ **Debes proporcionar un mensaje**\n📝 Uso: `vk say <mensaje>`');
    }

    const texto = args.join(' ');

    try {
      await message.channel.send(texto);
      await message.delete().catch(() => {}); // Ignorar si no puede borrar
    } catch (error) {
      console.error('Error en comando say:', error);
      message.reply('❌ **Error al enviar el mensaje**');
    }
  }
};
