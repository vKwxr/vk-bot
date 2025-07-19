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
    const usuario = interaction.options.getUser('usuario') || interaction.user;

    const respuestasAleatorias = [
      `¡Hola ${usuario}! 🌟 Espero que tengas un día extraordinario lleno de aventuras y descubrimientos.`,
      `¡Saludos, ${usuario}! 🎉 Que la creatividad y la inspiración te acompañen en todo lo que hagas hoy.`,
      `¡Hey ${usuario}! 🌈 Recuerda que cada nuevo día es una oportunidad para crear algo increíble.`,
      `¡Hola, increíble ${usuario}! 🚀 Tu presencia ilumina este servidor como una estrella en la noche.`,
      `¡Qué alegría verte, ${usuario}! 🎨 Espero que encuentres momentos de paz y felicidad en este día.`,
      `¡Saludos cósmicos, ${usuario}! 🌌 Que la sabiduría del universo guíe tus pasos hacia el éxito.`,
      `¡Hola, explorador digital ${usuario}! 🔍 Cada interacción es un paso hacia nuevas posibilidades.`,
      `¡Bienvenido a este momento, ${usuario}! ⭐ Tu energía positiva hace que el mundo sea mejor.`,
      `¡Hola, visionario ${usuario}! 🔮 Que tus ideas se conviertan en realidades asombrosas.`,
      `¡Saludos, ${usuario}! 🌸 Como una flor que florece, que tu día se llene de belleza y crecimiento.`
    ];

    const mensajeAleatorio = respuestasAleatorias[Math.floor(Math.random() * respuestasAleatorias.length)];

    const embed = new EmbedBuilder()
      .setTitle('👋 ¡Saludo Inteligente!')
      .setDescription(mensajeAleatorio)
      .setColor('#9966ff')
      .setThumbnail(usuario.displayAvatarURL())
      .setFooter({ text: 'Mensaje generado por IA VK Community' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'hola',
  async run(message, args, client) {
    const usuario = message.mentions.users.first() || message.author;

    const respuestasAleatorias = [
      `¡Hola ${usuario}! 🌟 Espero que tengas un día extraordinario lleno de aventuras y descubrimientos.`,
      `¡Saludos, ${usuario}! 🎉 Que la creatividad y la inspiración te acompañen en todo lo que hagas hoy.`,
      `¡Hey ${usuario}! 🌈 Recuerda que cada nuevo día es una oportunidad para crear algo increíble.`,
      `¡Hola, increíble ${usuario}! 🚀 Tu presencia ilumina este servidor como una estrella en la noche.`,
      `¡Qué alegría verte, ${usuario}! 🎨 Espero que encuentres momentos de paz y felicidad en este día.`,
      `¡Saludos cósmicos, ${usuario}! 🌌 Que la sabiduría del universo guíe tus pasos hacia el éxito.`,
      `¡Hola, explorador digital ${usuario}! 🔍 Cada interacción es un paso hacia nuevas posibilidades.`,
      `¡Bienvenido a este momento, ${usuario}! ⭐ Tu energía positiva hace que el mundo sea mejor.`,
      `¡Hola, visionario ${usuario}! 🔮 Que tus ideas se conviertan en realidades asombrosas.`,
      `¡Saludos, ${usuario}! 🌸 Como una flor que florece, que tu día se llene de belleza y crecimiento.`
    ];

    const mensajeAleatorio = respuestasAleatorias[Math.floor(Math.random() * respuestasAleatorias.length)];

    const embed = new EmbedBuilder()
      .setTitle('👋 ¡Saludo Inteligente!')
      .setDescription(mensajeAleatorio)
      .setColor('#9966ff')
      .setThumbnail(usuario.displayAvatarURL())
      .setFooter({ text: 'Mensaje generado por IA VK Community' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};