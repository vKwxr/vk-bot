
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jumbo')
    .setDescription('🔍 Agranda un emoji')
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Emoji a agrandar')
        .setRequired(true)),

  async execute(interaction, client) {
    const emoji = interaction.options.getString('emoji');
    
    // Extraer ID del emoji personalizado
    const customEmojiMatch = emoji.match(/<a?:\w+:(\d+)>/);
    if (customEmojiMatch) {
      const emojiId = customEmojiMatch[1];
      const isAnimated = emoji.startsWith('<a:');
      const extension = isAnimated ? 'gif' : 'png';
      const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}?size=128`;
      
      await interaction.reply(emojiUrl);
    } else {
      // Para emojis Unicode
      const codePoints = [...emoji].map(char => 
        char.codePointAt(0).toString(16).padStart(4, '0')
      ).join('-');
      
      const emojiUrl = `https://twemoji.maxcdn.com/v/latest/72x72/${codePoints}.png`;
      
      await interaction.reply(emojiUrl);
    }
  },

  name: 'jumbo',
  async run(message, args, client) {
    const emoji = args[0];
    if (!emoji) return message.reply('❌ Debes proporcionar un emoji.');

    const customEmojiMatch = emoji.match(/<a?:\w+:(\d+)>/);
    if (customEmojiMatch) {
      const emojiId = customEmojiMatch[1];
      const isAnimated = emoji.startsWith('<a:');
      const extension = isAnimated ? 'gif' : 'png';
      const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}?size=128`;
      
      await message.channel.send(emojiUrl);
    } else {
      const codePoints = [...emoji].map(char => 
        char.codePointAt(0).toString(16).padStart(4, '0')
      ).join('-');
      
      const emojiUrl = `https://twemoji.maxcdn.com/v/latest/72x72/${codePoints}.png`;
      
      await message.channel.send(emojiUrl);
    }
  }
};
