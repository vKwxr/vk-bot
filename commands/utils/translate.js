
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Simulador de traducción simple (en un proyecto real usarías Google Translate API)
const translations = {
  'en': {
    'hola': 'hello',
    'mundo': 'world',
    'gracias': 'thank you',
    'adiós': 'goodbye',
    'sí': 'yes',
    'no': 'no',
    'por favor': 'please',
    'agua': 'water',
    'comida': 'food',
    'casa': 'house'
  },
  'fr': {
    'hola': 'salut',
    'mundo': 'monde',
    'gracias': 'merci',
    'adiós': 'au revoir',
    'sí': 'oui',
    'no': 'non',
    'por favor': 's\'il vous plaît',
    'agua': 'eau',
    'comida': 'nourriture',
    'casa': 'maison'
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('🌐 Traduce texto a otro idioma')
    .addStringOption(option =>
      option.setName('texto')
        .setDescription('Texto a traducir')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('idioma')
        .setDescription('Idioma de destino')
        .setRequired(true)
        .addChoices(
          { name: '🇺🇸 Inglés', value: 'en' },
          { name: '🇫🇷 Francés', value: 'fr' },
          { name: '🇩🇪 Alemán', value: 'de' },
          { name: '🇮🇹 Italiano', value: 'it' },
          { name: '🇵🇹 Portugués', value: 'pt' }
        )),

  async execute(interaction, client) {
    const texto = interaction.options.getString('texto').toLowerCase();
    const idioma = interaction.options.getString('idioma');

    // Simulación simple de traducción
    const traduccionMap = translations[idioma] || {};
    
    let textoTraducido = texto;
    Object.keys(traduccionMap).forEach(palabra => {
      const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
      textoTraducido = textoTraducido.replace(regex, traduccionMap[palabra]);
    });

    // Si no hay cambios, mostrar mensaje
    if (textoTraducido === texto) {
      textoTraducido = `[Traducción no disponible - API limitada]`;
    }

    const idiomas = {
      'en': '🇺🇸 Inglés',
      'fr': '🇫🇷 Francés',
      'de': '🇩🇪 Alemán',
      'it': '🇮🇹 Italiano',
      'pt': '🇵🇹 Portugués'
    };

    const embed = new EmbedBuilder()
      .setTitle('🌐 Traductor VK')
      .addFields(
        { name: '📝 Texto Original', value: `\`\`\`${interaction.options.getString('texto')}\`\`\``, inline: false },
        { name: `🔄 Traducido a ${idiomas[idioma]}`, value: `\`\`\`${textoTraducido}\`\`\``, inline: false }
      )
      .setColor('#9966ff')
      .setFooter({ text: 'Traducción simulada - Para mejores resultados usa Google Translate' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'translate',
  async run(message, args, client) {
    if (args.length < 2) {
      return message.reply('❌ Uso: `vktranslate <idioma> <texto>`\nEjemplo: `vktranslate en hola mundo`');
    }

    const idioma = args[0].toLowerCase();
    const texto = args.slice(1).join(' ').toLowerCase();

    const idiomasValidos = ['en', 'fr', 'de', 'it', 'pt'];
    if (!idiomasValidos.includes(idioma)) {
      return message.reply('❌ Idiomas disponibles: en, fr, de, it, pt');
    }

    const traduccionMap = translations[idioma] || {};
    
    let textoTraducido = texto;
    Object.keys(traduccionMap).forEach(palabra => {
      const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
      textoTraducido = textoTraducido.replace(regex, traduccionMap[palabra]);
    });

    if (textoTraducido === texto) {
      textoTraducido = `[Traducción no disponible]`;
    }

    const embed = new EmbedBuilder()
      .setTitle('🌐 Traductor VK')
      .addFields(
        { name: '📝 Original', value: `\`\`\`${args.slice(1).join(' ')}\`\`\``, inline: false },
        { name: '🔄 Traducido', value: `\`\`\`${textoTraducido}\`\`\``, inline: false }
      )
      .setColor('#9966ff')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
