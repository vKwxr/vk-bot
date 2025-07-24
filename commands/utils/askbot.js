const { SlashCommandBuilder } = require('discord.js');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Configurar OpenAI con tu API Key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('askbot')
    .setDescription('Haz preguntas sobre cómo funciona el bot')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('Tu duda sobre el bot')
        .setRequired(true)
    ),

  name: 'askbot',
  description: 'Haz preguntas sobre cómo funciona el bot',
  aliases: ['ayudaia', 'guia'],
  cooldown: 5,

  async run(client, message, args) {
    const pregunta = args.join(' ');
    if (!pregunta) {
      return message.reply('❌ Debes hacer una pregunta sobre el bot.');
    }

    // Leer el contenido de botKnowledge.json
    let knowledgeBase = '';
    try {
      const filePath = path.join(__dirname, path.join(__dirname, "../../botKnowledge.json"));
      knowledgeBase = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      console.error('❌ Error al leer botKnowledge.json:', err);
      return message.reply('❌ No se pudo acceder al conocimiento del bot. Contacta con un administrador.');
    }

    try {
      const respuesta = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: knowledgeBase },
          { role: 'user', content: pregunta },
        ],
        temperature: 0.5,
        max_tokens: 700,
      });

      const contenido = respuesta.choices[0].message.content;
      return message.reply({ content: contenido });
    } catch (error) {
      console.error('❌ Error con OpenAI:', error);
      return message.reply('❌ Hubo un problema al contactar con la IA.');
    }
  }
};
