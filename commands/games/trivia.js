const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

const preguntas = [
  {
    pregunta: "¿Cuál es el planeta más cercano al Sol?",
    opciones: ["Venus", "Mercurio", "Marte", "Tierra"],
    correcta: 1,
    categoria: "Astronomía"
  },
  {
    pregunta: "¿En qué año se creó Discord?",
    opciones: ["2014", "2015", "2016", "2013"],
    correcta: 1,
    categoria: "Tecnología"
  },
  {
    pregunta: "¿Cuál es el océano más grande del mundo?",
    opciones: ["Atlántico", "Índico", "Pacífico", "Ártico"],
    correcta: 2,
    categoria: "Geografía"
  },
  {
    pregunta: "¿Quién pintó la Mona Lisa?",
    opciones: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Monet"],
    correcta: 2,
    categoria: "Arte"
  },
  {
    pregunta: "¿Cuál es la capital de Japón?",
    opciones: ["Osaka", "Kyoto", "Tokio", "Nagoya"],
    correcta: 2,
    categoria: "Geografía"
  },
  {
    pregunta: "¿Cuántos continentes hay en la Tierra?",
    opciones: ["5", "6", "7", "8"],
    correcta: 2,
    categoria: "Geografía"
  },
  {
    pregunta: "¿Qué lenguaje de programación se usa principalmente para Discord bots?",
    opciones: ["Python", "JavaScript", "Java", "C++"],
    correcta: 1,
    categoria: "Programación"
  },
  {
    pregunta: "¿Cuál es el elemento químico más abundante en el universo?",
    opciones: ["Oxígeno", "Hidrógeno", "Carbono", "Helio"],
    correcta: 1,
    categoria: "Ciencia"
  }
];

