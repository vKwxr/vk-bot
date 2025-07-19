
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('🏦 Retira dinero del banco')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a retirar')
        .setRequired(true)
        .setMinValue(1)),

  async execute(interaction, client) {
    const { economyDb } = client.config;
    const userId = interaction.user.id;
    const cantidad = interaction.options.getInteger('cantidad');

    economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (err) {
          return interaction.reply({
            content: '❌ Error al acceder a la base de datos.',
            ephemeral: true
          });
        }

        if (!row || row.bank < cantidad) {
          return interaction.reply({
            content: '❌ No tienes suficiente dinero en el banco.',
            ephemeral: true
          });
        }

        const newWallet = row.wallet + cantidad;
        const newBank = row.bank - cantidad;

        economyDb.run(
          `UPDATE economy SET wallet = ?, bank = ? WHERE user_id = ?`,
          [newWallet, newBank, userId],
          async (err) => {
            if (err) {
              return interaction.reply({
                content: '❌ Error al retirar dinero.',
                ephemeral: true
              });
            }

            const embed = new EmbedBuilder()
              .setTitle('🏦 Retiro Exitoso')
              .setDescription(`Has retirado **${cantidad}** monedas del banco`)
              .addFields(
                { name: '💵 Cartera', value: `${newWallet} monedas`, inline: true },
                { name: '🏦 Banco', value: `${newBank} monedas`, inline: true }
              )
              .setColor('#00ff00')
              .setTimestamp();

            await interaction.reply({ embeds: [embed] });
          }
        );
      }
    );
  },

  name: 'withdraw',
  async run(message, args, client) {
    const { economyDb } = client.config;
    const userId = message.author.id;
    const cantidad = parseInt(args[0]);

    if (!cantidad || cantidad < 1) {
      return message.reply('❌ Especifica una cantidad válida.');
    }

    economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (err) {
          return message.reply('❌ Error al acceder a la base de datos.');
        }

        if (!row || row.bank < cantidad) {
          return message.reply('❌ No tienes suficiente dinero en el banco.');
        }

        const newWallet = row.wallet + cantidad;
        const newBank = row.bank - cantidad;

        economyDb.run(
          `UPDATE economy SET wallet = ?, bank = ? WHERE user_id = ?`,
          [newWallet, newBank, userId],
          async (err) => {
            if (err) {
              return message.reply('❌ Error al retirar dinero.');
            }

            const embed = new EmbedBuilder()
              .setTitle('🏦 Retiro Exitoso')
              .setDescription(`Has retirado **${cantidad}** monedas del banco`)
              .addFields(
                { name: '💵 Cartera', value: `${newWallet} monedas`, inline: true },
                { name: '🏦 Banco', value: `${newBank} monedas`, inline: true }
              )
              .setColor('#00ff00')
              .setTimestamp();

            await message.reply({ embeds: [embed] });
          }
        );
      }
    );
  }
};
