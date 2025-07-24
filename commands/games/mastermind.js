const path = require("path");
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, '../../economy.db'));

// Generar código aleatorio de 4 dígitos únicos
function generarCodigo() {
  const digitos = [];
  while (digitos.length < 4) {
    const r = Math.floor(Math.random() * 10).toString();
    if (!digitos.includes(r)) digitos.push(r);
  }
  return digitos.join('');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mastermind')
    .setDescription('🎯 ¡Adivina el código secreto de 4 dígitos únicos!')
    .addStringOption(option =>
      option.setName('dificultad')
        .setDescription('Selecciona la dificultad')
        .setRequired(true)
        .addChoices(
          { name: 'Fácil (15 intentos)', value: '15' },
          { name: 'Normal (10 intentos)', value: '10' },
          { name: 'Difícil (5 intentos)', value: '5' }
        )
    ),

  async execute(interaction) {
    const intentosMax = parseInt(interaction.options.getString('dificultad'));
    const secreto = generarCodigo();
    let intentos = 0;

    await interaction.reply(`🔒 ¡Bienvenido al Mastermind Extremo! Adivina el código secreto de **4 dígitos únicos**. Tienes **${intentosMax} intentos**.\nEnvía tus intentos como mensajes (ej: \`1234\`).`);

    const filter = m => m.author.id === interaction.user.id && /^\d{4}$/.test(m.content);
    const collector = interaction.channel.createMessageCollector({ filter, max: intentosMax, time: 60000 });

    collector.on('collect', async m => {
      intentos++;
      const intento = m.content;
      if (intento === secreto) {
        await m.reply(`🎉 ¡Correcto! El código era **${secreto}**. Lo lograste en ${intentos} intento(s).`);
        updateStats(interaction.user.id, true);
        collector.stop();
        return;
      }

      // Comparar intento con código secreto
      let exactos = 0, aproximados = 0;
      for (let i = 0; i < 4; i++) {
        if (intento[i] === secreto[i]) exactos++;
        else if (secreto.includes(intento[i])) aproximados++;
      }

      await m.reply(`❌ Intento ${intentos}/${intentosMax} → ${intento} | 🎯 Exactos: ${exactos} | 🔄 Aproximados: ${aproximados}`);

      if (intentos >= intentosMax) {
        await interaction.followUp(`💀 Te quedaste sin intentos. El código era **${secreto}**.`);
        updateStats(interaction.user.id, false);
        collector.stop();
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) interaction.followUp('⌛ No enviaste ningún intento. Juego terminado.');
    });
  }
};

// Guardar estadísticas
function updateStats(userId, win) {
  db.run(`CREATE TABLE IF NOT EXISTS mastermind_stats (user TEXT PRIMARY KEY, wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, streak INTEGER DEFAULT 0)`);
  db.get(`SELECT * FROM mastermind_stats WHERE user = ?`, [userId], (err, row) => {
    if (err) return console.error(err);

    if (!row) {
      const wins = win ? 1 : 0;
      const losses = win ? 0 : 1;
      const streak = win ? 1 : 0;
      db.run(`INSERT INTO mastermind_stats (user, wins, losses, streak) VALUES (?, ?, ?, ?)`, [userId, wins, losses, streak]);
    } else {
      const wins = win ? row.wins + 1 : row.wins;
      const losses = win ? row.losses : row.losses + 1;
      const streak = win ? row.streak + 1 : 0;
      db.run(`UPDATE mastermind_stats SET wins = ?, losses = ?, streak = ? WHERE user = ?`, [wins, losses, streak, userId]);
    }
  });
}