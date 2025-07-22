const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

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
      const respuesta = await openai.createChatCompletion({
        model: 'gpt-4', // o 'gpt-3.5-turbo' si prefieres menos costo
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

      const contenido = respuesta.data.choices[0].message.content;

      return message.reply({ content: contenido });
    } catch (error) {
      console.error('Error con OpenAI:', error);
      return message.reply('❌ Hubo un problema al contactar con la IA.');
    }
  }
};
