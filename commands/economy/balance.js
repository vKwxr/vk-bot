const path = require('path');

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('💰 Muestra tu balance de vK Coins')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a consultar (opcional)')
        .setRequired(false)),

  async execute(interaction, client) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const { economyDb } = client.config;

    economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [user.id],
      async (err, row) => {
        const wallet = row ? row.wallet : 0;
        const bank = row ? row.bank : 0;
        const total = wallet + bank;

        const embed = new EmbedBuilder()
          .setTitle(`💰 Balance de ${user.username}`)
          .addFields(
            { name: '💵 Cartera', value: `${wallet.toLocaleString()} vK Coins`, inline: true },
            { name: '🏦 Banco', value: `${bank.toLocaleString()} vK Coins`, inline: true },
            { name: '💎 Total', value: `${total.toLocaleString()} vK Coins`, inline: true }
          )
          .setColor('#00ff00')
          .setThumbnail(user.displayAvatarURL())
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    );
  },

  name: 'balance',
  async run(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    const { economyDb } = client.config;

    economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [user.id],
      async (err, row) => {
        const wallet = row ? row.wallet : 0;
        const bank = row ? row.bank : 0;
        const total = wallet + bank;

        const embed = new EmbedBuilder()
          .setTitle(`💰 Balance de ${user.username}`)
          .addFields(
            { name: '💵 Cartera', value: `${wallet.toLocaleString()} vK Coins`, inline: true },
            { name: '🏦 Banco', value: `${bank.toLocaleString()} vK Coins`, inline: true },
            { name: '💎 Total', value: `${total.toLocaleString()} vK Coins`, inline: true }
          )
          .setColor('#00ff00')
          .setThumbnail(user.displayAvatarURL())
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
      }
    );
  }
};
