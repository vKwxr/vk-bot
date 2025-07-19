
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('donate')
    .setDescription('💝 Dona dinero a otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que donar')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a donar')
        .setRequired(true)
        .setMinValue(1)),

  async execute(interaction, client) {
    const { economyDb } = client.config;
    const donante = interaction.user;
    const receptor = interaction.options.getUser('usuario');
    const cantidad = interaction.options.getInteger('cantidad');

    if (donante.id === receptor.id) {
      return interaction.reply({
        content: '❌ No puedes donarte dinero a ti mismo.',
        ephemeral: true
      });
    }

    if (receptor.bot) {
      return interaction.reply({
        content: '❌ No puedes donar dinero a un bot.',
        ephemeral: true
      });
    }

    // Verificar dinero del donante
    economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [donante.id],
      async (err, donanteEconomy) => {
        if (err || !donanteEconomy || donanteEconomy.wallet < cantidad) {
          return interaction.reply({
            content: '❌ No tienes suficiente dinero para donar.',
            ephemeral: true
          });
        }

        // Verificar/crear economía del receptor
        economyDb.get(
          `SELECT * FROM economy WHERE user_id = ?`,
          [receptor.id],
          async (err, receptorEconomy) => {
            if (!receptorEconomy) {
              economyDb.run(
                `INSERT INTO economy (user_id) VALUES (?)`,
                [receptor.id]
              );
              receptorEconomy = { user_id: receptor.id, wallet: 0, bank: 0 };
            }

            // Realizar transferencia
            const newDonanteWallet = donanteEconomy.wallet - cantidad;
            const newReceptorWallet = receptorEconomy.wallet + cantidad;

            economyDb.run(
              `UPDATE economy SET wallet = ? WHERE user_id = ?`,
              [newDonanteWallet, donante.id]
            );

            economyDb.run(
              `UPDATE economy SET wallet = ? WHERE user_id = ?`,
              [newReceptorWallet, receptor.id]
            );

            const embed = new EmbedBuilder()
              .setTitle('💝 Donación Realizada')
              .setDescription(`${donante} ha donado **${cantidad} monedas** a ${receptor}`)
              .addFields(
                { name: '👤 Donante', value: `${donante.tag}\n💵 ${newDonanteWallet} monedas`, inline: true },
                { name: '🎁 Receptor', value: `${receptor.tag}\n💵 ${newReceptorWallet} monedas`, inline: true }
              )
              .setColor('#ffaa00')
              .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Notificar al receptor por DM
            try {
              const dmEmbed = new EmbedBuilder()
                .setTitle('💝 Has recibido una donación')
                .setDescription(`${donante.tag} te ha donado **${cantidad} monedas**`)
                .setColor('#00ff00');

              await receptor.send({ embeds: [dmEmbed] });
            } catch (error) {
              console.log('No se pudo enviar DM al receptor');
            }
          }
        );
      }
    );
  },

  name: 'donate',
  async run(message, args, client) {
    const receptor = message.mentions.users.first();
    const cantidad = parseInt(args[1]);

    if (!receptor) {
      return message.reply('❌ Menciona a un usuario válido.');
    }

    if (!cantidad || cantidad < 1) {
      return message.reply('❌ Especifica una cantidad válida.');
    }

    if (message.author.id === receptor.id) {
      return message.reply('❌ No puedes donarte dinero a ti mismo.');
    }

    if (receptor.bot) {
      return message.reply('❌ No puedes donar dinero a un bot.');
    }

    const { economyDb } = client.config;

    economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [message.author.id],
      async (err, donanteEconomy) => {
        if (err || !donanteEconomy || donanteEconomy.wallet < cantidad) {
          return message.reply('❌ No tienes suficiente dinero para donar.');
        }

        economyDb.get(
          `SELECT * FROM economy WHERE user_id = ?`,
          [receptor.id],
          async (err, receptorEconomy) => {
            if (!receptorEconomy) {
              economyDb.run(
                `INSERT INTO economy (user_id) VALUES (?)`,
                [receptor.id]
              );
              receptorEconomy = { user_id: receptor.id, wallet: 0, bank: 0 };
            }

            const newDonanteWallet = donanteEconomy.wallet - cantidad;
            const newReceptorWallet = receptorEconomy.wallet + cantidad;

            economyDb.run(
              `UPDATE economy SET wallet = ? WHERE user_id = ?`,
              [newDonanteWallet, message.author.id]
            );

            economyDb.run(
              `UPDATE economy SET wallet = ? WHERE user_id = ?`,
              [newReceptorWallet, receptor.id]
            );

            const embed = new EmbedBuilder()
              .setTitle('💝 Donación Realizada')
              .setDescription(`${message.author} ha donado **${cantidad} monedas** a ${receptor}`)
              .setColor('#ffaa00')
              .setTimestamp();

            await message.reply({ embeds: [embed] });
          }
        );
      }
    );
  }
};
