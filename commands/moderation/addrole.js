const path = require('path');

const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Agregar rol a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que agregar el rol')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Rol a agregar')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón para agregar el rol')
        .setRequired(false)
    ),

  name: 'addrole',
  description: 'Agregar rol a un usuario',
  usage: 'vk addrole <@usuario> <@rol> [razón]',

  async execute(interaction, client) {
    const usuario = interaction.options.getUser('usuario');
    const rol = interaction.options.getRole('rol');
    const razon = interaction.options.getString('razon') || 'No especificada';

    await this.handleAddRole(interaction, usuario, rol, razon);
  },

  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply('❌ **No tienes permisos para gestionar roles**');
    }

    if (args.length < 2) {
      return message.reply('❌ **Uso correcto:** `vk addrole <@usuario> <@rol> [razón]`');
    }

    const usuario = message.mentions.users.first();
    const rol = message.mentions.roles.first();
    const razon = args.slice(2).join(' ') || 'No especificada';

    if (!usuario) {
      return message.reply('❌ **Debes mencionar un usuario válido**');
    }

    if (!rol) {
      return message.reply('❌ **Debes mencionar un rol válido**');
    }

    await this.handleAddRole(message, usuario, rol, razon);
  },

  async handleAddRole(context, usuario, rol, razon) {
    const isInteraction = context.replied !== undefined;

    try {
      if (!context.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Sin Permisos')
          .setDescription('No tienes permisos para gestionar roles')
          .setColor('#ff0000');

        return isInteraction 
          ? await context.reply({ embeds: [embed], ephemeral: true })
          : await context.reply({ embeds: [embed] });
      }

      const member = await context.guild.members.fetch(usuario.id);
      
      if (!member) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Error')
          .setDescription('No se pudo encontrar al usuario en el servidor')
          .setColor('#ff0000');

        return isInteraction 
          ? await context.reply({ embeds: [embed], ephemeral: true })
          : await context.reply({ embeds: [embed] });
      }

      if (member.roles.cache.has(rol.id)) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Error')
          .setDescription(`${usuario.username} ya tiene el rol ${rol.name}`)
          .setColor('#ff0000');

        return isInteraction 
          ? await context.reply({ embeds: [embed], ephemeral: true })
          : await context.reply({ embeds: [embed] });
      }

      if (rol.position >= context.guild.members.me.roles.highest.position) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Error')
          .setDescription('No puedo agregar este rol porque está por encima de mi posición')
          .setColor('#ff0000');

        return isInteraction 
          ? await context.reply({ embeds: [embed], ephemeral: true })
          : await context.reply({ embeds: [embed] });
      }

      await member.roles.add(rol, razon);

      const embed = new EmbedBuilder()
        .setTitle('✅ Rol Agregado')
        .setDescription(`Se agregó el rol ${rol} a ${usuario}`)
        .addFields(
          { name: '👤 Usuario', value: `${usuario} (${usuario.id})`, inline: true },
          { name: '🏷️ Rol', value: `${rol} (${rol.id})`, inline: true },
          { name: '📝 Razón', value: razon, inline: false },
          { name: '👮 Moderador', value: `${context.user || context.author}`, inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();

      return isInteraction 
        ? await context.reply({ embeds: [embed] })
        : await context.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error en addrole:', error);
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('Hubo un error al agregar el rol')
        .setColor('#ff0000');

      return isInteraction 
        ? await context.reply({ embeds: [embed], ephemeral: true })
        : await context.reply({ embeds: [embed] });
    }
  }
};
