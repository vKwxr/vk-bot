const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('⏱️ Muestra cuánto tiempo ha estado encendido el bot'),

  async execute(interaction, client) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor(((uptime % 86400) % 3600) / 60);
    const seconds = Math.floor(((uptime % 86400) % 3600) % 60);

    const content = `\`\`\`ml
╭─────[ UPTIME DEL BOT ]─────╮
│ 🟢 Días    : ${days.toString().padStart(2, '0')}              │
│ 🕒 Horas   : ${hours.toString().padStart(2, '0')}              │
│ ⏳ Minutos : ${minutes.toString().padStart(2, '0')}              │
│ ⌛ Segundos: ${seconds.toString().padStart(2, '0')}              │
╰────────────────────────────╯
\`\`\``;

    await interaction.reply({ content });
  },

  name: 'uptime',
  async run(message, args, client) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor(((uptime % 86400) % 3600) / 60);
    const seconds = Math.floor(((uptime % 86400) % 3600) % 60);

    const content = `\`\`\`ml
╭─────[ UPTIME DEL BOT ]─────╮
│ 🟢 Días    : ${days.toString().padStart(2, '0')}              │
│ 🕒 Horas   : ${hours.toString().padStart(2, '0')}              │
│ ⏳ Minutos : ${minutes.toString().padStart(2, '0')}              │
│ ⌛ Segundos: ${seconds.toString().padStart(2, '0')}              │
╰────────────────────────────╯
\`\`\``;

    await message.reply({ content });
  }
};
