const path = require('path');

const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('🗑️ Elimina una cantidad específica de mensajes')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Número de mensajes a eliminar (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Eliminar mensajes solo de este usuario')
        .setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: '❌ No tienes permisos para gestionar mensajes.',
        ephemeral: true
      });
    }

    const cantidad = interaction.options.getInteger('cantidad');
    const usuario = interaction.options.getUser('usuario');

    try {
      await interaction.deferReply({ ephemeral: true });

      let mensajes;
      if (usuario) {
        const allMessages = await interaction.channel.messages.fetch({ limit: 100 });
        mensajes = allMessages.filter(msg => msg.author.id === usuario.id).first(cantidad);
      } else {
        mensajes = await interaction.channel.messages.fetch({ limit: cantidad });
      }

      if (mensajes.size === 0) {
        return interaction.editReply('❌ No se encontraron mensajes para eliminar.');
      }

      const deletedMessages = await interaction.channel.bulkDelete(mensajes, true);

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Mensajes Eliminados')
        .setDescription(usuario ? 
          `Se eliminaron **${deletedMessages.size}** mensajes de ${usuario.tag}` :
          `Se eliminaron **${deletedMessages.size}** mensajes`)
        .setColor('#ff4444')
        .setFooter({ text: `Por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Error al eliminar mensajes. Algunos mensajes pueden ser muy antiguos.');
    }
  },

  name: 'clear',
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply('❌ No tienes permisos para gestionar mensajes.');
    }

    const cantidad = parseInt(args[0]);
    if (!cantidad || cantidad < 1 || cantidad > 100) {
      return message.reply('❌ Especifica un número válido entre 1 y 100.');
    }

    try {
      const mensajes = await message.channel.messages.fetch({ limit: cantidad + 1 });
      const deletedMessages = await message.channel.bulkDelete(mensajes, true);

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Mensajes Eliminados')
        .setDescription(`Se eliminaron **${deletedMessages.size - 1}** mensajes`)
        .setColor('#ff4444')
        .setFooter({ text: `Por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      const reply = await message.channel.send({ embeds: [embed] });
      setTimeout(() => reply.delete().catch(() => {}), 5000);

    } catch (error) {
      console.error(error);
      message.reply('❌ Error al eliminar mensajes.');
    }
  }
};
