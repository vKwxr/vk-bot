/**
 * guess.js
 * Juego de adivinar números con economía integrada.
 * Compatible con Slash Command (/guess) y comando prefijo (guess <rango|dificultad>).
 * 
 * Mejoras:
 * - Recompensas dinámicas: dificultad, intentos, rapidez, bonus "perfect run".
 * - Pistas inteligentes: más alto/bajo + "muy cerca" + rango reducido sugerido.
 * - Aviso de tiempo restante al acercarse el timeout.
 * - Limpieza automática al finalizar o por inactividad.
 * - Prevención de juegos simultáneos por usuario (por canal).
 * - Código modular y reutilizable entre slash y prefijo.
 * - Mensajes localizados en español.
 */

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

// ======================= CONFIGURACIÓN DEL JUEGO ========================= //

const GAME_TIMEOUT_MS = 5 * 60 * 1000; // 5 min
const WARNING_TIME_MS = 60 * 1000;     // aviso cuando queda 1 min
const CLOSE_THRESHOLD_RATIO = 0.05;    // 5% del rango = "muy cerca"
const HOT_COLD_SEGMENTS = 10;          // para mostrar barra de proximidad opcional

// Tabla de dificultades rápidas (para prefijo o selección futura)
const DIFF_TABLE = {
  facil: 50,
  normal: 100,
  dificil: 250,
  brutal: 500,
  loco: 1000,
};

// ======================= ESTADO EN MEMORIA =============================== //
// Map clave: userId -> objeto juego
const activeGames = new Map();

/**
 * Objeto juego:
 * {
 *   userId,
 *   channelId,
 *   numeroSecreto,
 *   rango,
 *   intentos,
 *   tiempoInicio,
 *   collector,       // message collector (para detener)
 *   warned,          // bool - si ya avisamos que queda poco tiempo
 *   mode: 'slash'|'prefix',
 *   interaction?,    // si es slash
 *   message?,        // si es prefix
 * }
 */


// ======================= UTILIDADES ===================================== //

function randomInt(max) {
  return Math.floor(Math.random() * max) + 1;
}

function calcRewards({ rango, intentos, timeSec }) {
  // Base: rango/10
  const base = Math.ceil(rango / 10);

  // Intentos: + (máx 15 -> cae rápido)
  // Si aciertas en 1 intento: +15, en 5: +10, en 10: +5, luego +1 mínimo
  let attemptBonus = Math.max(1, 16 - Math.min(intentos, 15));

  // Rapidez: si <10s +20, <30s +15, <60s +10, <120s +5, else +1
  let speedBonus;
  if (timeSec <= 10) speedBonus = 20;
  else if (timeSec <= 30) speedBonus = 15;
  else if (timeSec <= 60) speedBonus = 10;
  else if (timeSec <= 120) speedBonus = 5;
  else speedBonus = 1;

  // Perfect run: si intentos <=3 y time <=30s -> multiplicador 1.5
  let total = base + attemptBonus + speedBonus;
  if (intentos <= 3 && timeSec <= 30) {
    total = Math.round(total * 1.5);
  }

  return total;
}

function hotColdMeter(guess, secret, rango) {
  // Simple barra 10 segmentos: lleno = cerca
  const dist = Math.abs(secret - guess);
  const pct = 1 - dist / rango; // 0 lejos, 1 exacto
  const filled = Math.max(0, Math.min(HOT_COLD_SEGMENTS, Math.round(pct * HOT_COLD_SEGMENTS)));
  const blocks = '█'.repeat(filled);
  const empty = '─'.repeat(HOT_COLD_SEGMENTS - filled);
  return `Calor: [${blocks}${empty}]`;
}

function closeHint(guess, secret, rango) {
  const dist = Math.abs(secret - guess);
  const thresh = Math.ceil(rango * CLOSE_THRESHOLD_RATIO);
  if (dist === 0) return null;
  if (dist <= thresh) return '🔥 ¡Estás *muy* cerca!';
  if (dist <= thresh * 2) return '✨ Cerca.';
  return null;
}

