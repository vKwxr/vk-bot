const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('facha')
    .setDescription('😎 Mide qué tan facha es alguien')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario para medir su facha')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const usuario = interaction.options.getUser('usuario') || interaction.user;
    const fachaLevel = Math.floor(Math.random() * 101);

    const emoji = fachaLevel >= 95 ? '💎' :
      fachaLevel >= 80 ? '🔥' :
      fachaLevel >= 60 ? '😎' :
      fachaLevel >= 40 ? '😊' :
      fachaLevel >= 20 ? '😐' : '😬';

    const barra = '█'.repeat(Math.floor(fachaLevel / 10)) + '░'.repeat(10 - Math.floor(fachaLevel / 10));

    const embed = new EmbedBuilder()
      .setDescription(`${emoji} **${usuario.username}** tiene **${fachaLevel}%** de facha\n\`${barra}\``)
      .setColor(fachaLevel >= 80 ? '#44ff44' : fachaLevel >= 40 ? '#ffff00' : '#ff4444')
      .setThumbnail(usuario.displayAvatarURL())
      .setFooter({ text: 'Medidor de Facha 100% Real', iconURL: client.user.displayAvatarURL() });

    await interaction.reply({ content: `${interaction.user}`, embeds: [embed] });
  },

  name: 'facha',
  async run(message, args, client) {
    let usuario = message.mentions.users.first();
    if (!usuario && args[0]) {
      try { usuario = await client.users.fetch(args[0]); } catch { usuario = message.author; }
    }
    if (!usuario) usuario = message.author;

    const fachaLevel = Math.floor(Math.random() * 101);

    const emoji = fachaLevel >= 95 ? '💎' :
      fachaLevel >= 80 ? '🔥' :
      fachaLevel >= 60 ? '😎' :
      fachaLevel >= 40 ? '😊' :
      fachaLevel >= 20 ? '😐' : '😬';

    const barra = '█'.repeat(Math.floor(fachaLevel / 10)) + '░'.repeat(10 - Math.floor(fachaLevel / 10));

    const embed = new EmbedBuilder()
      .setDescription(`${emoji} **${usuario.username}** tiene **${fachaLevel}%** de facha\n\`${barra}\``)
      .setColor(fachaLevel >= 80 ? '#44ff44' : fachaLevel >= 40 ? '#ffff00' : '#ff4444')
      .setThumbnail(usuario.displayAvatarURL())
      .setFooter({ text: 'Medidor de Facha 100% Real', iconURL: client.user.displayAvatarURL() });

    await message.reply({ content: `${message.author}`, embeds: [embed] });
  }
};
