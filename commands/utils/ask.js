const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Hazle una pregunta a VK AI')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('Tu pregunta para la IA')
        .setRequired(true)
    ),

  name: 'ask',
  description: 'Hazle una pregunta a VK AI',
  aliases: ['pregunta', 'ia'],
  cooldown: 5,

  async run(client, message, args) {
    const pregunta = args.join(' ');
    if (!pregunta) return message.reply('❌ Debes hacer una pregunta.');

    try {
      const respuesta = await openai.chat.completions.create({
        model: 'gpt-4', // O 'gpt-3.5-turbo' si prefieres menor costo
        messages: [
          {
            role: 'system',
            content: 'Eres una IA amigable llamada VK AI que responde preguntas de forma útil y precisa para usuarios de Discord.',
          },
          { role: 'user', content: pregunta },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const contenido = respuesta.choices[0].message.content;

      return message.reply({ content: contenido });
    } catch (error) {
      console.error('Error con OpenAI:', error);
      return message.reply('❌ Hubo un problema al contactar con la IA.');
    }
  }
};
