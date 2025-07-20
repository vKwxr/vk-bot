const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shopmanager')
    .setDescription('🛍️ Gestionar la tienda del servidor')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Agregar artículo a la tienda')
        .addStringOption(option =>
          option.setName('nombre')
            .setDescription('Nombre del artículo')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('precio')
            .setDescription('Precio del artículo')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('descripcion')
            .setDescription('Descripción del artículo')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('emoji')
            .setDescription('Emoji del artículo')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('categoria')
            .setDescription('Categoría del artículo')
            .addChoices(
              { name: 'Roles', value: 'roles' },
              { name: 'Potenciadores', value: 'boosts' },
              { name: 'Artículos', value: 'items' },
              { name: 'Especiales', value: 'special' }
            )
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option.setName('stock')
            .setDescription('Stock disponible (-1 = ilimitado)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Eliminar artículo de la tienda')
        .addIntegerOption(option =>
          option.setName('id')
            .setDescription('ID del artículo a eliminar')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Ver todos los artículos con sus IDs')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setDescription('Actualizar artículo existente')
        .addIntegerOption(option =>
          option.setName('id')
            .setDescription('ID del artículo')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('campo')
            .setDescription('Campo a actualizar')
            .addChoices(
              { name: 'Nombre', value: 'name' },
              { name: 'Precio', value: 'price' },
              { name: 'Descripción', value: 'description' },
              { name: 'Stock', value: 'stock' }
            )
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('valor')
            .setDescription('Nuevo valor')
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '❌ Solo los administradores pueden gestionar la tienda.',
        ephemeral: true
      });
    }

    const { economyDb } = client.config;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const nombre = interaction.options.getString('nombre');
      const precio = interaction.options.getInteger('precio');
      const descripcion = interaction.options.getString('descripcion');
      const emoji = interaction.options.getString('emoji') || '🎁';
      const categoria = interaction.options.getString('categoria') || 'items';
      const stock = interaction.options.getInteger('stock') || -1;

      economyDb.run(
        `INSERT INTO shop_items (name, price, description, emoji, category, stock) VALUES (?, ?, ?, ?, ?, ?)`,
        [nombre, precio, descripcion, emoji, categoria, stock],
        function(err) {
          if (err) {
            return interaction.reply({
              content: '❌ Error al agregar el artículo.',
              ephemeral: true
            });
          }

          const embed = new EmbedBuilder()
            .setTitle('✅ Artículo Agregado')
            .addFields(
              { name: '🏷️ Nombre', value: nombre, inline: true },
              { name: '💰 Precio', value: `${precio} monedas`, inline: true },
              { name: '📝 Descripción', value: descripcion, inline: false },
              { name: '📂 Categoría', value: categoria, inline: true },
              { name: '📦 Stock', value: stock === -1 ? 'Ilimitado' : stock.toString(), inline: true },
              { name: '🆔 ID', value: this.lastID.toString(), inline: true }
            )
            .setColor('#00ff00')
            .setTimestamp();

          interaction.reply({ embeds: [embed] });
        }
      );

    } else if (subcommand === 'remove') {
      const id = interaction.options.getInteger('id');

      economyDb.get('SELECT * FROM shop_items WHERE id = ?', [id], (err, row) => {
        if (!row) {
          return interaction.reply({
            content: '❌ No se encontró un artículo con ese ID.',
            ephemeral: true
          });
        }

        economyDb.run('DELETE FROM shop_items WHERE id = ?', [id], (err) => {
          if (err) {
            return interaction.reply({
              content: '❌ Error al eliminar el artículo.',
              ephemeral: true
            });
          }

          const embed = new EmbedBuilder()
            .setTitle('🗑️ Artículo Eliminado')
            .setDescription(`Se eliminó **${row.name}** de la tienda`)
            .setColor('#ff0000')
            .setTimestamp();

          interaction.reply({ embeds: [embed] });
        });
      });

    } else if (subcommand === 'list') {
      economyDb.all('SELECT * FROM shop_items ORDER BY category, id', [], (err, items) => {
        if (err || !items.length) {
          return interaction.reply({
            content: '❌ No hay artículos en la tienda o error al cargar.',
            ephemeral: true
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('🛍️ Gestión de Tienda - Lista Completa')
          .setColor('#9966ff')
          .setTimestamp();

        const categories = {};
        items.forEach(item => {
          if (!categories[item.category]) categories[item.category] = [];
          categories[item.category].push(item);
        });

        Object.keys(categories).forEach(category => {
          const categoryItems = categories[category];
          const itemList = categoryItems.map(item => {
            const stock = item.stock === -1 ? '∞' : item.stock;
            return `**ID ${item.id}:** ${item.emoji} ${item.name} - $${item.price} (Stock: ${stock})`;
          }).join('\n');

          embed.addFields({
            name: `📂 ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            value: itemList,
            inline: false
          });
        });

        interaction.reply({ embeds: [embed], ephemeral: true });
      });

    } else if (subcommand === 'update') {
      const id = interaction.options.getInteger('id');
      const campo = interaction.options.getString('campo');
      const valor = interaction.options.getString('valor');

      const validFields = { name: 'name', price: 'price', description: 'description', stock: 'stock' };
      const dbField = validFields[campo];

      if (!dbField) {
        return interaction.reply({
          content: '❌ Campo no válido.',
          ephemeral: true
        });
      }

      const finalValue = (campo === 'price' || campo === 'stock') ? parseInt(valor) : valor;

      economyDb.run(
        `UPDATE shop_items SET ${dbField} = ? WHERE id = ?`,
        [finalValue, id],
        function(err) {
          if (err) {
            return interaction.reply({
              content: '❌ Error al actualizar el artículo.',
              ephemeral: true
            });
          }

          if (this.changes === 0) {
            return interaction.reply({
              content: '❌ No se encontró un artículo con ese ID.',
              ephemeral: true
            });
          }

          const embed = new EmbedBuilder()
            .setTitle('✅ Artículo Actualizado')
            .setDescription(`**${campo}** actualizado a: **${valor}**`)
            .addFields({ name: '🆔 ID del Artículo', value: id.toString(), inline: true })
            .setColor('#00ff00')
            .setTimestamp();

          interaction.reply({ embeds: [embed] });
        }
      );
    }
  }
};

// Insertar algunos items por defecto si la tienda está vacía
      economyDb.get('SELECT COUNT(*) as count FROM shop_items', [], (err, row) => {
        if (!err && row.count === 0) {
          const defaultItems = [
            ['VIP Role', 5000, 'Rol VIP exclusivo del servidor', '👑', 'roles', 1],
            ['Custom Color', 2000, 'Color personalizado para tu nombre', '🎨', 'cosmetic', -1],
            ['Extra XP Boost', 3000, 'Doble XP por 24 horas', '⚡', 'boosts', 10],
            ['Crear Rol Personalizado', 20000, 'Permiso permanente para usar el comando /createrole - Crea roles personalizados con el nombre y color que quieras', '🎨', 'permisos', -1]
          ];

          defaultItems.forEach(item => {
            economyDb.run(
              'INSERT INTO shop_items (name, price, description, emoji, category, stock) VALUES (?, ?, ?, ?, ?, ?)',
              item
            );
          });
        }
      });