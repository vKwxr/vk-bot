const path = require('path');

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const insultos = [
  "Eres más inútil que un paraguas de papel",
  "Tienes la personalidad de un calcetín mojado",
  "Eres tan lento que necesitas dos horas para ver 60 minutos",
  "Tienes menos gracia que un elefante en una cristalería",
  "Eres más perdido que un pingüino en el desierto",
  "Tienes la inteligencia de una puerta",
  "Eres tan aburrido que haces que los caracoles parezcan rápidos",
  "Tienes menos utilidad que un tenedor para sopa",
  "Eres más confuso que un camaleón en una bolsa de Skittles",
  "Tienes la coordinación de un pulpo en patines",
  "Eres tan despistado que te pierdes en tu propia casa",
  "Tienes menos sentido que un pez en bicicleta",
  "Eres más torpe que un oso bailando ballet",
  "Tienes la sutileza de un rinoceronte en una tienda de cristal",
  "Eres tan olvidadizo que necesitas GPS para encontrar tu memoria",
  "Tienes menos ritmo que un robot descompuesto",
  "Eres más raro que un dinosaurio vegetariano",
  "Tienes la elegancia de una lavadora desbalanceada",
  "Eres tan despistado que intentas empujar una puerta que dice 'tire'",
  "Tienes menos estilo que un espantapájaros"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('insulto')
    .setDescription('😤 Genera un insulto creativo (sin ofender)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a quien dirigir el insulto (de broma)')
        .setRequired(false)),

  async execute(interaction, client) {
    const usuario = interaction.options.getUser('usuario');
    const insultoAleatorio = insultos[Math.floor(Math.random() * insultos.length)];

    let descripcion;
    if (usuario) {
      descripcion = `${usuario.username}, ${insultoAleatorio.toLowerCase()} 😜`;
    } else {
      descripcion = `${insultoAleatorio} 😜`;
    }

    const embed = new EmbedBuilder()
      .setTitle('😤 Insulto Creativo')
      .setDescription(descripcion)
      .setColor('#ff6b6b')
      .setFooter({ text: '¡Solo es una broma! • VK Community Bot', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    if (usuario) {
      embed.setThumbnail(usuario.displayAvatarURL());
    }

    await interaction.reply({ embeds: [embed] });
  },

  name: 'insulto',
  async run(message, args, client) {
    let usuario = message.mentions.users.first();
    if (!usuario && args[0]) {
      try {
        usuario = await client.users.fetch(args[0]);
      } catch (error) {
        usuario = null;
      }
    }

    const insultoAleatorio = insultos[Math.floor(Math.random() * insultos.length)];

    let descripcion;
    if (usuario) {
      descripcion = `${usuario.username}, ${insultoAleatorio.toLowerCase()} 😜`;
    } else {
      descripcion = `${insultoAleatorio} 😜`;
    }

    const embed = new EmbedBuilder()
      .setTitle('😤 Insulto Creativo')
      .setDescription(descripcion)
      .setColor('#ff6b6b')
      .setFooter({ text: '¡Solo es una broma! • VK Community Bot', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    if (usuario) {
      embed.setThumbnail(usuario.displayAvatarURL());
    }

    await message.reply({ embeds: [embed] });
  }
};
