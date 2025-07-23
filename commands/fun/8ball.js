const { SlashCommandBuilder } = require('discord.js');

const respuestas = [
  "Es cierto",
  "Es decididamente así",
  "Sin duda",
  "Sí, definitivamente",
  "Puedes confiar en ello",
  "Como yo lo veo, sí",
  "Muy probablemente",
  "Las perspectivas son buenas",
  "Sí",
  "Las señales apuntan a que sí",
  "Respuesta confusa, vuelve a intentar",
  "Pregunta de nuevo más tarde",
  "Mejor no te lo digo ahora",
  "No se puede predecir ahora",
  "Concéntrate y pregunta de nuevo",
  "No cuentes con ello",
  "Mi respuesta es no",
  "Mis fuentes dicen que no",
  "Las perspectivas no son buenas",
  "Muy dudoso",
  "Definitivamente sí",
  "Todo apunta a un sí",
  "No veo por qué no",
  "El destino dice que sí",
  "Podría ser, quién sabe",
  "Quizás en otra vida",
  "No estoy seguro, intenta de nuevo",
  "No lo creo",
  "Definitivamente no",
  "Eso jamás pasará",
  "Cuenta con eso",
  "Eso es un rotundo sí",
  "Los astros dicen que no",
  "No cuentes con mi bendición",
  "Jajaja no",
  "Por supuesto que sí",
  "Solo si crees en ti",
  "No, y ni lo sueñes",
  "Eso está por verse",
  "Casi seguro que sí",
  "Parece que sí",
  "Hoy no, mañana quizás",
  "No tengo suficiente información",
  "Totalmente posible",
  "Las probabilidades son bajas",
  "Ve preparándote para el sí",
  "Ni de broma",
  "No cuentes conmigo para eso",
  "Es tu día de suerte, sí",
  "Yo diría que no"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('🎱 Haz una pregunta al oráculo')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('Tu pregunta para el oráculo')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const pregunta = interaction.options.getString('pregunta');
    const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];
    await interaction.reply(`🔮 **${respuesta}**`);
  },

  name: '8ball',
  async run(message, args, client) {
    const pregunta = args.join(' ');
    if (!pregunta) return message.reply('❌ Debes hacer una pregunta.');
    const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];
    await message.channel.send(`🔮 **${respuesta}**`);
  }
};
