
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dado')
    .setDescription('🎲 Lanza uno o varios dados')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad de dados (1-10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10))
    .addIntegerOption(option =>
      option.setName('caras')
        .setDescription('Número de caras del dado (4, 6, 8, 10, 12, 20)')
        .setRequired(false)
        .addChoices(
          { name: 'D4 (4 caras)', value: 4 },
          { name: 'D6 (6 caras)', value: 6 },
          { name: 'D8 (8 caras)', value: 8 },
          { name: 'D10 (10 caras)', value: 10 },
          { name: 'D12 (12 caras)', value: 12 },
          { name: 'D20 (20 caras)', value: 20 }
        )),

  async execute(interaction, client) {
    const cantidad = interaction.options.getInteger('cantidad') || 1;
    const caras = interaction.options.getInteger('caras') || 6;

    const resultados = [];
    let total = 0;

    for (let i = 0; i < cantidad; i++) {
      const resultado = Math.floor(Math.random() * caras) + 1;
      resultados.push(resultado);
      total += resultado;
    }

    const dadosEmoji = {
      1: '⚀', 2: '⚁', 3: '⚂',
      4: '⚃', 5: '⚄', 6: '⚅'
    };

    let descripcion;
    if (cantidad === 1) {
      const emoji = caras === 6 && resultados[0] <= 6 ? dadosEmoji[resultados[0]] : '🎲';
      descripcion = `${emoji} **Resultado: ${resultados[0]}**`;
    } else {
      descripcion = `🎲 **Dados:** ${resultados.join(', ')}\n🎯 **Total:** ${total}`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🎲 Lanzamiento de Dado${cantidad > 1 ? 's' : ''}`)
      .setDescription(descripcion)
      .addFields(
        { name: '📊 Detalles', value: `${cantidad} dado${cantidad > 1 ? 's' : ''} de ${caras} cara${caras > 1 ? 's' : ''}`, inline: true }
      )
      .setColor('#ff6b6b')
      .setFooter({ text: `Lanzado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'dado',
  async run(message, args, client) {
    let cantidad = 1;
    let caras = 6;

    if (args[0]) {
      const parsedCantidad = parseInt(args[0]);
      if (parsedCantidad && parsedCantidad >= 1 && parsedCantidad <= 10) {
        cantidad = parsedCantidad;
      }
    }

    if (args[1]) {
      const parsedCaras = parseInt(args[1]);
      if (parsedCaras && [4, 6, 8, 10, 12, 20].includes(parsedCaras)) {
        caras = parsedCaras;
      }
    }

    const resultados = [];
    let total = 0;

    for (let i = 0; i < cantidad; i++) {
      const resultado = Math.floor(Math.random() * caras) + 1;
      resultados.push(resultado);
      total += resultado;
    }

    const dadosEmoji = {
      1: '⚀', 2: '⚁', 3: '⚂',
      4: '⚃', 5: '⚄', 6: '⚅'
    };

    let descripcion;
    if (cantidad === 1) {
      const emoji = caras === 6 && resultados[0] <= 6 ? dadosEmoji[resultados[0]] : '🎲';
      descripcion = `${emoji} **Resultado: ${resultados[0]}**`;
    } else {
      descripcion = `🎲 **Dados:** ${resultados.join(', ')}\n🎯 **Total:** ${total}`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🎲 Lanzamiento de Dado${cantidad > 1 ? 's' : ''}`)
      .setDescription(descripcion)
      .addFields(
        { name: '📊 Detalles', value: `${cantidad} dado${cantidad > 1 ? 's' : ''} de ${caras} cara${caras > 1 ? 's' : ''}`, inline: true }
      )
      .setColor('#ff6b6b')
      .setFooter({ text: `Lanzado por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
