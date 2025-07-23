
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anuncio')
    .setDescription('📢 Crea un anuncio oficial')
    .addStringOption(option =>
      option.setName('titulo')
        .setDescription('Título del anuncio')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('mensaje')
        .setDescription('Contenido del anuncio')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal donde enviar el anuncio')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText))
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Color del embed')
        .setRequired(false)
        .addChoices(
          { name: '🔴 Rojo', value: 'RED' },
          { name: '🟢 Verde', value: 'GREEN' },
          { name: '🔵 Azul', value: 'BLUE' },
          { name: '🟡 Amarillo', value: 'YELLOW' },
          { name: '🟣 Morado', value: 'PURPLE' },
          { name: '⚪ Blanco', value: 'WHITE' }
        ))
    .addBooleanOption(option =>
      option.setName('ping')
        .setDescription('Mencionar @everyone')
        .setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '❌ Solo los administradores pueden usar este comando.',
        ephemeral: true
      });
    }

    const titulo = interaction.options.getString('titulo');
    const mensaje = interaction.options.getString('mensaje');
    const canal = interaction.options.getChannel('canal') || interaction.channel;
    const colorOption = interaction.options.getString('color') || 'BLUE';
    const ping = interaction.options.getBoolean('ping') || false;

    const colores = {
      'RED': '#e74c3c',
      'GREEN': '#2ecc71',
      'BLUE': '#3498db',
      'YELLOW': '#f1c40f',
      'PURPLE': '#9b59b6',
      'WHITE': '#ffffff'
    };

    const embed = new EmbedBuilder()
      .setTitle(`📢 ${titulo}`)
      .setDescription(mensaje)
      .setColor(colores[colorOption])
      .setFooter({ 
        text: `Anuncio oficial • ${interaction.guild.name}`,
        iconURL: interaction.guild.iconURL() 
      })
      .setTimestamp();

    if (interaction.guild.iconURL()) {
      embed.setThumbnail(interaction.guild.iconURL());
    }

    try {
      const content = ping ? '@everyone' : '';
      await canal.send({ content, embeds: [embed] });

      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Anuncio Enviado')
        .setDescription(`El anuncio ha sido enviado correctamente en ${canal}`)
        .addFields(
          { name: '📋 Título', value: titulo, inline: true },
          { name: '📊 Ping', value: ping ? 'Sí' : 'No', inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();

      await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Error al enviar el anuncio. Verifica los permisos del bot.',
        ephemeral: true
      });
    }
  },

  name: 'anuncio',
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Solo los administradores pueden usar este comando.');
    }

    if (args.length < 2) {
      return message.reply('❌ Uso: `vkanuncio <título> | <mensaje>`\nEjemplo: `vkanuncio Evento especial | Mañana habrá un evento increíble`');
    }

    const contenido = args.join(' ');
    const partes = contenido.split(' | ');

    if (partes.length < 2) {
      return message.reply('❌ Separa el título y mensaje con " | "');
    }

    const titulo = partes[0];
    const mensajeAnuncio = partes[1];

    const embed = new EmbedBuilder()
      .setTitle(`📢 ${titulo}`)
      .setDescription(mensajeAnuncio)
      .setColor('#3498db')
      .setFooter({ 
        text: `Anuncio oficial • ${message.guild.name}`,
        iconURL: message.guild.iconURL() 
      })
      .setTimestamp();

    if (message.guild.iconURL()) {
      embed.setThumbnail(message.guild.iconURL());
    }

    try {
      await message.delete().catch(() => {});
      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await message.channel.send('❌ Error al enviar el anuncio.');
    }
  }
};