const activeTrivia = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('🧠 Responde preguntas de trivia')
    .addStringOption(option =>
      option.setName('categoria')
        .setDescription('Categoría específica')
        .setRequired(false)
        .addChoices(
          { name: 'Astronomía', value: 'astronomía' },
          { name: 'Tecnología', value: 'tecnología' },
          { name: 'Geografía', value: 'geografía' },
          { name: 'Arte', value: 'arte' },
          { name: 'Ciencia', value: 'ciencia' },
          { name: 'Programación', value: 'programación' }
        )),

  async execute(interaction, client) {
    const userId = interaction.user.id;
    const categoria = interaction.options.getString('categoria');

    if (activeTrivia.has(userId)) {
      return interaction.reply({ content: '❌ Ya tienes una trivia activa.', ephemeral: true });
    }

    let filtradas = preguntas;
    if (categoria) {
      filtradas = preguntas.filter(p =>
        p.categoria.toLowerCase() === categoria.toLowerCase()
      );
    }

    if (!filtradas.length) {
      return interaction.reply({ content: '❌ No hay preguntas disponibles.', ephemeral: true });
    }

    const pregunta = filtradas[Math.floor(Math.random() * filtradas.length)];

    activeTrivia.set(userId, {
      pregunta,
      tiempoInicio: Date.now()
    });

    const embed = new EmbedBuilder()
      .setTitle('🧠 Trivia VK Community')
      .setDescription(pregunta.pregunta)
      .addFields(
        { name: '📂 Categoría', value: pregunta.categoria, inline: true },
        { name: '⏱️ Tiempo límite', value: '30 segundos', inline: true }
      )
      .setColor('#9966ff')
      .setTimestamp();

    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId(`triv_0_${userId}`).setLabel(`A) ${pregunta.opciones[0]}`).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`triv_1_${userId}`).setLabel(`B) ${pregunta.opciones[1]}`).setStyle(ButtonStyle.Primary)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId(`triv_2_${userId}`).setLabel(`C) ${pregunta.opciones[2]}`).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`triv_3_${userId}`).setLabel(`D) ${pregunta.opciones[3]}`).setStyle(ButtonStyle.Primary)
      );

    await interaction.reply({ embeds: [embed], components: [row1, row2] });

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
      filter: i => i.user.id === userId && i.customId.includes(`triv_`)
    });

    collector.on('collect', async i => {
      collector.stop();
      const index = parseInt(i.customId.split('_')[1]);
      const trivia = activeTrivia.get(userId);
      activeTrivia.delete(userId);

      const correcta = trivia.pregunta.correcta;
      const tiempo = Math.floor((Date.now() - trivia.tiempoInicio) / 1000);
      const reward = index === correcta ? Math.max(10, 100 - tiempo * 2) : 0;

      if (reward > 0) {
        const { economyDb } = client.config;
        economyDb.run(
          `INSERT INTO economy (user_id, wallet) VALUES (?, ?)
          ON CONFLICT(user_id) DO UPDATE SET wallet = wallet + ?`,
          [userId, reward, reward]
        );
      }

      const resultEmbed = new EmbedBuilder()
        .setTitle(index === correcta ? '✅ ¡Correcto!' : '❌ Incorrecto')
        .setDescription(index === correcta
          ? `Ganaste **${reward} monedas**`
          : `La respuesta correcta era: **${pregunta.opciones[correcta]}**`)
        .setColor(index === correcta ? '#00ff00' : '#e74c3c');

      await i.update({ embeds: [resultEmbed], components: [] });
    });

    collector.on('end', async collected => {
      if (!collected.size && activeTrivia.has(userId)) {
        const trivia = activeTrivia.get(userId);
        activeTrivia.delete(userId);
        const timeoutEmbed = new EmbedBuilder()
          .setTitle('⏰ Tiempo Agotado')
          .setDescription(`La respuesta correcta era: **${trivia.pregunta.opciones[trivia.pregunta.correcta]}**`)
          .setColor('#ff5555');
        await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
      }
    });
  },

  name: 'trivia',

  async run(message, args, client) {
    const userId = message.author.id;

    if (activeTrivia.has(userId)) {
      return message.reply('❌ Ya tienes una trivia activa.');
    }

    const pregunta = preguntas[Math.floor(Math.random() * preguntas.length)];
    const tiempoInicio = Date.now();

    activeTrivia.set(userId, { pregunta, tiempoInicio });

    const embed = new EmbedBuilder()
      .setTitle('🧠 Trivia VK Community')
      .setDescription(pregunta.pregunta)
      .addFields(
        ...pregunta.opciones.map((op, i) => ({
          name: `${String.fromCharCode(65 + i)})`,
          value: op,
          inline: true
        }))
      )
      .setColor('#9966ff')
      .setFooter({ text: 'Responde con A, B, C o D' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    const filter = m =>
      m.author.id === userId &&
      ['a', 'b', 'c', 'd'].includes(m.content.toLowerCase());

    const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
      const letra = m.content.toLowerCase();
      const index = letra.charCodeAt(0) - 97;
      const trivia = activeTrivia.get(userId);
      activeTrivia.delete(userId);

      const correcta = trivia.pregunta.correcta;
      const tiempo = Math.floor((Date.now() - trivia.tiempoInicio) / 1000);
      const reward = index === correcta ? Math.max(10, 100 - tiempo * 2) : 0;

      if (index === correcta) {
        const { economyDb } = client.config;
        economyDb.run(
          `INSERT INTO economy (user_id, wallet) VALUES (?, ?)
          ON CONFLICT(user_id) DO UPDATE SET wallet = wallet + ?`,
          [userId, reward, reward]
        );
        await m.reply(`✅ ¡Correcto! Ganaste **${reward} monedas**`);
      } else {
        await m.reply(`❌ Incorrecto. La respuesta correcta era: **${pregunta.opciones[correcta]}**`);
      }
    });

    collector.on('end', col => {
      if (col.size === 0) {
        activeTrivia.delete(userId);
        message.channel.send('⏰ Tiempo agotado para responder la trivia.');
      }
    });
  }
};
