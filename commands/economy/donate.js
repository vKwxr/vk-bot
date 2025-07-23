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
              [newDonanteWallet, donante.id]
            );

            economyDb.run(
              `UPDATE economy SET wallet = ? WHERE user_id = ?`,
              [newReceptorWallet, receptor.id]
            );

            await interaction.reply({
              content: `✅ Has donado **${cantidad} monedas** a ${receptor.tag}.`,
              ephemeral: true
            });

            try {
              const dmEmbed = new EmbedBuilder()
                .setTitle('💝 Has recibido una donación')
                .setDescription(`${donante.tag} te ha donado **${cantidad} monedas**`)
                .setColor('#00ff00')
                .setTimestamp();

              await receptor.send({ embeds: [dmEmbed] });
            } catch (error) {
              console.log(`❌ No se pudo enviar DM a ${receptor.tag}`);
            }
          }
        );
      }
    );
  }
};
