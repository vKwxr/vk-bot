
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('💰 Deposita dinero en el banco')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a depositar (o "all" para todo)')
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

        if (!row || row.wallet < cantidad) {
          return interaction.reply({
            content: '❌ No tienes suficiente dinero en tu cartera.',
            ephemeral: true
          });
        }

        const newWallet = row.wallet - cantidad;
        const newBank = row.bank + cantidad;

        economyDb.run(
          `UPDATE economy SET wallet = ?, bank = ? WHERE user_id = ?`,
          [newWallet, newBank, userId],
          async (err) => {
            if (err) {
              return interaction.reply({
                content: '❌ Error al depositar dinero.',
                ephemeral: true
              });
            }

            const embed = new EmbedBuilder()
              .setTitle('💰 Depósito Exitoso')
              .setDescription(`Has depositado **${cantidad}** monedas en el banco`)
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

  name: 'deposit',
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

        if (!row || row.wallet < cantidad) {
          return message.reply('❌ No tienes suficiente dinero en tu cartera.');
        }

        const newWallet = row.wallet - cantidad;
        const newBank = row.bank + cantidad;

        economyDb.run(
          `UPDATE economy SET wallet = ?, bank = ? WHERE user_id = ?`,
          [newWallet, newBank, userId],
          async (err) => {
            if (err) {
              return message.reply('❌ Error al depositar dinero.');
            }

            const embed = new EmbedBuilder()
              .setTitle('💰 Depósito Exitoso')
              .setDescription(`Has depositado **${cantidad}** monedas en el banco`)
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
