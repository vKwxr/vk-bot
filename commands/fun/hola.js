const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

const saludos = [
  "¡Hola {user}! 👋 Bienvenido a VK Community.",
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
  "¡Bien ahí {user}! 💥 ¡Actitud VK!",
  "¡{user}! 🫡 ¡El más facha de VK!",
  "¡Eres leyenda, {user}! 🏆",
  "¡Saludos {user}! 💜 ¡VK Community siempre te recibe bien!",
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
  "¡{user}, eres parte del combo VK! 🤝",
  "¡Bienvenido, {user}! 🔥 ¡Que se arme la buena vibra!",
  "¡El legendario {user} ha aparecido! 🐉",
  "¡Saludos del bot para {user}! 🤖",
  "¡{user}, empieza la buena energía! ✨",
  "¡Holi {user}! 🥰 ¿Todo piola?",
  "¡Buenas {user}! 🍀 Que hoy sea épico.",
  "¡{user}! 🎲 ¿Listo para la acción?",
  "¡Hey tú, {user}! 🎯 Bienvenido crack.",
  "¡VK no es lo mismo sin ti, {user}! 👏"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hola')
    .setDescription('👋 Recibe un saludo personalizado del bot'),

  async execute(interaction, client) {
    const usuario = interaction.user;
    const saludo = saludos[Math.floor(Math.random() * saludos.length)].replace('{user}', `<@${usuario.id}>`);
    await interaction.reply(saludo);
  },

  name: 'hola',
  async run(message, args, client) {
    const usuario = message.mentions.users.first() || message.author;
    const saludo = saludos[Math.floor(Math.random() * saludos.length)].replace('{user}', `<@${usuario.id}>`);
    await message.reply(saludo);
  },

  // Listener global para mensaje normal (sin prefijo)
  async onMessage(message, client) {
    if (message.author.bot) return;

    const contenido = message.content.toLowerCase();

    const patrones = ['hola', 'holaa', 'holaaa', 'holis', 'holi', 'ola', 'olaa', 'wola', 'aloha'];

    if (patrones.some(p => contenido.startsWith(p))) {
      const saludo = saludos[Math.floor(Math.random() * saludos.length)].replace('{user}', `<@${message.author.id}>`);
      await message.channel.send(saludo);
    }
  }
};
