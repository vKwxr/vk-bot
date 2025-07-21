
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skin')
    .setDescription('🧱 Muestra la skin de Minecraft de un usuario')
    .addStringOption(option =>
      option.setName('usuario')
        .setDescription('Nombre de usuario de Minecraft')
        .setRequired(true)),

  async execute(interaction, client) {
    const username = interaction.options.getString('usuario');

    if (!/^[a-zA-Z0-9_]{1,16}$/.test(username)) {
      return interaction.reply({
        content: '❌ Nombre inválido. Debe tener entre 1-16 caracteres alfanuméricos.',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    try {
      // Usar la nueva API de Mojang
      const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`, {
        timeout: 10000
      });

      if (response.status === 204 || !response.data) {
        return interaction.editReply({
          content: '❌ Usuario de Minecraft no encontrado.',
        });
      }

      const playerData = response.data;
      const uuid = playerData.id;
      const realUsername = playerData.name;

      // Usar APIs modernas para las imágenes
      const skinUrl = `https://mc-heads.net/body/${uuid}/600`;
      const avatarUrl = `https://mc-heads.net/avatar/${uuid}/128`;

      const embed = new EmbedBuilder()
        .setTitle(`🧱 Skin de ${realUsername}`)
        .setDescription(`**UUID:** \`${uuid}\``)
        .setImage(skinUrl)
        .setThumbnail(avatarUrl)
        .setColor('#2ecc71')
        .addFields(
          { name: '👤 Usuario', value: realUsername, inline: true },
          { name: '🎮 Plataforma', value: 'Minecraft Java', inline: false },
          { name: '🆔 UUID', value: `\`${uuid.substring(0, 8)}...\``, inline: false }
        )
        .setFooter({ text: 'Powered vk Bot' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setURL(`https://namemc.com/profile/${uuid}`)
          .setLabel('Ver en NameMC')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🔗'),
        new ButtonBuilder()
          .setURL(skinUrl)
          .setLabel('Skin completa')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🖼️')
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      // Fallback a otra API
      const fallbackSkinUrl = `https://minotar.net/body/${username}/600.png`;
      const fallbackAvatarUrl = `https://minotar.net/helm/${username}/128.png`;

      const embed = new EmbedBuilder()
        .setTitle(`🧱 Skin de ${username}`)
        .setDescription('⚠️ **Usando API alternativa**')
        .setImage(fallbackSkinUrl)
        .setThumbnail(fallbackAvatarUrl)
        .setColor('#f39c12')
        .setFooter({ text: 'API alternativa - Minotar' });

      await interaction.editReply({ embeds: [embed] });
    }
  },

  name: 'skin',
  async run(message, args, client) {
    const username = args[0];
    if (!username) return message.reply('❌ Debes proporcionar un nombre de usuario.');

    if (!/^[a-zA-Z0-9_]{1,16}$/.test(username)) {
      return message.reply('❌ Nombre inválido. Debe tener entre 1-16 caracteres alfanuméricos.');
    }

    const loadingMsg = await message.reply('🔄 Obteniendo skin...');

    try {
      const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`, {
        timeout: 10000
      });

      if (response.status === 204 || !response.data) {
        return loadingMsg.edit('❌ Usuario de Minecraft no encontrado.');
      }

      const playerData = response.data;
      const uuid = playerData.id;
      const realUsername = playerData.name;

      const skinUrl = `https://mc-heads.net/body/${uuid}/600`;
      const avatarUrl = `https://mc-heads.net/avatar/${uuid}/128`;

      const embed = new EmbedBuilder()
        .setTitle(`🧱 Skin de ${realUsername}`)
        .setDescription(`**UUID:** \`${uuid}\``)
        .setImage(skinUrl)
        .setThumbnail(avatarUrl)
        .setColor('#2ecc71')
        .addFields(
          { name: '👤 Usuario', value: realUsername, inline: true },
          { name: '🎮 Plataforma', value: 'Minecraft Java', inline: true },
          { name: '🆔 UUID', value: `\`${uuid.substring(0, 8)}...\``, inline: true }
        )
        .setFooter({ text: 'Powered by MC-Heads & Mojang API' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setURL(`https://namemc.com/profile/${uuid}`)
          .setLabel('Ver en NameMC')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🔗')
      );

      await loadingMsg.edit({ content: null, embeds: [embed], components: [row] });
    } catch (error) {
      const fallbackSkinUrl = `https://minotar.net/body/${username}/600.png`;
      const fallbackAvatarUrl = `https://minotar.net/helm/${username}/128.png`;

      const embed = new EmbedBuilder()
        .setTitle(`🧱 Skin de ${username}`)
        .setDescription('⚠️ **Usando API alternativa**')
        .setImage(fallbackSkinUrl)
        .setThumbnail(fallbackAvatarUrl)
        .setColor('#f39c12')
        .setFooter({ text: 'API alternativa - Minotar' });

      await loadingMsg.edit({ content: null, embeds: [embed] });
    }
  }
};
