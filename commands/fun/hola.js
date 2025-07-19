
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const saludos = [
  "¡Hola **{user}**! Bienvenido a VK Community 👑",
  "¡Qué tal **{user}**! ¿Cómo estás hoy? 😊",
  "¡Hey **{user}**! ¡Qué bueno verte por aquí! 🎉",
  "¡Saludos **{user}**! ¡Espero que tengas un gran día! ☀️",
  "¡Hola **{user}**! ¡Listo para divertirte en VK? 🚀",
  "¡Buenos días/tardes **{user}**! ¡Que disfrutes tu estancia! 🌟",
  "¡Hola **{user}**! ¡La comunidad se alegra de verte! 💜",
  "¡Hey **{user}**! ¡Otro día increíble en VK Community! ⭐",
  "¡Hola **{user}**! ¡Siempre es un placer saludarte! 🎭",
  "¡Qué pasa **{user}**! ¡Listo para la diversión! 🎪"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hola')
    .setDescription('👋 Recibe un saludo personalizado del bot'),

  async execute(interaction, client) {
    const randomSaludo = saludos[Math.floor(Math.random() * saludos.length)];
    const saludo = randomSaludo.replace('{user}', interaction.user.username);

    const embed = new EmbedBuilder()
      .setDescription(saludo)
      .setColor('#9966ff')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'hola',
  async run(message, args, client) {
    const randomSaludo = saludos[Math.floor(Math.random() * saludos.length)];
    const saludo = randomSaludo.replace('{user}', message.author.username);
    
    await message.channel.send(saludo);
  }
};
