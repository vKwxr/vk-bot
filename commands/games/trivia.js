const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Configura OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Función para generar pregunta desde GPT
async function generarPreguntaIA(categoria) {
  const prompt = `Crea una pregunta de trivia con 4 opciones y dime cuál es la correcta.
Categoría: ${categoria || "General"}

Formato JSON:
{
  "pregunta": "Texto de la pregunta",
  "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
  "correcta": 2, 
  "categoria": "Nombre de la categoría"
}`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Eres un generador de preguntas de trivia en formato JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const respuesta = completion.data.choices[0].message.content;
    const json = JSON.parse(respuesta);
    return json;
  } catch (err) {
    console.error("❌ Error al obtener la pregunta de la IA:", err);
    return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('🎯 Juega una trivia generada por la IA')
    .addStringOption(option =>
      option.setName('categoría')
        .setDescription('Categoría opcional de la pregunta (ej: Ciencia, Historia, etc.)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const categoria = interaction.options.getString('categoría') || 'General';
    const pregunta = await generarPreguntaIA(categoria);

    if (!pregunta) {
      return interaction.editReply('❌ No se pudo generar una pregunta. Intenta de nuevo más tarde.');
    }

    const opciones = pregunta.opciones;
    const correcta = pregunta.correcta;

    const embed = new EmbedBuilder()
      .setTitle(`🧠 Trivia - Categoría: ${pregunta.categoria}`)
      .setDescription(`**${pregunta.pregunta}**\n\n` +
        opciones.map((op, i) => `**${i + 1}.** ${op}`).join('\n'))
      .setColor('#5865F2');

    const botones = new ActionRowBuilder().addComponents(
      ...opciones.map((op, i) =>
        new ButtonBuilder()
          .setCustomId(`opcion_${i}`)
          .setLabel((i + 1).toString())
          .setStyle(ButtonStyle.Primary)
      )
    );

    const msg = await interaction.editReply({ embeds: [embed], components: [botones] });

    const filtro = i => i.user.id === interaction.user.id;
    const collector = msg.createMessageComponentCollector({ filter: filtro, time: 15000, max: 1 });

    collector.on('collect', async i => {
      const seleccion = parseInt(i.customId.split('_')[1]);

      if (seleccion === correcta) {
        await i.update({
          content: `✅ ¡Correcto! La respuesta era **${opciones[correcta]}**.`,
          components: [],
          embeds: [],
        });
      } else {
        await i.update({
          content: `❌ Incorrecto. La respuesta correcta era **${opciones[correcta]}**.`,
          components: [],
          embeds: [],
        });
      }
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: '⏰ ¡Tiempo agotado! No respondiste a tiempo.',
          components: [],
          embeds: [],
        });
      }
    });
  }
};
