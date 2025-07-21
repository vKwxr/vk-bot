
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`🤖 ${client.user.tag} está conectado!`);
    
   client.user.setPresence("Playig a ser Millonario", { type: "PLAYING" });

    // Inicializar sistemas automáticos
    initBirthdayChecker(client);
    initReminderChecker(client);
    initBoostDetection(client);
    
    console.log('✅ Todos los sistemas iniciados correctamente.');
  },
};

// Sistema de cumpleaños
function initBirthdayChecker(client) {
  const checkBirthdays = () => {
    const today = new Date();
    const todayString = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    
    client.config.db.all(
      `SELECT * FROM birthdays WHERE birthday = ?`,
      [todayString],
      async (err, rows) => {
        if (err || !rows.length) return;

        for (const row of rows) {
          try {
            const user = await client.users.fetch(row.user_id);
            const guild = client.guilds.cache.first(); // O el guild específico
            const generalChannel = guild.channels.cache.get('1394028954079461494'); // Canal general

            if (generalChannel) {
              const embed = new EmbedBuilder()
                .setTitle('🎂 ¡Feliz Cumpleaños!')
                .setDescription(`¡Hoy es el cumpleaños de **${user.username}**! 🎉\n\n¡Que tengas un día increíble! 🎈`)
                .setColor('#ff69b4')
                .setThumbnail(user.displayAvatarURL({ size: 256 }))
                .setImage('https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif')
                .setTimestamp();

              await generalChannel.send({
                content: `🎂 <@${user.id}> ¡Feliz cumpleaños!`,
                embeds: [embed]
              });
            }
          } catch (error) {
            console.error('Error enviando felicitación de cumpleaños:', error);
          }
        }
      }
    );
  };

  // Verificar cada hora
  setInterval(checkBirthdays, 60 * 60 * 1000);
  checkBirthdays(); // Verificar al iniciar
}

// Sistema de recordatorios
function initReminderChecker(client) {
  const checkReminders = () => {
    const now = Date.now();
    
    client.config.db.all(
      `SELECT * FROM reminders WHERE remind_at <= ?`,
      [now],
      async (err, rows) => {
        if (err || !rows.length) return;

        for (const reminder of rows) {
          try {
            const channel = await client.channels.fetch(reminder.channel_id);
            const user = await client.users.fetch(reminder.user_id);

            const embed = new EmbedBuilder()
              .setTitle('⏰ Recordatorio')
              .setDescription(reminder.message)
              .setColor('#ffff00')
              .setTimestamp();

            await channel.send({
              content: `<@${user.id}>`,
              embeds: [embed]
            });

            // Eliminar recordatorio
            client.config.db.run(`DELETE FROM reminders WHERE id = ?`, [reminder.id]);
          } catch (error) {
            console.error('Error enviando recordatorio:', error);
          }
        }
      }
    );
  };

  // Verificar cada minuto
  setInterval(checkReminders, 60 * 1000);
}

// Detección de boosts mejorada
function initBoostDetection(client) {
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Solo detectar boosts nuevos
    if (oldMember.premiumSince !== newMember.premiumSince && newMember.premiumSince) {
      const boostChannel = newMember.guild.channels.cache.get('1394028954527989934');
      
      if (boostChannel) {
        const embed = new EmbedBuilder()
          .setTitle('💎 ¡Nuevo Boost!')
          .setDescription(`${newMember} acaba de boostear!\n\n¡Gracias por apoyar nuestra comunidad! 👑`)
          .setColor('#ff73fa')
          .setThumbnail(newMember.user.displayAvatarURL({ size: 256 }))
          .setFooter({ text: 'Boosts vK' })
          .setTimestamp();

        await boostChannel.send({ embeds: [embed] });
      }
    }
  });
}
