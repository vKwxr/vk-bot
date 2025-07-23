async function createAutoModRules(guild) {
  try {
    const existingRules = await guild.autoModerationRules.fetch();

    // Regla: Detectar palabras prohibidas
    if (!existingRules.some(rule => rule.name === 'Filtro de palabras prohibidas')) {
      await guild.autoModerationRules.create({
        name: 'Filtro de palabras prohibidas',
        eventType: 1,
        triggerType: 1,
        triggerMetadata: {
          keywordFilter: ['discord.gg/', 'porn', 'xxx', 'sex', 'invite.gg', 'nsfw']
        },
        actions: [{
          type: 1,
          metadata: {
            channel: null,
            customMessage: '🚫 ¡Tu mensaje fue bloqueado por contener enlaces o contenido no permitido!'
          }
        }],
        enabled: true,
        exemptRoles: []
      });
    }

    // Regla: Detectar spam
    if (!existingRules.some(rule => rule.name === 'Filtro de spam')) {
      await guild.autoModerationRules.create({
        name: 'Filtro de spam',
        eventType: 1,
        triggerType: 3,
        triggerMetadata: {},
        actions: [{
          type: 1,
          metadata: {
            channel: null,
            customMessage: '🚫 ¡Tu mensaje fue bloqueado por hacer spam!'
          }
        }],
        enabled: true,
        exemptRoles: []
      });
    }

    console.log(`✅ Reglas AutoMod creadas para ${guild.name}`);
  } catch (error) {
    console.error('❌ Error al crear las reglas AutoMod:', error);
  }
}

module.exports = { createAutoModRules };
