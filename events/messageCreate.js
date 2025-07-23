const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const levelChannelCmd = require('../../commands/levels/levelchannel.js');
const automod = require('./automod'); // IMPORTAR automod

function parseTime(timeString) {
  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) return null;

  const [, value, unit] = match;
  const num = parseInt(value);

  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

async function autoTimeoutOnReply(message, prefix) {
  if (!message.guild) return;
  if (message.author.bot) return;

  if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;

  if (!message.reference) return;

  if (!message.content.startsWith(prefix)) return;

  const repliedMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
  if (!repliedMessage) return;

  if (repliedMessage.author.bot) return;
  if (repliedMessage.member?.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
  if (repliedMessage.author.id === message.guild.ownerId) return;

  const muteDuration = 10 * 60 * 1000; // 10 min
  const reason = `Mute automático por responder a comando staff ${message.author.tag}`;

  try {
    await repliedMessage.member.timeout(muteDuration, reason);
    await message.channel.send(`🔇 **${repliedMessage.author.tag}** ha sido silenciado automáticamente por responder a un comando de staff.\n⏰ Duración: 10 minutos\n📝 Razón: ${reason}`);
  } catch {
    // Silencio fail, no hacemos nada
  }
}

async function handleUserXP(client, guild, user, xpToAdd, message) {
  const { levelsDb } = client.config;
  if (!levelsDb) return;

  const row = await new Promise((resolve, reject) => {
    levelsDb.get('SELECT xp, level FROM levels WHERE user_id = ?', [user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  let currentXP = row?.xp || 0;
  let currentLevel = row?.level || 1;

  const newXP = currentXP + xpToAdd;
  const newLevel = Math.floor(newXP / 1000) + 1;

  await new Promise((resolve, reject) => {
    levelsDb.run(
      `INSERT OR REPLACE INTO levels (user_id, xp, level) VALUES (?, ?, ?)`,
      [user.id, newXP, newLevel],
      (err) => (err ? reject(err) : resolve())
    );
  });

  if (newLevel > currentLevel) {
    await levelChannelCmd.sendLevelUpNotification(client, guild, user, newLevel, message.channel);
  }
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    const prefix = "vk";

    if (message.author.bot) return;

    await automod(message, client);  // EJECUTAR automod primero

    await autoTimeoutOnReply(message, prefix);

    const userId = message.author.id;

    client.config.db.get(
      `SELECT * FROM afk_users WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (row) {
          const tiempoAFK = new Date() - new Date(row.timestamp);
          const tiempoFormateado = Math.floor(tiempoAFK / 1000 / 60);

          client.config.db.run(
            `DELETE FROM afk_users WHERE user_id = ?`,
            [userId]
          );

          const embed = new EmbedBuilder()
            .setTitle('👋 Bienvenido de vuelta!')
            .setDescription(`${message.author} ya no está AFK`)
            .addFields(
              { name: '⏱️ Tiempo AFK', value: `${tiempoFormateado} minutos`, inline: true },
              { name: '💭 Razón anterior', value: row.reason, inline: true }
            )
            .setColor('#00ff00')
            .setTimestamp();

          const afkMessage = await message.channel.send({ embeds: [embed] });
          setTimeout(() => afkMessage.delete().catch(() => {}), 5000);
        }
      }
    );

    if (message.mentions.users.size > 0) {
      message.mentions.users.forEach(user => {
        if (user.bot) return;

        client.config.db.get(
          `SELECT * FROM afk_users WHERE user_id = ?`,
          [user.id],
          async (err, row) => {
            if (row) {
              const tiempoAFK = new Date() - new Date(row.timestamp);
              const tiempoFormateado = Math.floor(tiempoAFK / 1000 / 60);

              const embed = new EmbedBuilder()
                .setTitle('😴 Usuario AFK')
                .setDescription(`${user} está actualmente AFK`)
                .addFields(
                  { name: '💭 Razón', value: row.reason, inline: true },
                  { name: '⏱️ Desde hace', value: `${tiempoFormateado} minutos`, inline: true }
                )
                .setColor('#ffaa00')
                .setTimestamp();

              const afkNotice = await message.channel.send({ embeds: [embed] });
              setTimeout(() => afkNotice.delete().catch(() => {}), 10000);
            }
          }
        );
      });
    }

    if (message.guild) {
      const xpGained = Math.floor(Math.random() * 10) + 15;
      await handleUserXP(client, message.guild, message.author, xpGained, message);
    }

    const contenido = message.content.toLowerCase();
    const patrones = ['hola', 'holaa', 'holaaa', 'holis', 'holi', 'ola', 'olaa', 'wola', 'aloha'];

    const saludos = [
      "¡Hola {user}! 👋 Bienvenido.",
      "¡Qué tal {user}! 😄 ¿Todo bien?",
      "¡Hey {user}! 🎉 ¡Buena vibra por aquí!",
      "¡Saludos {user}! ✨ ¡Disfruta tu día!",
      "¡Hola {user}! 🚀 ¿Listo para la aventura?",
      "¡Buenos días/tardes/noches {user}! 🌟 ¡A romperla!",
      "¡Ey {user}! 👑 Siempre un gusto verte por aquí.",
      "¡Hola {user}! 🔥 ¡Vamos a darle!",
      "¡Qué pasa {user}! 🎮 ¿Jugamos o qué?",
      "¡Saludos, crack {user}! 💪 ¡A tope siempre!",
      "¡Hey {user}! 🌈 ¡Saca esa facha!",
      "¡Bienvenido a este momento {user}! ⭐ ¡Pura buena onda!",
      "¡Hola, {user}! ✨ ¡A romper corazones!",
      "¡{user}! 🚀 ¡El server es tuyo!",
      "¡Hey {user}! 😎 ¡Te estábamos esperando!",
      "¡Bien ahí {user}! 💥 ¡Actitud vK!",
      "¡{user}! 🫡 ¡El más facha de vK!",
      "¡Eres leyenda, {user}! 🏆",
      "¡Saludos {user}! 💜 ¡vK siempre te recibe bien!",
      "¡{user}! 👋 ¡Que hoy tengas un día brutal!",
      "¡Arrancamos {user}! 🔥 ¿Preparado?",
      "¡Hola {user}! 🕶️ ¡Con toda la actitud!",
      "¡Saludos épicos para {user}! ⚡",
      "¡Ey {user}! 🤖 El bot te saluda oficialmente.",
      "¡Buenas {user}! 🐺 ¡El lobo está suelto!",
      "¡{user}, tu presencia sube el nivel! 🎯",
      "¡Qué onda {user}! 🎤 ¡Vas con todo!",
      "¡A darle, {user}! 💯 ¡Hoy es tu día!",
      "¡Saludos especiales a {user}! 🫶",
      "¡{user}, nunca cambies! 😄",
      "¡El server se alegra con tu llegada, {user}! 🎊",
      "¡Hey {user}! 🚨 ¡Facha detectada!",
      "¡Te extrañábamos, {user}! 💬",
      "¡{user}, el elegido ha llegado! 🔥",
      "¡Hola, campeón {user}! 🏆",
      "¡{user}! 🚀 ¡Haz que cuente!",
      "¡{user}, eres parte del combo vK! 🤝",
      "¡Bienvenido, {user}! 🔥 ¡Que se arme la buena vibra!",
      "¡El legendario {user} ha aparecido! 🐉",
      "¡Saludos del bot para {user}! 🤖",
      "¡{user}, empieza la buena energía! ✨",
      "¡Holi {user}! 🥰 ¿Todo piola?",
      "¡Buenas {user}! 🍀 Que hoy sea épico.",
      "¡{user}! 🎲 ¿Listo para la acción?",
      "¡Hey tú, {user}! 🎯 Bienvenido crack.",
      "¡Que bueno que regresaste no es lo mismo sin ti, {user}! 👏"
    ];

    if (patrones.some(p => contenido.startsWith(p))) {
      const saludo = saludos[Math.floor(Math.random() * saludos.length)].replace('{user}', `<@${message.author.id}>`);
      await message.channel.send(saludo);
    }
  },
};
