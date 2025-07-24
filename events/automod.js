const path = require('path');
const LINK_REGEX = /(https?:\/\/[^\s]+)/gi;

const BLACKLISTED_KEYWORDS = [
  'porn', 'xxx', 'sex', 'adult', 'discord', 'nitro', 'free', 'giveaway', 'hack', 'malware',
  'bit.ly', 'tinyurl', 'goo.gl', 'discord.gift', 'discordapp.com/invite', 'discord.gg'
];

const SPAM_LIMIT = 3; // mensajes máximos permitidos en intervalo
const SPAM_INTERVAL = 10000; // intervalo en ms (10 segundos)
const SPAM_WARNING = '⚠️ Por favor, deja de spammear links. Respeta el chat.';

const userMessageTimestamps = new Map();

module.exports = async function automod(message, client) {
  if (message.author.bot) return;

  const links = message.content.match(LINK_REGEX);
  if (!links) return;

  const member = message.member;

  // Traer roles permitidos desde DB
  const guildId = message.guild.id;
  const db = client.config.db;

  const allowedRolesRows = await new Promise((resolve, reject) => {
    db.all(`SELECT role_id FROM automod_roles WHERE guild_id = ?`, [guildId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }).catch(() => []);

  const allowedRoleIds = allowedRolesRows.map(r => r.role_id);

  const canSendLinks = allowedRoleIds.some(roleId => member.roles.cache.has(roleId));

  if (!canSendLinks) {
    const contentLower = message.content.toLowerCase();
    if (BLACKLISTED_KEYWORDS.some(keyword => contentLower.includes(keyword))) {
      await message.delete().catch(() => {});
      await message.channel.send(`${message.author}, 🚫 No puedes enviar ese tipo de links aquí.`).then(msg => {
        setTimeout(() => msg.delete().catch(() => {}), 7000);
      });
      return;
    }
  }

  if (canSendLinks) {
    const now = Date.now();
    const timestamps = userMessageTimestamps.get(member.id) || [];
    const filtered = timestamps.filter(ts => now - ts < SPAM_INTERVAL);
    filtered.push(now);
    userMessageTimestamps.set(member.id, filtered);

    if (filtered.length > SPAM_LIMIT) {
      await message.channel.send(`${message.author}, ${SPAM_WARNING}`).then(msg => {
        setTimeout(() => msg.delete().catch(() => {}), 8000);
      });
      await message.delete().catch(() => {});
    }
  }
};
