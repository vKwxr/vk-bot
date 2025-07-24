const { SlashCommandBuilder } = require('discord.js');
const cooldowns = new Map();
const ms = require('ms');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./economy.sqlite');

const COOLDOWN_TIME = ms('3d'); // 3 días

function hasCooldown(userId, commandName) {
  const key = `${userId}_${commandName}`;
  if (!cooldowns.has(key)) return false;
  const expiration = cooldowns.get(key);
  return Date.now() < expiration;
}

function setCooldown(userId, commandName) {
  const key = `${userId}_${commandName}`;
  cooldowns.set(key, Date.now() + COOLDOWN_TIME);
}

function getRandomItemFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// ITEMS POR CATEGORÍA
const rewardItems = {
  event: [
    { name: 'Medalla Dorada', rarity: 'épico', quantity: 1 },
    { name: 'Lucky Box', rarity: 'raro', quantity: 2 },
    { name: 'Token de Evento', rarity: 'común', quantity: 5 },
  ],
  achievements: [
    { name: 'Trofeo de Logros', rarity: 'épico', quantity: 1 },
    { name: 'Lucky Box', rarity: 'raro', quantity: 1 },
  ],
  missions: [
    { name: 'Caja de Misión', rarity: 'común', quantity: 1 },
    { name: 'Lucky Box', rarity: 'raro', quantity: 1 },
  ],
};

function addItemToInventory(userId, item) {
  db.run(`
    INSERT INTO inventory (userId, itemName, rarity, quantity)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(userId, itemName) DO UPDATE SET quantity = quantity + ?
  `,
    [userId, item.name, item.rarity, item.quantity, item.quantity],
    err => {
      if (err) console.error('Error al agregar ítem al inventario:', err.message);
    }
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('special')
    .setDescription('Reclama recompensas especiales, logros o misiones')
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo de recompensa')
        .setRequired(true)
        .addChoices(
          { name: 'Evento especial', value: 'event' },
          { name: 'Logros', value: 'achievements' },
          { name: 'Misiones diarias', value: 'missions' },
        )
    ),
  async execute(interaction) {
    const tipo = interaction.options.getString('tipo');
    const userId = interaction.user.id;

    if (hasCooldown(userId, tipo)) {
      const remaining = cooldowns.get(`${userId}_${tipo}`) - Date.now();
      return interaction.reply({
        content: `⏳ Ya reclamaste esto. Intenta nuevamente en **${ms(remaining, { long: true })}**.`,
        ephemeral: true,
      });
    }

    const reward = getRandomItemFrom(rewardItems[tipo]);
    addItemToInventory(userId, reward);
    setCooldown(userId, tipo);

    await interaction.reply({
      content: `🎁 ¡Has reclamado **${reward.quantity}x ${reward.name}** (${reward.rarity}) por **${tipo}**!`,
      ephemeral: false
    });
  }
};
