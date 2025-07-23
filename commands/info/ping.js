const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('📡 Muestra la latencia del bot'),

  async execute(interaction, client) {
    const sent = await interaction.reply({ content: '⏳ Calculando ping...', fetchReply: true });
    const timeDiff = sent.createdTimestamp - interaction.createdTimestamp;
    const apiPing = Math.round(client.ws.ping);

    const response = `
\`\`\`ansi
[1;30m╭────────────── Ping del Bot ───────────────╮
[1;30m│ [1;37m📡 Latencia del Bot:     [1;32m${timeDiff}ms[1;30m              │
[1;30m│ [1;37m💓 Latencia de la API:    [1;36m${apiPing}ms[1;30m              │
[1;30m╰───────────────────────────────────────────╯
\`\`\`
    `.trim();

    await interaction.editReply({ content: response });
  },

  name: 'ping',
  async run(message, args, client) {
    const sent = await message.reply('⏳ Calculando ping...');
    const timeDiff = sent.createdTimestamp - message.createdTimestamp;
    const apiPing = Math.round(client.ws.ping);

    const response = `
\`\`\`ansi
[1;30m╭────────────── Ping del Bot ───────────────╮
[1;30m│ [1;37m📡 Latencia del Bot:     [1;32m${timeDiff}ms[1;30m              │
[1;30m│ [1;37m💓 Latencia de la API:    [1;36m${apiPing}ms[1;30m              │
[1;30m╰───────────────────────────────────────────╯
\`\`\`
    `.trim();

    await sent.edit({ content: response });
  }
};
