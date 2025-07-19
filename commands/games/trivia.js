
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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
      return interaction.reply({
        content: '❌ Ya tienes una trivia activa. Termínala primero.',
        ephemeral: true
      });
    }

    // Filtrar preguntas por categoría si se especifica
    let preguntasFiltradas = preguntas;
    if (categoria) {
      preguntasFiltradas = preguntas.filter(p => 
        p.categoria.toLowerCase() === categoria.toLowerCase()
      );
    }

    if (preguntasFiltradas.length === 0) {
      return interaction.reply({
        content: '❌ No hay preguntas disponibles para esa categoría.',
        ephemeral: true
      });
    }

    // Seleccionar pregunta aleatoria
    const preguntaSeleccionada = preguntasFiltradas[
      Math.floor(Math.random() * preguntasFiltradas.length)
    ];

    // Guardar pregunta activa
    activeTrivia.set(userId, {
      pregunta: preguntaSeleccionada,
      tiempoInicio: Date.now(),
      canal: interaction.channel.id
    });

    const embed = new EmbedBuilder()
      .setTitle('🧠 Trivia VK Community')
      .setDescription(preguntaSeleccionada.pregunta)
      .addFields(
        { name: '📂 Categoría', value: preguntaSeleccionada.categoria, inline: true },
        { name: '⏱️ Tiempo límite', value: '30 segundos', inline: true }
      )
      .setColor('#9966ff')
      .setTimestamp();

    // Crear botones para las opciones
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`trivia_0_${userId}`)
          .setLabel(`A) ${preguntaSeleccionada.opciones[0]}`)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`trivia_1_${userId}`)
          .setLabel(`B) ${preguntaSeleccionada.opciones[1]}`)
          .setStyle(ButtonStyle.Primary)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`trivia_2_${userId}`)
          .setLabel(`C) ${preguntaSeleccionada.opciones[2]}`)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`trivia_3_${userId}`)
          .setLabel(`D) ${preguntaSeleccionada.opciones[3]}`)
          .setStyle(ButtonStyle.Primary)
      );

    await interaction.reply({ 
      embeds: [embed], 
      components: [row1, row2] 
    });

    // Timer para terminar automáticamente
    setTimeout(async () => {
      if (activeTrivia.has(userId)) {
        activeTrivia.delete(userId);
        
        try {
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏰ Tiempo Agotado')
            .setDescription(`La respuesta correcta era: **${preguntaSeleccionada.opciones[preguntaSeleccionada.correcta]}**`)
            .setColor('#e74c3c');

          await interaction.editReply({ 
            embeds: [timeoutEmbed], 
            components: [] 
          });
        } catch (error) {
          console.error('Error al actualizar mensaje de trivia:', error);
        }
      }
    }, 30000);
  },

  name: 'trivia',
  async run(message, args, client) {
    const userId = message.author.id;

    if (activeTrivia.has(userId)) {
      return message.reply('❌ Ya tienes una trivia activa. Termínala primero.');
    }

    const preguntaSeleccionada = preguntas[Math.floor(Math.random() * preguntas.length)];

    activeTrivia.set(userId, {
      pregunta: preguntaSeleccionada,
      tiempoInicio: Date.now(),
      canal: message.channel.id
    });

    const embed = new EmbedBuilder()
      .setTitle('🧠 Trivia VK Community')
      .setDescription(preguntaSeleccionada.pregunta)
      .addFields(
        ...preguntaSeleccionada.opciones.map((opcion, index) => ({
          name: `${String.fromCharCode(65 + index)})`,
          value: opcion,
          inline: true
        }))
      )
      .setColor('#9966ff')
      .setFooter({ text: 'Responde con A, B, C o D' })
      .setTimestamp();

    const triviaMessage = await message.reply({ embeds: [embed] });

    const filter = m => m.author.id === userId && 
      ['a', 'b', 'c', 'd'].includes(m.content.toLowerCase());
    
    const collector = message.channel.createMessageCollector({ 
      filter, 
      time: 30000, 
      max: 1 
    });

    collector.on('collect', async (response) => {
      const respuesta = response.content.toLowerCase();
      const indiceRespuesta = respuesta.charCodeAt(0) - 97; // a=0, b=1, etc.

      activeTrivia.delete(userId);

      if (indiceRespuesta === preguntaSeleccionada.correcta) {
        const tiempoRespuesta = (Date.now() - activeTrivia.get(userId)?.tiempoInicio || Date.now()) / 1000;
        const monedas = Math.floor(100 + (30 - tiempoRespuesta) * 2);

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

        const embed = new EmbedBuilder()
          .setTitle('✅ ¡Correcto!')
          .setDescription(`¡Respuesta correcta! Has ganado **${monedas} monedas**`)
          .setColor('#00ff00');

        await response.reply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setTitle('❌ Incorrecto')
          .setDescription(`La respuesta correcta era: **${preguntaSeleccionada.opciones[preguntaSeleccionada.correcta]}**`)
          .setColor('#e74c3c');

        await response.reply({ embeds: [embed] });
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        activeTrivia.delete(userId);
        message.channel.send('⏰ Tiempo agotado para responder la trivia.');
      }
    });
  }
};
