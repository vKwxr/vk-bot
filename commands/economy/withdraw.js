const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('🏦 Retira dinero del banco')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a retirar')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    const { economyDb } = client.config;
    const userId = interaction.user.id;
    const cantidad = interaction.options.getInteger('cantidad');

    economyDb.get(`SELECT * FROM economy WHERE user_id = ?`, [userId], async (err, row) => {
      if (err) {
        console.error(err);
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
        async err => {
          if (err) {
            console.error(err);
            return interaction.reply({
              content: '❌ Error al retirar dinero.',
              ephemeral: true
            });
          }

          const embed = new EmbedBuilder()
            .setTitle('💸 Has retirado dinero del banco')
            .setDescription(`Has retirado **${cantidad.toLocaleString()}** monedas`)
            .addFields(
              { name: '💼 Cartera actual', value: `${newWallet.toLocaleString()} monedas`, inline: true },
              { name: '🏦 Banco restante', value: `${newBank.toLocaleString()} monedas`, inline: true }
            )
            .setColor('#ffd700')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        }
      );
    });
  },

  // 🧾 Versión de mensaje de texto (no slash)
  name: 'withdraw',
  async run(message, args, client) {
    const { economyDb } = client.config;
    const userId = message.author.id;
    const cantidad = parseInt(args[0]);

    if (!cantidad || isNaN(cantidad) || cantidad < 1) {
      return message.reply('❌ Especifica una cantidad válida mayor a 0.');
    }

    economyDb.get(`SELECT * FROM economy WHERE user_id = ?`, [userId], async (err, row) => {
      if (err) {
        console.error(err);
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
        async err => {
          if (err) {
            console.error(err);
            return message.reply('❌ Error al retirar dinero.');
          }

          const embed = new EmbedBuilder()
            .setTitle('💸 Has retirado dinero del banco')
            .setDescription(`Has retirado **${cantidad.toLocaleString()}** monedas`)
            .addFields(
              { name: '💼 Cartera actual', value: `${newWallet.toLocaleString()} monedas`, inline: true },
              { name: '🏦 Banco restante', value: `${newBank.toLocaleString()} monedas`, inline: true }
            )
            .setColor('#ffd700')
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();

          await message.reply({ embeds: [embed] });
        }
      );
    });
  }
};
