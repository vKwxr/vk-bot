const path = require('path');
// 📁 economy/extras.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('better-sqlite3')(path.join(__dirname, "./main.db"));

module.exports = [
  // ✅ /sell
  {
    data: new SlashCommandBuilder()
      .setName('sell')
      .setDescription('Vende un ítem de tu inventario')
      .addStringOption(opt => opt.setName('item').setDescription('Nombre del ítem').setRequired(true))
      .addIntegerOption(opt => opt.setName('cantidad').setDescription('Cantidad a vender').setRequired(false)),
    async execute(interaction) {
      const userId = interaction.user.id;
      const itemName = interaction.options.getString('item');
      const cantidad = interaction.options.getInteger('cantidad') || 1;

      const item = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND item_name = ?').get(userId, itemName);
      if (!item || item.amount < cantidad) return interaction.reply({ content: 'No tienes suficientes de ese ítem.', ephemeral: true });

      const tienda = db.prepare('SELECT * FROM shop WHERE item_name = ?').get(itemName);
      if (!tienda) return interaction.reply({ content: 'Ese ítem no existe en la tienda.', ephemeral: true });

      const total = Math.floor((tienda.price / 2) * cantidad);
      db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(total, userId);
      db.prepare('UPDATE inventory SET amount = amount - ? WHERE user_id = ? AND item_name = ?').run(cantidad, userId, itemName);
      interaction.reply(`Vendiste **${cantidad} ${itemName}** por 💸 **${total} coins**.`);
    }
  },

  // ✅ /trade
  {
    data: new SlashCommandBuilder()
      .setName('trade')
      .setDescription('Intercambia ítems con otro usuario')
      .addUserOption(opt => opt.setName('usuario').setDescription('Usuario con quien intercambiar').setRequired(true))
      .addStringOption(opt => opt.setName('item').setDescription('Ítem a intercambiar').setRequired(true))
      .addIntegerOption(opt => opt.setName('cantidad').setDescription('Cantidad').setRequired(true)),
    async execute(interaction) {
      const fromId = interaction.user.id;
      const toUser = interaction.options.getUser('usuario');
      const toId = toUser.id;
      const item = interaction.options.getString('item');
      const cantidad = interaction.options.getInteger('cantidad');

      if (fromId === toId) return interaction.reply({ content: 'No puedes intercambiar contigo mismo 🧠', ephemeral: true });
      const inv = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND item_name = ?').get(fromId, item);
      if (!inv || inv.amount < cantidad) return interaction.reply({ content: 'No tienes suficientes de ese ítem.', ephemeral: true });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('aceptar_trade').setLabel('Aceptar').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('cancelar_trade').setLabel('Cancelar').setStyle(ButtonStyle.Danger)
      );

      const msg = await interaction.reply({ content: `${toUser}, ¿aceptas intercambiar **${cantidad} ${item}** con ${interaction.user}?`, components: [row], fetchReply: true });

      const filter = i => i.user.id === toId;
      const collector = msg.createMessageComponentCollector({ filter, time: 15000 });

      collector.on('collect', i => {
        if (i.customId === 'aceptar_trade') {
          db.prepare('UPDATE inventory SET amount = amount - ? WHERE user_id = ? AND item_name = ?').run(cantidad, fromId, item);
          const existing = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND item_name = ?').get(toId, item);
          if (existing) {
            db.prepare('UPDATE inventory SET amount = amount + ? WHERE user_id = ? AND item_name = ?').run(cantidad, toId, item);
          } else {
            db.prepare('INSERT INTO inventory (user_id, item_name, rarity, amount) VALUES (?, ?, ?, ?)').run(toId, item, inv.rarity, cantidad);
          }
          i.update({ content: '✅ ¡Intercambio completado!', components: [] });
        } else {
          i.update({ content: '❌ El intercambio fue cancelado.', components: [] });
        }
        collector.stop();
      });

      collector.on('end', (_, reason) => {
        if (reason === 'time') interaction.editReply({ content: '⏱️ Tiempo agotado.', components: [] });
      });
    }
  },

  // ✅ /open (acceso rápido)
  {
    data: new SlashCommandBuilder()
      .setName('open')
      .setDescription('Abre una lucky box u objeto especial')
      .addStringOption(opt => opt.setName('item').setDescription('Nombre del ítem').setRequired(true)),
    async execute(interaction) {
      const { user } = interaction;
      const itemName = interaction.options.getString('item');
      const inv = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND item_name = ?').get(user.id, itemName);
      if (!inv || inv.amount < 1) return interaction.reply({ content: 'No tienes ese ítem.', ephemeral: true });

      const premios = [
        { nombre: 'Gem rara', rarity: 'rara' },
        { nombre: 'Dinero', coins: 1000 },
        { nombre: 'Nada 😢' }
      ];
      const premio = premios[Math.floor(Math.random() * premios.length)];
      db.prepare('UPDATE inventory SET amount = amount - 1 WHERE user_id = ? AND item_name = ?').run(user.id, itemName);

      if (premio.nombre === 'Dinero') {
        db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(premio.coins, user.id);
        return interaction.reply(`Abriste una **${itemName}** y ganaste 💰 **${premio.coins} coins**!`);
      } else if (premio.nombre === 'Nada 😢') {
        return interaction.reply(`Abriste una **${itemName}**... y **no ganaste nada** 😞`);
      } else {
        db.prepare('INSERT INTO inventory (user_id, item_name, rarity, amount) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, item_name) DO UPDATE SET amount = amount + 1').run(user.id, premio.nombre, premio.rarity, 1);
        return interaction.reply(`¡Abriste una **${itemName}** y ganaste 🎁 **${premio.nombre}**!`);
      }
    }
  },

  // ✅ /gamble (slots)
  {
    data: new SlashCommandBuilder()
      .setName('gamble')
      .setDescription('Apuesta dinero y prueba tu suerte')
      .addIntegerOption(opt => opt.setName('cantidad').setDescription('Cantidad a apostar').setRequired(true)),
    async execute(interaction) {
      const userId = interaction.user.id;
      const cantidad = interaction.options.getInteger('cantidad');
      const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
      if (user.balance < cantidad) return interaction.reply({ content: 'No tienes suficiente dinero.', ephemeral: true });

      const emojis = ['🍒', '🍋', '🍉', '💎'];
      const resultado = [0, 0, 0].map(() => emojis[Math.floor(Math.random() * emojis.length)]);
      const ganaste = resultado.every(e => e === resultado[0]);

      if (ganaste) {
        const premio = cantidad * 3;
        db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(premio, userId);
        return interaction.reply(`🎰 ${resultado.join(' | ')}
Ganaste **${premio} coins**! 🤑`);
      } else {
        db.prepare('UPDATE users SET balance = balance - ? WHERE user_id = ?').run(cantidad, userId);
        return interaction.reply(`🎰 ${resultado.join(' | ')}
Perdiste **${cantidad} coins** 😭`);
      }
    }
  },

  // ✅ /leaderboard
  {
    data: new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('Muestra el top 10 de usuarios más ricos'),
    async execute(interaction) {
      const top = db.prepare('SELECT * FROM users ORDER BY balance DESC LIMIT 10').all();
      const embed = new EmbedBuilder().setTitle('💸 Top 10 millonarios').setColor('Gold');
      top.forEach((u, i) => embed.addFields({ name: `#${i + 1}`, value: `<@${u.user_id}> - **${u.balance} coins**`, inline: false }));
      interaction.reply({ embeds: [embed] });
    }
  },

  // ✅ /give
  {
    data: new SlashCommandBuilder()
      .setName('give')
      .setDescription('Envía un ítem a otro usuario')
      .addUserOption(opt => opt.setName('usuario').setDescription('Usuario al que le enviarás el ítem').setRequired(true))
      .addStringOption(opt => opt.setName('item').setDescription('Ítem a enviar').setRequired(true))
      .addIntegerOption(opt => opt.setName('cantidad').setDescription('Cantidad').setRequired(true)),
    async execute(interaction) {
      const fromId = interaction.user.id;
      const to = interaction.options.getUser('usuario');
      const toId = to.id;
      const item = interaction.options.getString('item');
      const cantidad = interaction.options.getInteger('cantidad');

      if (fromId === toId) return interaction.reply({ content: '¿Enviar a ti mismo? No mijo 🧠', ephemeral: true });
      const tienes = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND item_name = ?').get(fromId, item);
      if (!tienes || tienes.amount < cantidad) return interaction.reply({ content: 'No tienes suficientes de ese ítem.', ephemeral: true });

      db.prepare('UPDATE inventory SET amount = amount - ? WHERE user_id = ? AND item_name = ?').run(cantidad, fromId, item);
      const existe = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND item_name = ?').get(toId, item);
      if (existe) {
        db.prepare('UPDATE inventory SET amount = amount + ? WHERE user_id = ? AND item_name = ?').run(cantidad, toId, item);
      } else {
        db.prepare('INSERT INTO inventory (user_id, item_name, rarity, amount) VALUES (?, ?, ?, ?)').run(toId, item, tienes.rarity, cantidad);
      }

      interaction.reply(`✅ Le diste **${cantidad} ${item}** a ${to}`);
    }
  },

  // ✅ /inventory reset
  {
    data: new SlashCommandBuilder()
      .setName('inventory-reset')
      .setDescription('Resetea inventario (ADMIN)')
      .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a reiniciar').setRequired(false)),
    async execute(interaction) {
      if (!interaction.member.permissions.has('Administrator')) return interaction.reply({ content: 'Solo admins pueden usar esto.', ephemeral: true });
      const target = interaction.options.getUser('usuario');
      if (target) {
        db.prepare('DELETE FROM inventory WHERE user_id = ?').run(target.id);
        return interaction.reply(`✅ Inventario de <@${target.id}> reiniciado.`);
      } else {
        db.prepare('DELETE FROM inventory').run();
        return interaction.reply('✅ Todos los inventarios fueron reiniciados.');
      }
    }
  }
];
