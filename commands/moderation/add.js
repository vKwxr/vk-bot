const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('🛡️ Añade reglas de AutoMod al servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId('automod_menu')
      .setPlaceholder('Selecciona una regla de AutoMod')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Bloquear palabras')
          .setValue('keyword')
          .setDescription('Filtra palabras ofensivas o prohibidas'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Bloquear enlaces')
          .setValue('link')
          .setDescription('Bloquea enlaces sospechosos o no deseados'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Spam de menciones')
          .setValue('mention_spam')
          .setDescription('Previene spam de menciones masivas'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Spam general')
          .setValue('spam')
          .setDescription('Detecta mensajes sospechosos tipo spam')
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: 'Selecciona el tipo de regla de AutoMod que deseas crear:',
      components: [row],
      ephemeral: true
    });
  },

  async handleSelectMenu(interaction) {
    const selected = interaction.values[0];

    switch (selected) {
      case 'keyword': {
        const modal = new ModalBuilder()
          .setCustomId('keyword_modal')
          .setTitle('Bloquear Palabras');

        const palabras = new TextInputBuilder()
          .setCustomId('keywords')
          .setLabel('Palabras a bloquear (separadas por coma)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(palabras)
        );

        await interaction.showModal(modal);
        break;
      }

      case 'link': {
        await interaction.guild.autoModerationRules.create({
          name: 'Bloqueo de links',
          eventType: 1,
          triggerType: 4,
          triggerMetadata: { },
          actions: [
            {
              type: 1,
              metadata: {
                channel: interaction.channel.id,
                durationSeconds: 10,
                customMessage: '🚫 No se permiten enlaces en este servidor.'
              }
            }
          ],
          enabled: true
        });

        await interaction.reply({
          content: '✅ Regla de **bloqueo de enlaces** creada correctamente.',
          ephemeral: true
        });
        break;
      }

      case 'mention_spam': {
        await interaction.guild.autoModerationRules.create({
          name: 'Anti Mention Spam',
          eventType: 1,
          triggerType: 5,
          triggerMetadata: {
            mentionTotalLimit: 4
          },
          actions: [
            {
              type: 1,
              metadata: {
                channel: interaction.channel.id,
                durationSeconds: 10,
                customMessage: '🚨 Demasiadas menciones detectadas.'
              }
            }
          ],
          enabled: true
        });

        await interaction.reply({
          content: '✅ Regla de **spam de menciones** creada correctamente.',
          ephemeral: true
        });
        break;
      }

      case 'spam': {
        await interaction.guild.autoModerationRules.create({
          name: 'Anti Spam General',
          eventType: 1,
          triggerType: 3,
          actions: [
            {
              type: 1,
              metadata: {
                channel: interaction.channel.id,
                durationSeconds: 10,
                customMessage: '🛑 Spam detectado.'
              }
            }
          ],
          enabled: true
        });

        await interaction.reply({
          content: '✅ Regla de **spam general** creada correctamente.',
          ephemeral: true
        });
        break;
      }

      default:
        await interaction.reply({
          content: '❌ Opción no válida.',
          ephemeral: true
        });
        break;
    }
  },

  async handleModalSubmit(interaction) {
    if (interaction.customId === 'keyword_modal') {
      const palabrasInput = interaction.fields.getTextInputValue('keywords');
      const palabras = palabrasInput.split(',').map(w => w.trim());

      try {
        await interaction.guild.autoModerationRules.create({
          name: 'Filtro de palabras clave',
          eventType: 1,
          triggerType: 1,
          triggerMetadata: {
            keywordFilter: palabras
          },
          actions: [
            {
              type: 1,
              metadata: {
                channel: interaction.channel.id,
                durationSeconds: 10,
                customMessage: '🛑 Palabra no permitida.'
              }
            }
          ],
          enabled: true
        });

        await interaction.reply({
          content: '✅ Regla de palabras bloqueadas creada con éxito.',
          ephemeral: true
        });
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: '❌ Hubo un error al crear la regla.',
          ephemeral: true
        });
      }
    }
  }
};
