
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('facha')
    .setDescription('😎 Mide qué tan facha es alguien')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario para medir su facha')
        .setRequired(false)),

  async execute(interaction, client) {
    const usuario = interaction.options.getUser('usuario') || interaction.user;
    const fachaLevel = Math.floor(Math.random() * 101);

    let descripcion;
    let color;
    let emoji;

    if (fachaLevel <= 20) {
      descripcion = "Necesitas trabajar en tu facha... 😅";
      color = '#ff4444';
      emoji = '😬';
    } else if (fachaLevel <= 40) {
      descripcion = "No está mal, pero puedes mejorar 🤔";
      color = '#ff8800';
      emoji = '😐';
    } else if (fachaLevel <= 60) {
      descripcion = "¡Tienes facha promedio! 👍";
      color = '#ffff00';
      emoji = '😊';
    } else if (fachaLevel <= 80) {
      descripcion = "¡Wow, tienes bastante facha! 😎";
      color = '#88ff88';
      emoji = '😎';
    } else if (fachaLevel <= 95) {
      descripcion = "¡Increíble facha! ¡Eres una leyenda! 🔥";
      color = '#44ff44';
      emoji = '🔥';
    } else {
      descripcion = "¡FACHA MÁXIMA! ¡ROMPES CORAZONES! 💎";
      color = '#9966ff';
      emoji = '💎';
    }

    const barraFacha = '█'.repeat(Math.floor(fachaLevel / 10)) + '░'.repeat(10 - Math.floor(fachaLevel / 10));

    const embed = new EmbedBuilder()
      .setTitle('😎 Medidor de Facha')
      .setDescription(`${emoji} **${usuario.username}** tiene **${fachaLevel}%** de facha\n\n${descripcion}`)
      .addFields(
        { name: '📊 Nivel de Facha', value: `\`${barraFacha}\` ${fachaLevel}%`, inline: false }
      )
      .setColor(color)
      .setThumbnail(usuario.displayAvatarURL())
      .setFooter({ text: 'Medidor de facha 100% científico', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'facha',
  async run(message, args, client) {
    let usuario = message.mentions.users.first();
    if (!usuario && args[0]) {
      try {
        usuario = await client.users.fetch(args[0]);
      } catch (error) {
        usuario = message.author;
      }
    }
    if (!usuario) usuario = message.author;

    const fachaLevel = Math.floor(Math.random() * 101);

    let descripcion;
    let color;
    let emoji;

    if (fachaLevel <= 20) {
      descripcion = "Necesitas trabajar en tu facha... 😅";
      color = '#ff4444';
      emoji = '😬';
    } else if (fachaLevel <= 40) {
      descripcion = "No está mal, pero puedes mejorar 🤔";
      color = '#ff8800';
      emoji = '😐';
    } else if (fachaLevel <= 60) {
      descripcion = "¡Tienes facha promedio! 👍";
      color = '#ffff00';
      emoji = '😊';
    } else if (fachaLevel <= 80) {
      descripcion = "¡Wow, tienes bastante facha! 😎";
      color = '#88ff88';
      emoji = '😎';
    } else if (fachaLevel <= 95) {
      descripcion = "¡Increíble facha! ¡Eres una leyenda! 🔥";
      color = '#44ff44';
      emoji = '🔥';
    } else {
      descripcion = "¡FACHA MÁXIMA! ¡ROMPES CORAZONES! 💎";
      color = '#9966ff';
      emoji = '💎';
    }

    const barraFacha = '█'.repeat(Math.floor(fachaLevel / 10)) + '░'.repeat(10 - Math.floor(fachaLevel / 10));

    const embed = new EmbedBuilder()
      .setTitle('😎 Medidor de Facha')
      .setDescription(`${emoji} **${usuario.username}** tiene **${fachaLevel}%** de facha\n\n${descripcion}`)
      .addFields(
        { name: '📊 Nivel de Facha', value: `\`${barraFacha}\` ${fachaLevel}%`, inline: false }
      )
      .setColor(color)
      .setThumbnail(usuario.displayAvatarURL())
      .setFooter({ text: 'Medidor de facha 100% científico', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
