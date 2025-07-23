const { SlashCommandBuilder } = require('discord.js');
const translate = require('@vitalets/google-translate-api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('🌐 Traduce texto a otro idioma')
    .addStringOption(option =>
      option.setName('texto').setDescription('Texto a traducir').setRequired(true))
    .addStringOption(option =>
      option.setName('idioma').setDescription('Idioma de destino').setRequired(true)
        .addChoices(
          { name: '🇺🇸 Inglés', value: 'en' },
          { name: '🇫🇷 Francés', value: 'fr' },
          { name: '🇩🇪 Alemán', value: 'de' },
          { name: '🇮🇹 Italiano', value: 'it' },
          { name: '🇵🇹 Portugués', value: 'pt' }
        )),

  async execute(interaction) {
    const texto = interaction.options.getString('texto');
    const idioma = interaction.options.getString('idioma');

    try {
      const res = await translate(texto, { to: idioma });
      await interaction.reply(`${res.text}`);
    } catch (err) {
      await interaction.reply(`❌ Error al traducir el texto.`);
      console.error(err);
    }
  },

  name: 'translate',
  async run(message, args) {
    if (args.length < 2) {
      return message.reply('❌ Uso: `vk translate <idioma> <texto>`\nEjemplo: `vk translate en hola mundo`');
    }

    const idioma = args[0].toLowerCase();
    const texto = args.slice(1).join(' ');

    if (!['en', 'fr', 'de', 'it', 'pt'].includes(idioma)) {
      return message.reply('❌ Idiomas válidos:\n- en [Inglés]\n- fr [Francés]\n- de [Alemán]\n- it [Italiano]\n- pt [Portugués]');
    }

    try {
      const res = await translate(texto, { to: idioma });
      await message.reply(`${res.text}`);
    } catch (err) {
      await message.reply(`❌ Error al traducir el texto.`);
      console.error(err);
    }
  }
};
