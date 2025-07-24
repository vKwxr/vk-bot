const path = require('path');

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lucky')
    .setDescription('🍀 Mide tu nivel de suerte hoy')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario para medir su suerte')
        .setRequired(false)),

  async execute(interaction, client) {
    const usuario = interaction.options.getUser('usuario') || interaction.user;
    
    // Generar número basado en fecha + ID de usuario para consistencia diaria
    const fecha = new Date().toDateString();
    const seed = parseInt(usuario.id.slice(-4)) + fecha.length;
    Math.random = function() {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    const luckyLevel = Math.floor(Math.random() * 101);

    let descripcion;
    let color;
    let emoji;
    let consejo = "";

    if (luckyLevel <= 15) {
      descripcion = "Tu suerte está muy baja hoy... 😔";
      color = '#8b0000';
      emoji = '💀';
      consejo = "Mejor quédate en casa y ve Netflix";
    } else if (luckyLevel <= 30) {
      descripcion = "No es tu día de suerte 😐";
      color = '#ff4444';
      emoji = '😞';
      consejo = "Evita tomar decisiones importantes";
    } else if (luckyLevel <= 50) {
      descripcion = "Suerte promedio, nada especial 🤷‍♂️";
      color = '#ffaa00';
      emoji = '😐';
      consejo = "Un día normal, ni muy bueno ni muy malo";
    } else if (luckyLevel <= 70) {
      descripcion = "¡Tienes buena suerte hoy! 😊";
      color = '#44aa44';
      emoji = '😊';
      consejo = "Es un buen día para probar cosas nuevas";
    } else if (luckyLevel <= 85) {
      descripcion = "¡Tu suerte está en las nubes! ✨";
      color = '#00ff88';
      emoji = '✨';
      consejo = "¡Perfecto para apostar o tomar riesgos!";
    } else if (luckyLevel <= 95) {
      descripcion = "¡SUERTE INCREÍBLE! ¡Estás en racha! 🔥";
      color = '#00ff00';
      emoji = '🔥';
      consejo = "¡Ve y conquista el mundo!";
    } else {
      descripcion = "¡SUERTE MÁXIMA! ¡Eres intocable! ⭐";
      color = '#ffd700';
      emoji = '⭐';
      consejo = "¡Hoy todo te saldrá perfecto!";
    }

    const barraLucky = '🍀'.repeat(Math.floor(luckyLevel / 20)) + '🌫️'.repeat(5 - Math.floor(luckyLevel / 20));

    const embed = new EmbedBuilder()
      .setTitle('🍀 Medidor de Suerte')
      .setDescription(`${emoji} **${usuario.username}** tiene **${luckyLevel}%** de suerte hoy\n\n${descripcion}`)
      .addFields(
        { name: '📊 Nivel de Suerte', value: `${barraLucky} ${luckyLevel}%`, inline: false },
        { name: '💡 Consejo del día', value: consejo, inline: false }
      )
      .setColor(color)
      .setThumbnail(usuario.displayAvatarURL())
      .setFooter({ text: 'La suerte cambia cada día', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'lucky',
  async run(message, args, client) {
    let usuario = message.mentions.users.first();
    if (!usuario && args[0]) {
      try {
        usuario = await client.users.fetch(args[0]);
      } catch (error) {
        usuario = message.author;
      }
    }
    if (!usuario) usuario = message.author;

    const fecha = new Date().toDateString();
    const seed = parseInt(usuario.id.slice(-4)) + fecha.length;
    Math.random = function() {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    const luckyLevel = Math.floor(Math.random() * 101);

    let descripcion;
    let color;
    let emoji;
    let consejo = "";

    if (luckyLevel <= 15) {
      descripcion = "Tu suerte está muy baja hoy... 😔";
      color = '#8b0000';
      emoji = '💀';
      consejo = "Mejor quédate en casa y ve Netflix";
    } else if (luckyLevel <= 30) {
      descripcion = "No es tu día de suerte 😐";
      color = '#ff4444';
      emoji = '😞';
      consejo = "Evita tomar decisiones importantes";
    } else if (luckyLevel <= 50) {
      descripcion = "Suerte promedio, nada especial 🤷‍♂️";
      color = '#ffaa00';
      emoji = '😐';
      consejo = "Un día normal, ni muy bueno ni muy malo";
    } else if (luckyLevel <= 70) {
      descripcion = "¡Tienes buena suerte hoy! 😊";
      color = '#44aa44';
      emoji = '😊';
      consejo = "Es un buen día para probar cosas nuevas";
    } else if (luckyLevel <= 85) {
      descripcion = "¡Tu suerte está en las nubes! ✨";
      color = '#00ff88';
      emoji = '✨';
      consejo = "¡Perfecto para apostar o tomar riesgos!";
    } else if (luckyLevel <= 95) {
      descripcion = "¡SUERTE INCREÍBLE! ¡Estás en racha! 🔥";
      color = '#00ff00';
      emoji = '🔥';
      consejo = "¡Ve y conquista el mundo!";
    } else {
      descripcion = "¡SUERTE MÁXIMA! ¡Eres intocable! ⭐";
      color = '#ffd700';
      emoji = '⭐';
      consejo = "¡Hoy todo te saldrá perfecto!";
    }

    const barraLucky = '🍀'.repeat(Math.floor(luckyLevel / 20)) + '🌫️'.repeat(5 - Math.floor(luckyLevel / 20));

    const embed = new EmbedBuilder()
      .setTitle('🍀 Medidor de Suerte')
      .setDescription(`${emoji} **${usuario.username}** tiene **${luckyLevel}%** de suerte hoy\n\n${descripcion}`)
      .addFields(
        { name: '📊 Nivel de Suerte', value: `${barraLucky} ${luckyLevel}%`, inline: false },
        { name: '💡 Consejo del día', value: consejo, inline: false }
      )
      .setColor(color)
      .setThumbnail(usuario.displayAvatarURL())
      .setFooter({ text: 'La suerte cambia cada día', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
