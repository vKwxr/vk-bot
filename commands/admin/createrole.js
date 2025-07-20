
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createrole')
    .setDescription('🎨 Crea un rol personalizado (Requiere comprar en la tienda)')
    .addStringOption(option =>
      option.setName('nombre')
        .setDescription('Nombre del rol')
        .setRequired(true)
        .setMaxLength(50)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Color del rol en hexadecimal (ejemplo: #ff0000)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option.setName('separado')
        .setDescription('¿Mostrar el rol por separado en la lista de miembros?')
        .setRequired(false)
    ),

  name: 'createrole',
  description: 'Crear rol personalizado',
  usage: 'vk createrole <nombre> [color] [separado]',

  async execute(interaction, client) {
    const nombre = interaction.options.getString('nombre');
    const color = interaction.options.getString('color') || '#99AAB5';
    const separado = interaction.options.getBoolean('separado') || false;
    
    await this.handleCreateRole(interaction, interaction.user, nombre, color, separado, client);
  },

  async run(message, args, client) {
    if (!args[0]) {
      return message.reply('❌ **Debes proporcionar un nombre para el rol**\n📝 Uso: `vk createrole <nombre> [color] [separado]`');
    }

    const nombre = args[0];
    const color = args[1] || '#99AAB5';
    const separado = args[2]?.toLowerCase() === 'true' || args[2]?.toLowerCase() === 'si';

    await this.handleCreateRole(message, message.author, nombre, color, separado, client);
  },

  async handleCreateRole(context, user, nombre, color, separado, client) {
    const isInteraction = context.replied !== undefined;
    const { economyDb, ADMIN_ROLE_ID } = client.config;

    // Verificar si es administrador (gratis para admins)
    const member = isInteraction ? context.member : context.member;
    const isAdmin = member.roles.cache.has(ADMIN_ROLE_ID);

    if (!isAdmin) {
      // Verificar si el usuario compró el permiso en la tienda
      economyDb.get(
        `SELECT ui.* FROM user_inventory ui 
         JOIN shop_items si ON ui.item_id = si.id 
         WHERE ui.user_id = ? AND si.name = 'Crear Rol Personalizado'`,
        [user.id],
        async (err, purchaseRow) => {
          if (err) {
            const errorEmbed = new EmbedBuilder()
              .setTitle('❌ Error de Base de Datos')
              .setDescription('No se pudo verificar tus compras.')
              .setColor('#ff0000');
            
            return isInteraction 
              ? await context.reply({ embeds: [errorEmbed], ephemeral: true })
              : await context.reply({ embeds: [errorEmbed] });
          }

          if (!purchaseRow) {
            const noPermissionEmbed = new EmbedBuilder()
              .setTitle('🔒 Comando Bloqueado')
              .setDescription('**Este comando requiere una compra especial en la tienda**')
              .addFields(
                { name: '💰 Precio', value: '20,000 VK Coins', inline: true },
                { name: '🛒 Dónde Comprar', value: 'Usa `/shop` para verlo', inline: true },
                { name: '✨ Qué Obtienes', value: 'Permiso permanente para crear roles personalizados', inline: false },
                { name: '📝 Cómo Comprar', value: '`/buy Crear Rol Personalizado`', inline: false }
              )
              .setColor('#ffaa00')
              .setFooter({ text: 'VK Community • Sistema de Tienda' })
              .setTimestamp();

            return isInteraction 
              ? await context.reply({ embeds: [noPermissionEmbed], ephemeral: true })
              : await context.reply({ embeds: [noPermissionEmbed] });
          }

          // El usuario sí compró el permiso, continuar con la creación del rol
          await this.createCustomRole(context, user, nombre, color, separado, client);
        }
      );
    } else {
      // Es admin, crear rol directamente
      await this.createCustomRole(context, user, nombre, color, separado, client);
    }
  },

  async createCustomRole(context, user, nombre, color, separado, client) {
    const isInteraction = context.replied !== undefined;
    
    try {
      // Validar color
      if (!color.match(/^#[0-9A-F]{6}$/i)) {
        const invalidColorEmbed = new EmbedBuilder()
          .setTitle('❌ Color Inválido')
          .setDescription('El color debe estar en formato hexadecimal (ejemplo: #ff0000)')
          .addFields(
            { name: '✅ Ejemplos Válidos', value: '#ff0000 (rojo)\n#00ff00 (verde)\n#0000ff (azul)\n#ffaa00 (naranja)', inline: false }
          )
          .setColor('#ff0000');

        return isInteraction 
          ? await context.reply({ embeds: [invalidColorEmbed], ephemeral: true })
          : await context.reply({ embeds: [invalidColorEmbed] });
      }

      // Crear el rol
      const guild = isInteraction ? context.guild : context.guild;
      const role = await guild.roles.create({
        name: nombre,
        color: color,
        hoist: separado,
        reason: `Rol personalizado creado por ${user.tag}`,
        permissions: []
      });

      // Asignar el rol al usuario
      const member = isInteraction ? context.member : context.member;
      await member.roles.add(role);

      // Respuesta exitosa
      const successEmbed = new EmbedBuilder()
        .setTitle('🎨 ¡Rol Creado Exitosamente!')
        .setDescription(`Tu rol personalizado **${nombre}** ha sido creado y asignado.`)
        .addFields(
          { name: '🏷️ Nombre del Rol', value: `<@&${role.id}>`, inline: true },
          { name: '🎨 Color', value: color.toUpperCase(), inline: true },
          { name: '📋 Separado en Lista', value: separado ? 'Sí' : 'No', inline: true },
          { name: '👤 Creado por', value: user.toString(), inline: true },
          { name: '🆔 ID del Rol', value: role.id, inline: true },
          { name: '⏰ Fecha de Creación', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true }
        )
        .setColor(color)
        .setFooter({ text: 'VK Community • Roles Personalizados' })
        .setTimestamp();

      return isInteraction 
        ? await context.reply({ embeds: [successEmbed] })
        : await context.reply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error creando rol personalizado:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error al Crear Rol')
        .setDescription('No se pudo crear el rol personalizado. Verifica que el bot tenga permisos suficientes.')
        .addFields(
          { name: '🔧 Posibles Soluciones', value: '• El bot necesita permiso "Gestionar Roles"\n• El rol del bot debe estar por encima del rol a crear\n• Verifica que el nombre no esté en uso', inline: false }
        )
        .setColor('#ff0000')
        .setFooter({ text: 'Contacta a un administrador si el problema persiste' });

      return isInteraction 
        ? await context.reply({ embeds: [errorEmbed], ephemeral: true })
        : await context.reply({ embeds: [errorEmbed] });
    }
  }
};
