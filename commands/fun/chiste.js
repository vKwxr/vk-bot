
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const chistes = [
  "¿Qué hace una abeja en el gimnasio? ¡Zum-ba!",
  "¿Cuál es el café más peligroso del mundo? ¡El ex-preso!",
  "¿Qué le dice un taco a otro taco? ¿Quieres que vayamos por unas quesadillas?",
  "¿Por qué los peces no pagan el alquiler? Porque viven en el agua y está gratis.",
  "¿Qué le dice una impresora a otra impresora? ¡Esa hoja es tuya o es impresión mía!",
  "¿Cuál es el animal más antiguo? La cebra, porque está en blanco y negro.",
  "¿Qué hace un perro con un taladro? ¡Taladrando!",
  "¿Por qué los pájaros vuelan hacia el sur en invierno? Porque caminando tardarían mucho.",
  "¿Qué le dice un semáforo a otro? No me mires que me estoy cambiando.",
  "¿Cuál es el último animal en subir al arca de Noé? El del-fin.",
  "¿Qué hace una abeja en un auto? ¡Va zum-bando!",
  "¿Por qué el libro de matemáticas estaba triste? Porque tenía muchos problemas.",
  "¿Qué le dice un jardinero a otro? Seamos felices mientras podamos.",
  "¿Cuál es la fruta más paciente? Es-pera.",
  "¿Qué hace un dinosaurio cuando llueve? Se dino-moja.",
  "¿Por qué los elefantes no usan computadora? Porque tienen miedo del mouse.",
  "¿Qué hace un perro mago? ¡Labrador!",
  "¿Cuál es el colmo de un electricista? Que su mujer se llame Luz y que sus hijos no le hagan caso.",
  "¿Qué le dice una banana a otra banana? ¡Nada, las bananas no hablan!",
  "¿Por qué la estadística es como la ropa interior? Porque lo importante no es lo que se ve, sino lo que oculta."
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chiste')
    .setDescription('😂 Cuenta un chiste aleatorio'),

  async execute(interaction, client) {
    const chisteAleatorio = chistes[Math.floor(Math.random() * chistes.length)];

    const embed = new EmbedBuilder()
      .setTitle('😂 ¡Hora del Chiste!')
      .setDescription(chisteAleatorio)
      .setColor('#ffff00')
      .setFooter({ text: 'VK Community Bot • Chistes', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'chiste',
  async run(message, args, client) {
    const chisteAleatorio = chistes[Math.floor(Math.random() * chistes.length)];

    const embed = new EmbedBuilder()
      .setTitle('😂 ¡Hora del Chiste!')
      .setDescription(chisteAleatorio)
      .setColor('#ffff00')
      .setFooter({ text: 'VK Community Bot • Chistes', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
