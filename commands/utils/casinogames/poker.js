const path = require('path');
// utils/casinoGames/poker.js
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');

module.exports = async (interaction, db, user, apuesta, oponente) => {
  if (!oponente) {
    return interaction.reply({ content: '❌ El Poker requiere que menciones a un oponente.', ephemeral: true });
  }

  if (oponente.bot || oponente.id === interaction.user.id) {
    return interaction.reply({ content: '❌ No puedes jugar contra ti mismo o contra un bot.', ephemeral: true });
  }

  const oponenteData = db.prepare('SELECT * FROM users WHERE user_id = ?').get(oponente.id);
  if (!oponenteData || oponenteData.balance < apuesta) {
    return interaction.reply({ content: '❌ El oponente no tiene cuenta o saldo suficiente.', ephemeral: true });
  }

  const aceptar = new ButtonBuilder().setCustomId('aceptar_poker').setLabel('Aceptar').setStyle(ButtonStyle.Success);
  const rechazar = new ButtonBuilder().setCustomId('rechazar_poker').setLabel('Rechazar').setStyle(ButtonStyle.Danger);
  const row = new ActionRowBuilder().addComponents(aceptar, rechazar);

  await interaction.reply({
    content: `<@${oponente.id}>, ¿aceptas jugar Poker contra <@${interaction.user.id}> apostando **${apuesta} vk coins**?`,
    components: [row],
  });

  const confirm = await interaction.channel.awaitMessageComponent({
    componentType: ComponentType.Button,
    time: 15000,
    filter: i => i.user.id === oponente.id
  }).catch(() => null);

  if (!confirm) {
    return interaction.editReply({ content: '⏳ Tiempo agotado. El juego ha sido cancelado.', components: [] });
  }

  if (confirm.customId === 'rechazar_poker') {
    return interaction.editReply({ content: '❌ El oponente rechazó el juego.', components: [] });
  }

  // Simulación rápida de poker
  const hands = ['🂡🂱🂾', '🂢🂲🃁', '🃎🃘🃙', '🃂🂮🂭', '🂷🂻🂽'];
  const playerHand = hands[Math.floor(Math.random() * hands.length)];
  let opponentHand = hands[Math.floor(Math.random() * hands.length)];
  while (opponentHand === playerHand) {
    opponentHand = hands[Math.floor(Math.random() * hands.length)];
  }

  const winner = Math.random() < 0.5 ? interaction.user : oponente;
  const loser = winner.id === interaction.user.id ? oponente : interaction.user;

  db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(apuesta, winner.id);
  db.prepare('UPDATE users SET balance = balance - ? WHERE user_id = ?').run(apuesta, loser.id);

  const resultEmbed = new EmbedBuilder()
    .setTitle('♠️ Poker - Resultado')
    .setColor(winner.id === interaction.user.id ? 'Green' : 'Red')
    .setDescription(`🃏 Mano de <@${interaction.user.id}>: \`${playerHand}\`\n🃏 Mano de <@${oponente.id}>: \`${opponentHand}\`\n\n🏆 **Ganador:** <@${winner.id}> y gana **${apuesta} vk coins**`)
    .setTimestamp();

  return interaction.editReply({ content: '🎲 Poker finalizado.', embeds: [resultEmbed], components: [] });
};
