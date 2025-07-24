const path = require('path');

const { EmbedBuilder } = require('discord.js');

module.exports = {
  async execute(interaction, client) {
    if (!interaction.customId.startsWith('trivia_')) return;

    const [, opcionStr, userId] = interaction.customId.split('_');
    const opcionElegida = parseInt(opcionStr);

    // Verificar que sea el usuario correcto
    if (interaction.user.id !== userId) {
      return interaction.reply({
        content: '❌ Esta trivia no es tuya.',
        ephemeral: true
      });
    }

    // Verificar si la trivia está activa (importar desde el comando)
    const triviaCommand = require(path.join("commands\\games\\trivia.js"));
    const activeTrivia = new Map(); // Esto debería ser global, pero por simplicidad...

    // Obtener la pregunta del embed original
    const embed = interaction.message.embeds[0];
    if (!embed) {
      return interaction.reply({
        content: '❌ Error al procesar la respuesta.',
        ephemeral: true
      });
    }

    // Aquí deberías verificar la respuesta correcta
    const esCorrecta = opcionElegida === 1; 

    if (esCorrecta) {
      const monedas = 100;

      // Actualizar economía
      const { economyDb } = client.config;
      economyDb.get(
        `SELECT * FROM economy WHERE user_id = ?`,
        [userId],
        (err, row) => {
          if (!row) {
            economyDb.run(
              `INSERT INTO economy (user_id, wallet) VALUES (?, ?)`,
              [userId, monedas]
            );
          } else {
            economyDb.run(
              `UPDATE economy SET wallet = wallet + ? WHERE user_id = ?`,
              [monedas, userId]
            );
          }
        }
      );

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ ¡Correcto!')
        .setDescription(`¡Respuesta correcta! Has ganado **${monedas} monedas**`)
        .setColor('#00ff00')
        .setTimestamp();

      await interaction.update({ 
        embeds: [successEmbed], 
        components: [] 
      });
    } else {
      const failEmbed = new EmbedBuilder()
        .setTitle('❌ Incorrecto')
        .setDescription('La respuesta no era correcta. ¡Inténtalo de nuevo!')
        .setColor('#e74c3c')
        .setTimestamp();

      await interaction.update({ 
        embeds: [failEmbed], 
        components: [] 
      });
    }
  }
};