function shortRangeSuggestion(guess, secret) {
  // Muestra subrango que seguramente contenga el número según mayor/menor
  if (guess < secret) {
    return `Prueba entre **${guess + 1}** y más arriba.`;
  } else {
    return `Prueba entre más abajo y **${guess - 1}**.`;
  }
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m ${rs}s`;
}

function endGameCleanup(userId) {
  const g = activeGames.get(userId);
  if (!g) return;
  if (g.collector && !g.collector.ended) {
    try { g.collector.stop(); } catch {}
  }
  activeGames.delete(userId);
}

// ======================= ECONOMÍA ======================================= //

function addCoins(economyDb, userId, amount, cb = () => {}) {
  if (!economyDb) return cb(new Error('economyDb no definido'));
  economyDb.get(`SELECT wallet FROM economy WHERE user_id = ?`, [userId], (err, row) => {
    if (err) return cb(err);
    if (!row) {
      economyDb.run(
        `INSERT INTO economy (user_id, wallet) VALUES (?, ?)`,
        [userId, amount],
        cb
      );
    } else {
      economyDb.run(
        `UPDATE economy SET wallet = wallet + ? WHERE user_id = ?`,
        [amount, userId],
        cb
      );
    }
  });
}


// ======================= MENSAJES EMBED ================================== //

function buildStartEmbed(rango) {
  return new EmbedBuilder()
    .setTitle('🎯 Juego de Adivinanza')
    .setDescription(`¡He pensado en un número entre **1** y **${rango}**!`)
    .addFields(
      { name: '📝 Instrucciones', value: 'Escribe un número en el chat para adivinar.\nEscribe **rendirse** o **quit** para abandonar.', inline: false },
      { name: '⏳ Tiempo', value: 'Tienes 5 minutos.', inline: true },
      { name: '🏆 Premio', value: 'Ganas monedas según rango, intentos y rapidez.', inline: true },
    )
    .setColor('#ffaa00')
    .setFooter({ text: 'Tip: intenta con mitad de rango para acortar.' })
    .setTimestamp();
}

function buildGiveUpEmbed(secret) {
  return new EmbedBuilder()
    .setTitle('🏳️ Te has rendido')
    .setDescription(`El número era **${secret}**.`)
    .setColor('#e74c3c')
    .setTimestamp();
}

function buildSuccessEmbed({ numeroSecreto, intentos, timeSec, monedas }) {
  return new EmbedBuilder()
    .setTitle('🎉 ¡Correcto!')
    .setDescription(`¡Has adivinado el número **${numeroSecreto}**!`)
    .addFields(
      { name: '🎯 Intentos', value: `${intentos}`, inline: true },
      { name: '⏱️ Tiempo', value: `${timeSec}s`, inline: true },
      { name: '💰 Ganaste', value: `${monedas} monedas`, inline: true },
    )
    .setColor('#00ff00')
    .setTimestamp();
}

function buildHintEmbed({ guess, pista, intentos, rango, hintExtra, meter }) {
  const emb = new EmbedBuilder()
    .setTitle('🤔 Sigue intentando')
    .setDescription(`El número es **${pista}** que ${guess}.`)
    .addFields(
      { name: '🔢 Intentos', value: `${intentos}`, inline: true },
      { name: '📊 Rango', value: `1 - ${rango}`, inline: true },
    )
    .setColor('#ffaa00');

  if (hintExtra) {
    emb.addFields({ name: '🔥 Pista extra', value: hintExtra, inline: false });
  }
  if (meter) {
    emb.addFields({ name: '🌡️ Proximidad', value: meter, inline: false });
  }

  return emb;
}

function buildTimeoutEmbed(secret) {
  return new EmbedBuilder()
    .setTitle('⏰ Tiempo agotado')
    .setDescription(`Se acabó el tiempo. El número era **${secret}**.`)
    .setColor('#e67e22')
    .setTimestamp();
}

function buildWarningEmbed(remainingMs) {
  return new EmbedBuilder()
    .setTitle('⚠️ ¡El tiempo se acaba!')
    .setDescription(`Te queda **${formatTime(remainingMs)}** antes de que termine el juego.`)
    .setColor('#f1c40f');
}


// ======================= LÓGICA DE COLECCIÓN ============================= //

function createCollector(ctx) {
  const { channel, userId } = ctx;
  const filter = m => m.author.id === userId && !m.author.bot;

  const collector = channel.createMessageCollector({
    filter,
    time: GAME_TIMEOUT_MS,
  });

  const startTime = Date.now();

  collector.on('collect', async (message) => {
    const juego = activeGames.get(userId);
    if (!juego) return;

    const respuesta = message.content.toLowerCase().trim();

    // abandonar
    if (respuesta === 'rendirse' || respuesta === 'quit') {
      endGameCleanup(userId);
      const giveUpEmbed = buildGiveUpEmbed(juego.numeroSecreto);
      return message.reply({ embeds: [giveUpEmbed] });
    }

    // validar número
    const numero = parseInt(respuesta, 10);
    if (isNaN(numero) || numero < 1 || numero > juego.rango) {
      return message.react('❌').catch(() => {});
    }

    juego.intentos++;

    // check acierto
    if (numero === juego.numeroSecreto) {
      endGameCleanup(userId);
      collector.stop('win');

      const timeSec = Math.floor((Date.now() - juego.tiempoInicio) / 1000);
      const monedas = calcRewards({
        rango: juego.rango,
        intentos: juego.intentos,
        timeSec,
      });

      // economía
      const economyDb = ctx.client?.config?.economyDb;
      if (economyDb) {
        addCoins(economyDb, userId, monedas, (err) => {
          if (err) console.error('[guess] Error al actualizar monedas:', err);
        });
      }

      const embedWin = buildSuccessEmbed({
        numeroSecreto: juego.numeroSecreto,
        intentos: juego.intentos,
        timeSec,
        monedas,
      });
      return message.reply({ embeds: [embedWin] });
    }

    // pista
    const pista = numero < juego.numeroSecreto ? 'más alto' : 'más bajo';
    const hintExtra = closeHint(numero, juego.numeroSecreto, juego.rango) || shortRangeSuggestion(numero, juego.numeroSecreto);
    const meter = hotColdMeter(numero, juego.numeroSecreto, juego.rango);

    const embedHint = buildHintEmbed({
      guess: numero,
      pista,
      intentos: juego.intentos,
      rango: juego.rango,
      hintExtra,
      meter,
    });

    await message.reply({ embeds: [embedHint] });

    // Aviso de tiempo si corresponde y aún no avisamos
    const elapsed = Date.now() - startTime;
    const remaining = GAME_TIMEOUT_MS - elapsed;
    if (!juego.warned && remaining <= WARNING_TIME_MS) {
      juego.warned = true;
      const warnEmbed = buildWarningEmbed(remaining);
      await message.reply({ embeds: [warnEmbed] });
    }
  });

  collector.on('end', async (collected, reason) => {
    const juego = activeGames.get(userId);
    if (!juego) return; // ya fue limpiado

    // si no fue win ni manual quit
    endGameCleanup(userId);

    if (reason !== 'win') {
      const timeoutEmbed = buildTimeoutEmbed(juego.numeroSecreto);
      // enviar por contexto
      if (ctx.mode === 'slash') {
        try {
          await ctx.interaction.followUp({ embeds: [timeoutEmbed] });
        } catch {
          try { await ctx.channel.send({ embeds: [timeoutEmbed] }); } catch {}
        }
      } else {
        try {
          await ctx.channel.send({ embeds: [timeoutEmbed] });
        } catch {}
      }
    }
  });

  return collector;
}


// ======================= START GAME (SLASH + PREFIX) ===================== //

async function startGuessGame(ctx, rango) {
  const { userId, channel } = ctx;

  // Si ya existe juego activo en cualquier canal, bloquear
  if (activeGames.has(userId)) {
    if (ctx.mode === 'slash') {
      return ctx.interaction.reply({
        content: '❌ Ya tienes un juego activo. Termínalo primero.',
        ephemeral: true,
      });
    } else {
      return ctx.message.reply('❌ Ya tienes un juego activo. Termínalo primero.');
    }
  }

  // crear juego
  const numeroSecreto = randomInt(rango);
  const juego = {
    userId,
    channelId: channel.id,
    numeroSecreto,
    rango,
    intentos: 0,
    tiempoInicio: Date.now(),
    warned: false,
    mode: ctx.mode,
    interaction: ctx.interaction,
    message: ctx.message,
  };
  activeGames.set(userId, juego);

  const startEmbed = buildStartEmbed(rango);

  // responder
  if (ctx.mode === 'slash') {
    await ctx.interaction.reply({ embeds: [startEmbed] });
  } else {
    await ctx.message.reply({ embeds: [startEmbed] });
  }

  // set collector
  juego.collector = createCollector(ctx);
}


// ======================= SLASH COMMAND DEF =============================== //

const slashData = new SlashCommandBuilder()
  .setName('guess')
  .setDescription('🎯 Juego de adivinar números')
  .addIntegerOption(option =>
    option.setName('rango')
      .setDescription('Rango máximo del número (1-rango)')
      .setMinValue(10)
      .setMaxValue(1000)
      .setRequired(false))
  .addStringOption(option =>
    option.setName('dificultad')
      .setDescription('Selecciona una dificultad predefinida')
      .addChoices(
        { name: 'Fácil (1-50)', value: 'facil' },
        { name: 'Normal (1-100)', value: 'normal' },
        { name: 'Difícil (1-250)', value: 'dificil' },
        { name: 'Brutal (1-500)', value: 'brutal' },
        { name: 'Loco (1-1000)', value: 'loco' },
      )
      .setRequired(false)
  );


// ======================= EXPORT PRINCIPAL ================================ //

module.exports = {
  data: slashData,

  /**
   * Slash executor
   * @param {ChatInputCommandInteraction} interaction 
   * @param {Client} client 
   */
  async execute(interaction, client) {
    const userId = interaction.user.id;
    const rangoArg = interaction.options.getInteger('rango');
    const diffArg = interaction.options.getString('dificultad');
    const rango = rangoArg ?? (diffArg ? DIFF_TABLE[diffArg] : 100);

    await startGuessGame({
      mode: 'slash',
      interaction,
      channel: interaction.channel,
      userId,
      client,
    }, rango);
  },

  /**
   * Prefijo handler
   * Uso: guess [rango|dificultad]
   * @param {Message} message 
   * @param {String[]} args 
   * @param {Client} client 
   */
  name: 'guess',
  async run(message, args, client) {
    const userId = message.author.id;

    let rango = 100;
    if (args[0]) {
      const arg = args[0].toLowerCase();
      if (DIFF_TABLE[arg]) {
        rango = DIFF_TABLE[arg];
      } else {
        const n = parseInt(arg, 10);
        if (!isNaN(n) && n >= 10 && n <= 1000) rango = n;
      }
    }

    await startGuessGame({
      mode: 'prefix',
      message,
      channel: message.channel,
      userId,
      client,
    }, rango);
  },
};
