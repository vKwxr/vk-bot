// Carga variables de entorno
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  AttachmentBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  StringSelectMenuBuilder,
} = require("discord.js");
const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();

// Inicializar base de datos
const db = new sqlite3.Database("./moderacion.sqlite", (err) => {
  if (err) console.error("❌ Error al conectar con la base de datos:", err);
    else console.log("📦 Base de datos conectada correctamente.");
  });

// Crear tablas necesarias
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    reason TEXT,
    date TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    username TEXT,
    join_date TEXT,
    message_count INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS afk_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE,
    reason TEXT,
    timestamp TEXT
  )`);
});

// Inicializar base de datos de tickets
const ticketsDb = new sqlite3.Database("./tickets.sqlite", (err) => {
  if (err)
    console.error("❌ Error al conectar con la base de datos de tickets:", err);
  else console.log("🎫 Base de datos de tickets conectada correctamente.");
});

// Crear tabla de tickets
ticketsDb.serialize(() => {
  ticketsDb.run(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    channel_id TEXT UNIQUE,
    type TEXT,
    status TEXT,
    created_at TEXT,
    closed_at TEXT,
    assigned_to TEXT,
    priority TEXT DEFAULT 'normal'
  )`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const prefix = "vk";

// Configuración de tickets
const STAFF_ROLE_ID = "1394028954079461487";
const ADMIN_ROLE_ID = "1394028954079461488";
const TICKETS_CATEGORY_ID = "1394028954527989935";
const TICKETS_LOGS_CHANNEL_ID = "1394028954527989939";

const TICKET_TYPES = [
  {
    id: "soporte",
    label: "🛠️ Soporte Técnico",
    description: "Problemas técnicos",
    emoji: "🛠️",
  },
  {
    id: "reporte",
    label: "🚨 Reportar Usuario",
    description: "Comportamiento inadecuado",
    emoji: "🚨",
  },
  {
    id: "sugerencia",
    label: "💡 Sugerencia",
    description: "Mejoras para el servidor",
    emoji: "💡",
  },
  {
    id: "apelacion",
    label: "⚖️ Apelación",
    description: "Apelar sanciones",
    emoji: "⚖️",
  },
  {
    id: "partnership",
    label: "🤝 Partnership",
    description: "Colaboraciones",
    emoji: "🤝",
  },
  { id: "otro", label: "❓ Otro", description: "Otras consultas", emoji: "❓" },
];

const ticketCooldown = new Map();

// Función para cerrar tickets
async function closeTicket(channel, user, reason, ticketsDb) {
  try {
    // Obtener datos del ticket
    ticketsDb.get(
      `SELECT * FROM tickets WHERE channel_id = ?`,
      [channel.id],
      async (err, row) => {
        if (err || !row) {
          console.error("❌ Ticket no encontrado en la base de datos:", err);
          return channel.send(
            "❌ Error: Ticket no encontrado en la base de datos."
          );
        }

        const userId = row.user_id;
        const type = row.type;
        const createdAt = row.created_at;

        // Actualizar estado en la base de datos
        ticketsDb.run(
          `UPDATE tickets SET status = 'cerrado', closed_at = ? WHERE channel_id = ?`,
          [new Date().toISOString(), channel.id],
        );

        // Crear transcripción
        const messages = await channel.messages.fetch({ limit: 100 });
        const transcript = messages
          .filter((m) => !m.author.bot)
          .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
          .map(
            (msg) =>
              `[${new Date(msg.createdTimestamp).toLocaleString()}] ${msg.author.tag}: ${msg.content || "[Adjunto/Embed]"}`,
          )
          .join("\n");

        const buffer = Buffer.from(transcript, "utf-8");
        const attachment = new AttachmentBuilder(buffer, {
          name: `transcript-${channel.name}.txt`,
        });

        // Enviar transcripción al usuario
        try {
          const targetUser = await client.users.fetch(userId);
          await targetUser.send({
            content: `🎫 Tu ticket de ${type} ha sido cerrado.\n\n**Razón:** ${reason}\n**Fecha de creación:** ${createdAt}`,
            files: [attachment],
          });
        } catch (error) {
          console.error("❌ Error enviando transcripción al usuario:", error);
          await channel.send(
            `❌ Error: No se pudo enviar la transcripción al usuario.`,
          );
        }

        // Enviar log al canal de logs
        const logsChannel = channel.guild.channels.cache.get(
          TICKETS_LOGS_CHANNEL_ID,
        );
        if (logsChannel) {
          const targetUser = await client.users.fetch(userId);
          const logEmbed = new EmbedBuilder()
            .setTitle("🔒 Ticket Cerrado")
            .setDescription(
              `
**Canal:** ${channel.name}
**Usuario:** <@${userId}> (${targetUser.tag})
**Tipo:** ${type}
**Razón:** ${reason}
**Cerrado por:** ${user}`,
            )
            .setColor("#e74c3c")
            .setThumbnail(
              targetUser.displayAvatarURL({ extension: "png", size: 256 }),
            )
            .setTimestamp();

          await logsChannel.send({ embeds: [logEmbed], files: [attachment] });
        }

        // Eliminar canal después de 5 segundos
        await channel.send("🔒 Este ticket será eliminado en 5 segundos...");
        setTimeout(() => {
          channel.delete().catch(console.error);
        }, 5000);
      },
    );
  } catch (error) {
    console.error("❌ Error cerrando ticket:", error);
    await channel.send("❌ Error al cerrar el ticket.");
  }
};

// Comandos Slash
const commands = [
  // Comandos básicos
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Muestra la latencia del bot"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra la lista de comandos"),

  // Comandos de moderación
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banea a un usuario")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuario a banear")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("razon")
        .setDescription("Razón del baneo")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa a un usuario")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuario a expulsar")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("razon")
        .setDescription("Razón de la expulsión")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mutea a un usuario")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuario a mutear")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("tiempo")
        .setDescription("Tiempo (ej: 5m, 1h, 2d)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("razon")
        .setDescription("Razón del muteo")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Elimina mensajes")
    .addIntegerOption((option) =>
      option
        .setName("cantidad")
        .setDescription("Cantidad de mensajes a eliminar")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    ),

  // Comandos utilitarios
  new SlashCommandBuilder()
    .setName("skin")
    .setDescription("Muestra la skin de un usuario de Minecraft")
    .addStringOption((option) =>
      option
        .setName("usuario")
        .setDescription("Nombre de usuario de Minecraft")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Te pone en modo AFK")
    .addStringOption((option) =>
      option
        .setName("razon")
        .setDescription("Razón del AFK")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Crea una encuesta")
    .addStringOption((option) =>
      option
        .setName("pregunta")
        .setDescription("La pregunta de la encuesta")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("opciones")
        .setDescription("Opciones separadas por comas (máximo 10)")
        .setRequired(true),
    ),

  // Comandos de administración
  new SlashCommandBuilder()
    .setName("anuncio")
    .setDescription("Crear un anuncio (Solo admins)")
    .addStringOption((option) =>
      option
        .setName("titulo")
        .setDescription("Título del anuncio")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("descripcion")
        .setDescription("Descripción del anuncio")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("imagen")
        .setDescription("URL de la imagen (opcional)")
        .setRequired(false),
    ),

  // Sistema de Tickets
  new SlashCommandBuilder()
    .setName("paneltickets")
    .setDescription("Enviar el panel de tickets (Solo administradores)"),

  new SlashCommandBuilder()
    .setName("tickets")
    .setDescription("Ver la lista de tickets abiertos (Staff)"),

  new SlashCommandBuilder()
    .setName("closeticket")
    .setDescription("Cerrar el ticket actual (Staff)")
    .addStringOption((option) =>
      option
        .setName("razon")
        .setDescription("Razón del cierre")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("adduser")
    .setDescription("Añadir usuario al ticket (Staff)")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuario a añadir")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("removeuser")
    .setDescription("Remover usuario del ticket (Staff)")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuario a remover")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("assignticket")
    .setDescription("Asignar ticket a un staff (Administradores)")
    .addUserOption((option) =>
      option
        .setName("staff")
        .setDescription("Staff a asignar")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("ticketpriority")
    .setDescription("Cambiar prioridad del ticket (Administradores)")
    .addStringOption((option) =>
      option
        .setName("prioridad")
        .setDescription("Nueva prioridad")
        .setRequired(true)
        .addChoices(
          { name: "Baja", value: "baja" },
          { name: "Normal", value: "normal" },
          { name: "Alta", value: "alta" },
          { name: "Urgente", value: "urgente" },
        ),
    ),

  new SlashCommandBuilder()
    .setName("ticketstats")
    .setDescription("Ver estadísticas de tickets (Staff)"),

  new SlashCommandBuilder()
    .setName("renameticket")
    .setDescription("Renombrar el ticket actual (Staff)")
    .addStringOption((option) =>
      option
        .setName("nombre")
        .setDescription("Nuevo nombre del ticket")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Ver información de un usuario (Staff)")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuario a consultar")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Ver información del servidor"),

  // Comandos de Sorteos
  new SlashCommandBuilder()
    .setName("sorteo")
    .setDescription("Crear un sorteo (Solo administradores)")
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal donde se publicará el sorteo")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("titulo")
        .setDescription("Título del sorteo")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("patrocinador")
        .setDescription("Patrocinador del sorteo")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("duracion")
        .setDescription("Duración (ej: 2h, 1d)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("premio")
        .setDescription("Premio del sorteo")
        .setRequired(true),
    )
    .addRoleOption((option) =>
      option
        .setName("rol")
        .setDescription("Rol requerido para participar")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("imagen")
        .setDescription("URL de imagen (opcional)")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("sorteos")
    .setDescription("Ver historial de sorteos"),

  // Comandos de Niveles
  new SlashCommandBuilder()
    .setName("level")
    .setDescription("Ver nivel de un usuario")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuario a consultar")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Ver tabla de clasificación de niveles"),

  // Comandos de Tutoriales
  new SlashCommandBuilder()
    .setName("tutorialmod")
    .setDescription("Tutorial de comandos de moderación (Staff)"),

  new SlashCommandBuilder()
    .setName("tutorialfun")
    .setDescription("Tutorial de comandos divertidos"),

  new SlashCommandBuilder()
    .setName("tutorialtickets")
    .setDescription("Tutorial del sistema de tickets (Staff)"),

  new SlashCommandBuilder()
    .setName("tutorialanuncios")
    .setDescription("Tutorial de anuncios (Administradores)"),

  new SlashCommandBuilder()
    .setName("tutorialsorteos")
    .setDescription("Tutorial de sorteos (Administradores)"),
];

// Registrar comandos slash
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🔄 Actualizando comandos slash...");
    console.log(`📋 Registrando ${commands.length} comandos:`);
    commands.forEach((command) => {
      console.log(`  - /${command.name}: ${command.description}`);
    });

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Comandos slash actualizados correctamente.");
    console.log(
      "⏳ Los comandos pueden tardar hasta 1 hora en aparecer globalmente.",
    );
  } catch (error) {
    console.error("❌ Error al actualizar comandos slash:", error);
    if (error.code === 50035) {
      console.error(
        "Error de validación en los comandos. Revisa la estructura de los comandos.",
      );
    }
  }
})();

client.once("ready", async () => {
  const guild = client.guilds.cache.first(); // o por ID
  console.log(
    "📋 Roles cacheados:",
    guild.roles.cache.map((r) => `${r.name}: ${r.id}`),
  );
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
  client.user.setActivity("🎮 Moderando VK Community", { type: "WATCHING" });

  // Enviar reglas automáticamente al canal de reglas
  try {
    const rulesChannelId = "1394028954079461493";
    const rulesChannel = client.channels.cache.get(rulesChannelId);

    if (rulesChannel) {
      const messages = await rulesChannel.messages.fetch({ limit: 5 });
      const botMessages = messages.filter(
        (msg) => msg.author.id === client.user.id,
      );

      if (botMessages.size === 0) {
        const rulesEmbed = new EmbedBuilder()
          .setTitle("📋 Reglas de VK Community")
          .setDescription(
            `
**¡Bienvenido a VK Community! 👑**

Para mantener un ambiente divertido y respetuoso para todos, sigue estas reglas:

**1. 🤝 Respeto mutuo**
• Trata a todos con respeto y cortesía
• No se toleran insultos, acoso o discriminación

**2. 💬 Usa los canales apropiados**
• Mantén las conversaciones en el canal correcto
• Lee las descripciones de cada canal

**3. 🚫 Contenido prohibido**
• No spam, flood o mensajes repetitivos
• No contenido NSFW o inapropiado
• No enlaces sospechosos o maliciosos

**4. 🎮 Diversión sana**
• Los juegos y bromas están permitidos
• No arruines la diversión de otros

**5. 🛡️ Colabora con el staff**
• Reporta problemas a los moderadores
• Sigue las instrucciones del equipo

**6. 🎭 Autoroles obligatorio**
• Usa el canal de autoroles para obtener el rol de usuario
• Sin este rol no podrás hablar en los canales

**¿Necesitas ayuda?**
Contacta a cualquier miembro del staff o usa los comandos del bot.

¡Disfruta tu estancia en VK Community! 👑✨`,
          )
          .setColor("#9966ff")
          .setImage(
            "https://media.discordapp.net/attachments/1394028954527989938/1394040612759670864/descarga.gif?ex=68755cfe&is=68740b7e&hm=2b76f3de8f0eea2f2e0ccc92365eb7b1359d7cdc49726f9f94a4cee7dfe83e3a&=",
          )
          .setFooter({ text: "Reglas VK Community" })
          .setTimestamp();

        await rulesChannel.send({ embeds: [rulesEmbed] });
        console.log("✅ Reglas enviadas al canal de reglas");
      }
    }
  } catch (error) {
    console.error("❌ Error enviando reglas:", error);
  }

  // Enviar tutorial del comando anuncio
  try {
    const adminChannelId = "1394028954527989940";
    const adminChannel = client.channels.cache.get(adminChannelId);

    if (adminChannel) {
      const messages = await adminChannel.messages.fetch({ limit: 5 });
      const botMessages = messages.filter(
        (msg) => msg.author.id === client.user.id,
      );

      if (botMessages.size === 0) {
        const tutorialEmbed = new EmbedBuilder()
          .setTitle("📢 Tutorial - Comando de Anuncio")
          .setDescription(
            `
**¿Cómo usar el comando \`vkanuncio\`?**

Este comando solo funciona en este canal y es exclusivo para administradores.

**Sintaxis:**
\`vkanuncio [título] | [descripción] | [imagen_url (opcional)]\`

**Ejemplo:**
\`vkanuncio Evento Especial | Habrá un evento especial en VK Community a las 8:00 PM. ¡No te lo pierdas! | https://ejemplo.com/imagen.png\`

**Notas importantes:**
• Usa \`|\` para separar el título, descripción e imagen
• La imagen es opcional
• El anuncio se enviará automáticamente al canal de anuncios
• Solo administradores pueden usar este comando`,
          )
          .setColor("#9966ff")
          .setFooter({ text: "Sistema de anuncios - VK Community" })
          .setTimestamp();

        await adminChannel.send({ embeds: [tutorialEmbed] });
        console.log("✅ Tutorial de anuncios enviado");
      }
    }
  } catch (error) {
    console.error("❌ Error enviando tutorial:", error);
  }

  // Enviar tutorial de comandos de moderación
  try {
    const modChannelId = "1394028954527989939"; // Canal de logs/moderación
    const modChannel = client.channels.cache.get(modChannelId);

    if (modChannel) {
      const messages = await modChannel.messages.fetch({ limit: 10 });
      const botTutorials = messages.filter(
        (msg) =>
          msg.author.id === client.user.id &&
          msg.embeds.length > 0 &&
          msg.embeds[0].title?.includes("Tutorial - Comandos de Moderación"),
      );

      if (botTutorials.size === 0) {
        const modTutorialEmbed = new EmbedBuilder()
          .setTitle("🛡️ Tutorial - Comandos de Moderación")
          .setDescription(
            `
**Comandos de Moderación Disponibles:**

**🔨 Sanciones:**
• \`vkmute @usuario 10m Spam\` - Mutear usuario
• \`vkunmute @usuario\` - Desmutear usuario
• \`vkban @usuario Comportamiento inadecuado\` - Banear usuario
• \`vkkick @usuario Romper reglas\` - Expulsar usuario

**⚠️ Advertencias:**
• \`vkwarn @usuario Razón\` - Advertir usuario
• \`vkwarnings @usuario\` - Ver advertencias
• \`vkresetwarns @usuario\` - Limpiar advertencias

**🧹 Limpieza:**
• \`vkclear 50\` - Eliminar mensajes (1-100)

**📊 Información:**
• \`vkuserinfo @usuario\` - Información del usuario
• \`vkserverinfo\` - Información del servidor

**🎫 Tickets:**
• \`/paneltickets\` - Enviar panel de tickets
• \`/tickets\` - Ver tickets abiertos
• \`/closeticket\` - Cerrar ticket
• \`/adduser @usuario\` - Añadir usuario al ticket
• \`/removeuser @usuario\` - Remover usuario del ticket
• \`/assignticket @staff\` - Asignar ticket
• \`/ticketpriority [prioridad]\` - Cambiar prioridad
• \`/renameticket [nombre]\` - Renombrar ticket

**Formatos de tiempo:**
• \`s\` = segundos | \`m\` = minutos | \`h\` = horas | \`d\` = días
• Ejemplo: \`10s\`, \`5m\`, \`2h\`, \`1d\``,
          )
          .setColor("#e74c3c")
          .setFooter({ text: "Sistema de moderación - VK Community" })
          .setTimestamp();

        await modChannel.send({ embeds: [modTutorialEmbed] });
        console.log("✅ Tutorial de moderación enviado");
      }
    }
  } catch (error) {
    console.error("❌ Error enviando tutorial de moderación:", error);
  }

  // Enviar tutorial de comandos divertidos
  try {
    const generalChannelId = "1394028954079461494"; // Canal general
    const generalChannel = client.channels.cache.get(generalChannelId);

    if (generalChannel) {
      const messages = await generalChannel.messages.fetch({ limit: 10 });
      const botTutorials = messages.filter(
        (msg) =>
          msg.author.id === client.user.id &&
          msg.embeds.length > 0 &&
          msg.embeds[0].title?.includes("Tutorial - Comandos Divertidos"),
      );

      if (botTutorials.size === 0) {
        const funTutorialEmbed = new EmbedBuilder()
          .setTitle("🎮 Tutorial - Comandos Divertidos")
          .setDescription(
            `
**¡Comandos para divertirse en VK Community!**

**🎭 Comandos Básicos:**
• \`vkhola\` - Saludo personalizado
• \`vkchiste\` - Chiste aleatorio
• \`vkinsulto\` - Insulto creativo (sin ofender)

**🎲 Juegos de Azar:**
• \`vkmoneda\` - Lanzar moneda (cara o cruz)
• \`vkdado\` - Lanzar dado (1-6)
• \`vkfacha\` - Medidor de facha (%)

**💤 Utilidades:**
• \`vkafk [razón]\` - Activar modo AFK
• \`/skin usuario\` - Ver skin de Minecraft
• \`/ping\` - Latencia del bot

**📊 Interactivos:**
• \`/poll pregunta | opción1,opción2\` - Crear encuesta

¡Prueba todos los comandos y diviértete! 🎉`,
          )
          .setColor("#00ff00")
          .setFooter({ text: "Comandos divertidos - VK Community" })
          .setTimestamp();

        await generalChannel.send({ embeds: [funTutorialEmbed] });
        console.log("✅ Tutorial de comandos divertidos enviado");
      }
    }
  } catch (error) {
    console.error("❌ Error enviando tutorial de comandos divertidos:", error);
  }

  // Sistema de autoroles
  try {
    const autorolesChannelId = "1394028954527989933";
    const autorolesChannel = client.channels.cache.get(autorolesChannelId);

    if (autorolesChannel) {
      const messages = await autorolesChannel.messages.fetch({ limit: 10 });
      const botMessages = messages.filter(
        (msg) => msg.author.id === client.user.id,
      );

      if (botMessages.size === 0) {
        // Embed de usuarios
        const usersEmbed = new EmbedBuilder()
          .setTitle("👥 Rol de Usuario")
          .setDescription(
            "**¡IMPORTANTE!** Debes obtener este rol para poder hablar en los canales.\n\nReacciona con 👤 para obtener el rol de usuario.",
          )
          .setColor("#00ff00")
          .setFooter({ text: "VK Community - Autoroles" });

        const usersMessage = await autorolesChannel.send({
          embeds: [usersEmbed],
        });
        await usersMessage.react("👤");

        // Embed de géneros
        const genderEmbed = new EmbedBuilder()
          .setTitle("⚧️ Selecciona tu Género")
          .setDescription(
            "Reacciona con el emoji correspondiente:\n\n🚹 - Boy\n🚺 - Girl",
          )
          .setColor("#ff69b4")
          .setFooter({ text: "VK Community - Autoroles" });

        const genderMessage = await autorolesChannel.send({
          embeds: [genderEmbed],
        });
        await genderMessage.react("🚹");
        await genderMessage.react("🚺");

        // Embed de idiomas
        const languageEmbed = new EmbedBuilder()
          .setTitle("🌐 Selecciona tu Idioma")
          .setDescription(
            "Reacciona con el emoji correspondiente:\n\n🇺🇸 - English\n🇪🇸 - Español",
          )
          .setColor("#4169e1")
          .setFooter({ text: "VK Community - Autoroles" });

        const languageMessage = await autorolesChannel.send({
          embeds: [languageEmbed],
        });
        await languageMessage.react("🇺🇸");
        await languageMessage.react("🇪🇸");

        // Embed de edades
        const ageEmbed = new EmbedBuilder()
          .setTitle("🎂 Selecciona tu Edad")
          .setDescription(
            "Reacciona con el emoji correspondiente:\n\n1️⃣ - 16-17 años\n2️⃣ - 18-19 años\n3️⃣ - 20-21 años\n4️⃣ - 22+ años",
          )
          .setColor("#ffd700")
          .setFooter({ text: "VK Community - Autoroles" });

        const ageMessage = await autorolesChannel.send({ embeds: [ageEmbed] });
        await ageMessage.react("1️⃣");
        await ageMessage.react("2️⃣");
        await ageMessage.react("3️⃣");
        await ageMessage.react("4️⃣");

        console.log("✅ Sistema de autoroles configurado");
      }
    }
  } catch (error) {
    console.error("❌ Error configurando autoroles:", error);
  }
});

// Sistema de bienvenida
client.on("guildMemberAdd", async (member) => {
  const welcomeChannelId = "1394028954079461491";

  const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

  if (welcomeChannel) {
    try {
      // Contador actualizado de miembros (sin bots)
      const totalMembers = member.guild.members.cache.filter(
        (m) => !m.user.bot,
      ).size;

      const welcomeEmbed = new EmbedBuilder()
        .setTitle("👑 ¡Bienvenido a VK Community!")
        .setDescription(
          `**${member.user.username}** se unió a la comunidad de VK!\n\nAhora somos **${totalMembers}** miembros 🎉\n\n🎭 **¡No olvides ir al canal de autoroles para obtener tus roles!**`,
        )
        .setColor("#9966ff")
        .setThumbnail(
          member.user.displayAvatarURL({ extension: "png", size: 256 }),
        )
        .setFooter({ text: "Bienvenido a VK Community" })
        .setTimestamp();

      await welcomeChannel.send({
        content: `${member} Bienvenido a VK Community! 👑`,
        embeds: [welcomeEmbed],
      });
    } catch (error) {
      console.error("Error enviando mensaje de bienvenida:", error);
      // Fallback simple
      await welcomeChannel.send(
        `${member} Bienvenido a VK Community! 👑 Ahora somos ${member.guild.members.cache.filter((m) => !m.user.bot).size} miembros 🎉`,
      );
    }
  }

  // Guardar en base de datos
  db.run(
    `INSERT INTO user_stats (user_id, username, join_date) VALUES (?, ?, ?)`,
    [member.id, member.user.username, new Date().toISOString()],
  );
});

// Sistema de boost del servidor
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  // Detecta boost nuevo
  if (
    oldMember.premiumSince !== newMember.premiumSince &&
    newMember.premiumSince
  ) {
    const boostChannelId = "1394028954527989934";
    const boostChannel = newMember.guild.channels.cache.get(boostChannelId);

    if (boostChannel) {
      const boostEmbed = new EmbedBuilder()
        .setTitle("💎 ¡Nuevo Boost!")
        .setDescription(
          `${newMember} acaba de boostear VK Community!\n\n¡Gracias por apoyar nuestra comunidad! 👑`,
        )
        .setColor("#ff73fa")
        .setThumbnail(
          newMember.user.displayAvatarURL({ extension: "png", size: 256 }),
        )
        .setImage(
          "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3Z0d3J0b2Z0d2J3d3B2d2Z6a2Z1b3Z3d2Z3dGZ2d2Z3d2Z3/g9582DNuQppxC/giphy.gif",
        )
        .setFooter({ text: "Boosts VK Community" })
        .setTimestamp();

      await boostChannel.send({ embeds: [boostEmbed] });
    }
  }
});

// Sistema de autoroles con reacciones
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const { message, emoji } = reaction;
  const member = message.guild.members.cache.get(user.id);
  const logsChannelId = "1394028954527989939";
  const logsChannel = message.guild.channels.cache.get(logsChannelId);

  if (message.channel.id !== "1394028954527989933") return;

  let roleId = null;
  let roleName = "";

  // Mapeo de emojis a roles
  switch (emoji.name) {
    case "👤":
      roleId = "1394028954062553339";
      roleName = "Users";
      break;
    case "🚹":
      roleId = "1394028954062553338";
      roleName = "Boy";
      break;
    case "🚺":
      roleId = "1394028954062553337";
      roleName = "Girl";
      break;
    case "🇺🇸":
      roleId = "1394028954062553335";
      roleName = "English";
      break;
    case "🇪🇸":
      roleId = "1394028954062553336";
      roleName = "Español";
      break;
    case "1️⃣":
      roleId = "1394028954062553333";
      roleName = "16-17";
      break;
    case "2️⃣":
      roleId = "1394028954062553332";
      roleName = "18-19";
      break;
    case "3️⃣":
      roleId = "1394028954062553331";
      roleName = "20-21";
      break;
    case "4️⃣":
      roleId = "1394028954049839295";
      roleName = "22+";
      break;
  }

  if (roleId && member) {
    const role = message.guild.roles.cache.get(roleId);
    if (role) {
      try {
        await member.roles.add(role);

        // Log en canal de moderadores
        if (logsChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("✅ Autorol Añadido")
            .setDescription(
              `**${user.username}** obtuvo el rol **${roleName}**`,
            )
            .setColor("#00ff00")
            .setThumbnail(
              user.displayAvatarURL({ extension: "png", size: 128 }),
            )
            .setTimestamp();

          await logsChannel.send({ embeds: [logEmbed] });
        }
      } catch (error) {
        console.error(`Error añadiendo rol: ${error}`);
      }
    }
  }
});

// Quitar roles cuando se quita la reacción
client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  const { message, emoji } = reaction;
  const member = message.guild.members.cache.get(user.id);
  const logsChannelId = "1394028954527989939";
  const logsChannel = message.guild.channels.cache.get(logsChannelId);

  if (message.channel.id !== "1394028954527989933") return;

  let roleId = null;
  let roleName = "";

  // Mapeo de emojis a roles
  switch (emoji.name) {
    case "👤":
      roleId = "1394028954062553339";
      roleName = "Users";
      break;
    case "🚹":
      roleId = "1394028954062553338";
      roleName = "Boy";
      break;
    case "🚺":
      roleId = "1394028954062553337";
      roleName = "Girl";
      break;
    case "🇺🇸":
      roleId = "1394028954062553335";
      roleName = "English";
      break;
    case "🇪🇸":
      roleId = "1394028954062553336";
      roleName = "Español";
      break;
    case "1️⃣":
      roleId = "1394028954062553333";
      roleName = "16-17";
      break;
    case "2️⃣":
      roleId = "1394028954062553332";
      roleName = "18-19";
      break;
    case "3️⃣":
      roleId = "1394028954062553331";
      roleName = "20-21";
      break;
    case "4️⃣":
      roleId = "1394028954049839295";
      roleName = "22+";
      break;
  }

  if (roleId && member) {
    const role = message.guild.roles.cache.get(roleId);
    if (role) {
      try {
        await member.roles.remove(role);

        // Log en canal de moderadores
        if (logsChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("❌ Autorol Removido")
            .setDescription(
              `**${user.username}** perdió el rol **${roleName}**`,
            )
            .setColor("#ff0000")
            .setThumbnail(
              user.displayAvatarURL({ extension: "png", size: 128 }),
            )
            .setTimestamp();

          await logsChannel.send({ embeds: [logEmbed] });
        }
      } catch (error) {
        console.error(`Error removiendo rol: ${error}`);
      }
    }
  }
});

// Log de mensajes eliminados
client.on("messageDelete", async (message) => {
  if (message.author?.bot) return;

  const logsChannelId = "1394028954527989939";
  const logsChannel = message.guild?.channels.cache.get(logsChannelId);

  if (logsChannel && message.content) {
    const logEmbed = new EmbedBuilder()
      .setTitle("🗑️ Mensaje Eliminado")
      .setDescription(
        `**Canal:** ${message.channel}\n**Autor:** ${message.author}\n**Contenido:** ${message.content}`,
      )
      .setColor("#ff6b6b")
      .setTimestamp();

    await logsChannel.send({ embeds: [logEmbed] });
  }
});

// Manejo de comandos slash
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    switch (commandName) {
      case "ping":
        const ping = client.ws.ping;
        const embed = new EmbedBuilder()
          .setTitle("🏓 Pong!")
          .addFields(
            { name: "📡 Latencia del bot", value: `${ping}ms`, inline: true },
            {
              name: "⏱️ Latencia de la API",
              value: `${Date.now() - interaction.createdTimestamp}ms`,
              inline: true,
            },
            {
              name: "🟢 Estado",
              value:
                ping < 100 ? "Excelente" : ping < 200 ? "Bueno" : "Regular",
              inline: true,
            },
          )
          .setColor(ping < 100 ? "#00ff00" : ping < 200 ? "#ffff00" : "#ff0000")
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;

      case "ban":
        const userToBan = interaction.options.getUser("usuario");
        const banReason =
          interaction.options.getString("razon") || "Sin razón especificada";

        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.BanMembers,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos para banear usuarios.",
            ephemeral: true,
          });
        }

        const memberToBan = interaction.guild.members.cache.get(userToBan.id);
        if (!memberToBan) {
          return interaction.reply({
            content: "❌ Usuario no encontrado en el servidor.",
            ephemeral: true,
          });
        }

        try {
          await memberToBan.ban({ reason: banReason });
          const banEmbed = new EmbedBuilder()
            .setTitle("🔨 Usuario Baneado")
            .setColor("#e74c3c")
            .addFields(
              { name: "👤 Usuario", value: `${userToBan.tag}`, inline: true },
              {
                name: "🛡️ Moderador",
                value: `${interaction.user.tag}`,
                inline: true,
              },
              { name: "📝 Razón", value: banReason, inline: false },
            )
            .setThumbnail(
              userToBan.displayAvatarURL({ extension: "png", size: 256 }),
            )
            .setTimestamp();
          await interaction.reply({ embeds: [banEmbed] });
        } catch (error) {
          await interaction.reply({
            content: "❌ Error al banear al usuario.",
            ephemeral: true,
          });
        }
        break;

      case "kick":
        const userToKick = interaction.options.getUser("usuario");
        const kickReason =
          interaction.options.getString("razon") || "Sin razón especificada";

        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.KickMembers,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos para expulsar usuarios.",
            ephemeral: true,
          });
        }

        const memberToKick = interaction.guild.members.cache.get(userToKick.id);
        if (!memberToKick) {
          return interaction.reply({
            content: "❌ Usuario no encontrado en el servidor.",
            ephemeral: true,
          });
        }

        try {
          await memberToKick.kick(kickReason);
          const kickEmbed = new EmbedBuilder()
            .setTitle("👢 Usuario Expulsado")
            .setColor("#f39c12")
            .addFields(
              { name: "👤 Usuario", value: `${userToKick.tag}`, inline: true },
              {
                name: "🛡️ Moderador",
                value: `${interaction.user.tag}`,
                inline: true,
              },
              { name: "📝 Razón", value: kickReason, inline: false },
            )
            .setThumbnail(
              userToKick.displayAvatarURL({ extension: "png", size: 256 }),
            )
            .setTimestamp();
          await interaction.reply({ embeds: [kickEmbed] });
        } catch (error) {
          await interaction.reply({
            content: "❌ Error al expulsar al usuario.",
            ephemeral: true,
          });
        }
        break;

      case "mute":
        const userToMute = interaction.options.getUser("usuario");
        const muteTime = interaction.options.getString("tiempo");
        const muteReason =
          interaction.options.getString("razon") || "Sin razón especificada";

        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.ModerateMembers,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos para mutear usuarios.",
            ephemeral: true,
          });
        }

        if (!/^\d+[smhd]$/.test(muteTime)) {
          return interaction.reply({
            content:
              "❌ Formato de tiempo inválido. Usa: `10s`, `5m`, `2h`, `1d`",
            ephemeral: true,
          });
        }

        const timeUnit = muteTime.slice(-1);
        const timeValue = parseInt(muteTime.slice(0, -1));
        let milliseconds;

        switch (timeUnit) {
          case "s":
            milliseconds = timeValue * 1000;
            break;
          case "m":
            milliseconds = timeValue * 60 * 1000;
            break;
          case "h":
            milliseconds = timeValue * 60 * 60 * 1000;
            break;
          case "d":
            milliseconds = timeValue * 24 * 60 * 60 * 1000;
            break;
        }

        const memberToMute = interaction.guild.members.cache.get(userToMute.id);
        try {
          await memberToMute.timeout(milliseconds, muteReason);
          const muteEmbed = new EmbedBuilder()
            .setTitle("🔇 Usuario Muteado")
            .setColor("#e74c3c")
            .addFields(
              { name: "👤 Usuario", value: `${userToMute.tag}`, inline: true },
              {
                name: "🛡️ Moderador",
                value: `${interaction.user.tag}`,
                inline: true,
              },
              { name: "⏰ Duración", value: muteTime, inline: true },
              { name: "📝 Razón", value: muteReason, inline: false },
            )
            .setThumbnail(
              userToMute.displayAvatarURL({ extension: "png", size: 256 }),
            )
            .setTimestamp();
          await interaction.reply({ embeds: [muteEmbed] });
        } catch (error) {
          await interaction.reply({
            content: "❌ Error al mutear al usuario.",
            ephemeral: true,
          });
        }
        break;

      case "clear":
        const amount = interaction.options.getInteger("cantidad");

        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.ManageMessages,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos para gestionar mensajes.",
            ephemeral: true,
          });
        }

        try {
          await interaction.channel.bulkDelete(amount, true);
          const clearEmbed = new EmbedBuilder()
            .setDescription(`🧹 Se han eliminado **${amount}** mensajes.`)
            .setColor("#2ecc71");
          await interaction.reply({ embeds: [clearEmbed], ephemeral: true });
        } catch (error) {
          await interaction.reply({
            content: "❌ Error al eliminar mensajes.",
            ephemeral: true,
          });
        }
        break;

      case "skin":
        const username = interaction.options.getString("usuario");

        if (!/^[a-zA-Z0-9_]{1,16}$/.test(username)) {
          return interaction.reply({
            content: "❌ Nombre inválido. Debe tener entre 1-16 caracteres.",
            ephemeral: true,
          });
        }

        await interaction.deferReply();

        try {
          const response = await axios.get(
            `https://api.mojang.com/users/profiles/minecraft/${username}`,
            {
              timeout: 10000,
            },
          );

          if (response.status === 204 || !response.data) {
            const errorEmbed = new EmbedBuilder()
              .setColor("#e74c3c")
              .setDescription(
                "❌ **Usuario no encontrado**\nEste usuario de Minecraft no existe.",
              );
            return interaction.editReply({ embeds: [errorEmbed] });
          }

          const playerData = response.data;
          const uuid = playerData.id;
          const realUsername = playerData.name;

          const skinUrl = `https://crafatar.com/renders/body/${uuid}?size=512&overlay`;
          const avatarUrl = `https://crafatar.com/avatars/${uuid}?size=256&overlay`;

          const embed = new EmbedBuilder()
            .setTitle(`🧱 Skin de ${realUsername}`)
            .setDescription(`**UUID:** \`${uuid}\``)
            .setImage(skinUrl)
            .setThumbnail(avatarUrl)
            .setColor("#2ecc71")
            .setFooter({ text: "Powered by Crafatar & Mojang API" })
            .addFields(
              { name: "👤 Usuario", value: realUsername, inline: true },
              { name: "🎮 Plataforma", value: "Minecraft Java", inline: true },
              {
                name: "🆔 UUID",
                value: `\`${uuid.substring(0, 8)}...\``,
                inline: true,
              },
            )
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setURL(`https://namemc.com/profile/${uuid}`)
              .setLabel("Ver en NameMC")
              .setStyle(ButtonStyle.Link)
              .setEmoji("🔗"),
          );

          await interaction.editReply({ embeds: [embed], components: [row] });
        } catch (error) {
          const fallbackSkinUrl = `https://mc-heads.net/body/${username}/512`;
          const fallbackAvatarUrl = `https://mc-heads.net/avatar/${username}/128`;

          const embed = new EmbedBuilder()
            .setTitle(`🧱 Skin de ${username}`)
            .setDescription("⚠️ **Usando API alternativa**")
            .setImage(fallbackSkinUrl)
            .setThumbnail(fallbackAvatarUrl)
            .setColor("#f39c12")
            .setFooter({ text: "API alternativa - MC-Heads" });

          await interaction.editReply({ embeds: [embed] });
        }
        break;

      case "afk":
        const afkReason =
          interaction.options.getString("razon") || "Sin razón especificada";
        const timestamp = new Date().toISOString();

        db.run(
          `INSERT OR REPLACE INTO afk_users (user_id, reason, timestamp) VALUES (?, ?, ?)`,
          [interaction.user.id, afkReason, timestamp],
        );

        const afkEmbed = new EmbedBuilder()
          .setTitle("💤 Modo AFK Activado")
          .setDescription(`**${interaction.user.username}** ahora está AFK`)
          .addFields(
            { name: "📝 Razón", value: afkReason, inline: true },
            {
              name: "⏰ Desde",
              value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              inline: true,
            },
          )
          .setColor("#f39c12")
          .setThumbnail(
            interaction.user.displayAvatarURL({ extension: "png", size: 256 }),
          )
          .setTimestamp();

        await interaction.reply({ embeds: [afkEmbed] });
        break;

      case "anuncio":
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos de administrador.",
            ephemeral: true,
          });
        }

        if (interaction.channel.id !== "1394028954527989940") {
          return interaction.reply({
            content:
              "❌ Este comando solo funciona en el canal de administración.",
            ephemeral: true,
          });
        }

        const titulo = interaction.options.getString("titulo");
        const descripcion = interaction.options.getString("descripcion");
        const imagen = interaction.options.getString("imagen");

        const anuncioChannel = interaction.guild.channels.cache.get(
          "1394030709856800788",
        );

        if (anuncioChannel) {
          const anuncioEmbed = new EmbedBuilder()
            .setTitle(`📢 ${titulo}`)
            .setDescription(descripcion)
            .setColor("#9966ff")
            .setFooter({ text: "Anuncio oficial - VK Community" })
            .setTimestamp();

          if (imagen && imagen.startsWith("http")) {
            try {
              anuncioEmbed.setImage(imagen);
            } catch (error) {
              console.error("Error setting image in slash anuncio:", error);
            }
          }

          await anuncioChannel.send({ embeds: [anuncioEmbed] });
          await interaction.reply({
            content: "✅ Anuncio enviado correctamente.",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "❌ Canal de anuncios no encontrado.",
            ephemeral: true,
          });
        }
        break;

      case "poll":
        const question = interaction.options.getString("pregunta");
        const optionsStr = interaction.options.getString("opciones");
        const options = optionsStr
          .split(",")
          .map((opt) => opt.trim())
          .slice(0, 10);

        if (options.length < 2) {
          return interaction.reply({
            content:
              "❌ Necesitas al menos 2 opciones para crear una encuesta.",
            ephemeral: true,
          });
        }

        const pollEmbed = new EmbedBuilder()
          .setTitle("📊 Encuesta")
          .setDescription(
            `**${question}**\n\n${options.map((opt, index) => `${index + 1}️⃣ ${opt}`).join("\n")}`,
          )
          .setColor("#3498db")
          .setFooter({
            text: `Encuesta creada por ${interaction.user.username}`,
          })
          .setTimestamp();

        const pollMessage = await interaction.reply({
          embeds: [pollEmbed],
          fetchReply: true,
        });

        const emojis = [
          "1️⃣",
          "2️⃣",
          "3️⃣",
          "4️⃣",
          "5️⃣",
          "6️⃣",
          "7️⃣",
          "8️⃣",
          "9️⃣",
          "🔟",
        ];
        for (let i = 0; i < options.length; i++) {
          await pollMessage.react(emojis[i]);
        }
        break;

      case "help":
        const usersRoleId = "1394028954062553339";
        const hasUsersRole = interaction.member.roles.cache.has(usersRoleId);
        const hasModRole = interaction.member.permissions.has(
          PermissionsBitField.Flags.ModerateMembers,
        );

        const helpEmbed = new EmbedBuilder()
          .setTitle("📚 Lista de Comandos")
          .setDescription("Aquí tienes los comandos disponibles para ti:")
          .setColor("#9966ff")
          .setThumbnail(
            client.user.displayAvatarURL({ extension: "png", size: 256 }),
          )
          .setFooter({ text: `Prefix: ${prefix} | Usa / para comandos slash` })
          .setTimestamp();

        if (hasModRole) {
          // Mostrar todos los comandos para moderadores
          helpEmbed.addFields(
            {
              name: "🛡️ **Moderación (Slash)**",
              value:
                "`/ban` - Banear usuario\n`/kick` - Expulsar usuario\n`/mute` - Mutear usuario\n`/clear` - Limpiar mensajes",
              inline: false,
            },
            {
              name: "🎫 **Tickets (Slash)**",
              value:
                "`/paneltickets` - Enviar panel\n`/tickets` - Ver tickets abiertos\n`/closeticket` - Cerrar ticket\n`/adduser` - Añadir usuario\n`/removeuser` - Remover usuario\n`/assignticket` - Asignar ticket\n`/ticketpriority` - Cambiar prioridad\n`/ticketstats` - Ver estadísticas\n`/renameticket` - Renombrar ticket",
              inline: false,
            },
            {
              name: "📢 **Administración**",
              value: "`/anuncio` - Crear anuncios oficiales",
              inline: false,
            },
            {
              name: "🎮 **Divertidos**",
              value:
                "`vkhola` - Saludo\n`vkchiste` - Chiste random\n`vkmoneda` - Lanzar moneda\n`vkdado` - Lanzar dado\n`vkinsulto` - Insulto creativo\n`vkfacha` - Medidor de facha\n`vkafk` - Modo AFK",
              inline: false,
            },
            {
              name: "🧱 **Minecraft**",
              value: "`/skin` - Ver skin de Minecraft",
              inline: false,
            },
            {
              name: "🔧 **Utilidad**",
              value:
                "`/ping` - Latencia del bot\n`/afk` - Modo AFK\n`/poll` - Crear encuesta",
              inline: false,
            },
            {
              name: "🛠️ **Moderación (Texto)**",
              value:
                "`vkwarn <@usuario> <razón>` - Advertir usuario\n`vkwarnings <@usuario>` - Ver advertencias\n`vkresetwarns <@usuario>` - Limpiar advertencias",
              inline: false,
            },
          );
        } else if (hasUsersRole) {
          // Mostrar solo comandos básicos para usuarios con rol Users
          helpEmbed.addFields(
            {
              name: "🎮 **Comandos Divertidos**",
              value:
                "`vkhola` - Saludo\n`vkchiste` - Chiste random\n`vkmoneda` - Lanzar moneda\n`vkdado` - Lanzar dado\n`vkinsulto` - Insulto creativo\n`vkfacha` - Medidor de facha\n`vkafk` - Modo AFK",
              inline: false,
            },
            {
              name: "🧱 **Minecraft**",
              value: "`/skin` - Ver skin de Minecraft",
              inline: false,
            },
            {
              name: "🔧 **Utilidad**",
              value:
                "`/ping` - Latencia del bot\n`/afk` - Modo AFK\n`/poll` - Crear encuesta",
              inline: false,
            },
          );
        } else {
          // Mostrar comandos básicos para usuarios sin roles específicos
          helpEmbed.addFields({
            name: "🔧 **Comandos Básicos**",
            value:
              "`/ping` - Latencia del bot\n`vkhola` - Saludo\n`vkchiste` - Chiste random\n\n⚠️ **Necesitas el rol de usuario para acceder a más comandos**\nVe al canal de autoroles para obtenerlo.",
            inline: false,
          });
        }

        await interaction.reply({ embeds: [helpEmbed] });
        break;

      // COMANDOS DE TICKETS
      case "tickets":
        if (
          !interaction.member.roles.cache.has(STAFF_ROLE_ID) &&
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos para ver la lista de tickets.",
            ephemeral: true,
          });
        }

        ticketsDb.all(
          `SELECT * FROM tickets WHERE status = 'abierto'`,
          [],
          (err, rows) => {
            if (err || !rows.length) {
              return interaction.reply({
                content: "📋 No hay tickets abiertos actualmente.",
                ephemeral: true,
              });
            }

            const ticketsEmbed = new EmbedBuilder()
              .setTitle("🎫 Tickets Abiertos")
              .setColor("#3498db")
              .setDescription(
                `Total de tickets abiertos: **${rows.length}**\n\n${rows.map((t) => `• <#${t.channel_id}> | <@${t.user_id}> | ${t.type} | Prioridad: ${t.priority || "normal"}`).join("\n")}`,
              )
              .setFooter({ text: "Sistema de tickets - VK Community" })
              .setTimestamp();

            interaction.reply({ embeds: [ticketsEmbed], ephemeral: true });
          },
        );
        break;

      case "paneltickets":
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator,
          )
        ) {
          return interaction.reply({
            content:
              "❌ Solo los administradores pueden enviar el panel de tickets.",
            ephemeral: true,
          });
        }

        const ticketsEmbed = new EmbedBuilder()
          .setTitle("🎫 Sistema de Tickets - VK Community")
          .setDescription(
            `
¡Bienvenido al sistema de tickets de VK Community!

Selecciona el tipo de consulta que tienes para crear un ticket privado donde nuestro staff te ayudará.

**📋 Tipos de tickets disponibles:**
🛠️ **Soporte Técnico** - Problemas técnicos
🚨 **Reportar Usuario** - Comportamiento inadecuado
💡 **Sugerencia** - Mejoras para el servidor
⚖️ **Apelación** - Apelar sanciones
🤝 **Partnership** - Colaboraciones
❓ **Otro** - Otras consultas

**⚠️ Normas importantes:**
• Solo puedes tener 1 ticket abierto a la vez
• Sé claro y específico con tu consulta
• Respeta al staff y otros usuarios
• No abuses del sistema de tickets`,
          )
          .setColor("#5865F2")
          .setThumbnail(
            interaction.guild.iconURL({ extension: "png", size: 256 }),
          )
          .setFooter({ text: "VK Community - Sistema de Tickets" })
          .setTimestamp();

        const selectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("ticket_select")
            .setPlaceholder("🎫 Selecciona el tipo de ticket")
            .addOptions(
              TICKET_TYPES.map((t) => ({
                label: t.label,
                value: t.id,
                emoji: t.emoji,
                description: t.description,
              })),
            ),
        );

        await interaction.channel.send({
          embeds: [ticketsEmbed],
          components: [selectMenu],
        });
        return interaction.reply({
          content: "✅ Panel de tickets enviado correctamente.",
          ephemeral: true,
        });

      case "closeticket":
        if (
          !interaction.member.roles.cache.has(STAFF_ROLE_ID) &&
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos para cerrar tickets.",
            ephemeral: true,
          });
        }

        if (!interaction.channel.name.startsWith("ticket-")) {
          return interaction.reply({
            content:
              "❌ Este comando solo se puede usar en canales de tickets.",
            ephemeral: true,
          });
        }

        const closeReason =
          interaction.options.getString("razon") || "Cerrado por staff";

        // Cerrar ticket manualmente
        await closeTicket(
          interaction.channel,
          interaction.user,
          closeReason,
          ticketsDb,
        );
        await interaction.reply({
          content: "✅ Ticket cerrado correctamente.",
          ephemeral: true,
        });
        break;

      case "adduser":
        if (
          !interaction.member.roles.cache.has(STAFF_ROLE_ID) &&
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos para gestionar tickets.",
            ephemeral: true,
          });
        }

        if (!interaction.channel.name.startsWith("ticket-")) {
          return interaction.reply({
            content:
              "❌ Este comando solo se puede usar en canales de tickets.",
            ephemeral: true,
          });
        }

        const userToAdd = interaction.options.getUser("usuario");
        const memberToAdd = interaction.guild.members.cache.get(userToAdd.id);

        try {
          await interaction.channel.permissionOverwrites.edit(userToAdd.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true,
          });

          const addEmbed = new EmbedBuilder()
            .setTitle("✅ Usuario Añadido")
            .setDescription(
              `${userToAdd} ha sido añadido al ticket por ${interaction.user}`,
            )
            .setColor("#2ecc71")
            .setTimestamp();

          await interaction.reply({ embeds: [addEmbed] });
        } catch (error) {
          await interaction.reply({
            content: "❌ Error al añadir usuario al ticket.",
            ephemeral: true,
          });
        }
        break;

      case "removeuser":
        if (
          !interaction.member.roles.cache.has(STAFF_ROLE_ID) &&
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos para gestionar tickets.",
            ephemeral: true,
          });
        }

        if (!interaction.channel.name.startsWith("ticket-")) {
          return interaction.reply({
            content:
              "❌ Este comando solo se puede usar en canales de tickets.",
            ephemeral: true,
          });
        }

        const userToRemove = interaction.options.getUser("usuario");

        try {
          await interaction.channel.permissionOverwrites.edit(userToRemove.id, {
            ViewChannel: false,
          });

          const removeEmbed = new EmbedBuilder()
            .setTitle("❌ Usuario Removido")
            .setDescription(
              `${userToRemove} ha sido removido del ticket por ${interaction.user}`,
            )
            .setColor("#e74c3c")
            .setTimestamp();

          await interaction.reply({ embeds: [removeEmbed] });
        } catch (error) {
          await interaction.reply({
            content: "❌ Error al remover usuario del ticket.",
            ephemeral: true,
          });
        }
        break;

      case "assignticket":
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos para asignar tickets.",
            ephemeral: true,
          });
        }

        if (!interaction.channel.name.startsWith("ticket-")) {
          return interaction.reply({
            content:
              "❌ Este comando solo se puede usar en canales de tickets.",
            ephemeral: true,
          });
        }

        const staffToAssign = interaction.options.getUser("staff");

        ticketsDb.run(
          `UPDATE tickets SET assigned_to = ? WHERE channel_id = ?`,
          [staffToAssign.id, interaction.channel.id],
          (err) => {
            if (err) {
              return interaction.reply({
                content: "❌ Error al asignar ticket.",
                ephemeral: true,
              });
            }

            const assignEmbed = new EmbedBuilder()
              .setTitle("📌 Ticket Asignado")
              .setDescription(
                `Este ticket ha sido asignado a ${staffToAssign} por ${interaction.user}`,
              )
              .setColor("#3498db")
              .setTimestamp();

            interaction.reply({ embeds: [assignEmbed] });
          },
        );
        break;

      case "ticketpriority":
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos para cambiar la prioridad.",
            ephemeral: true,
          });
        }

        if (!interaction.channel.name.startsWith("ticket-")) {
          return interaction.reply({
            content:
              "❌ Este comando solo se puede usar en canales de tickets.",
            ephemeral: true,
          });
        }

        const newPriority = interaction.options.getString("prioridad");
        const priorityColors = {
          baja: "#95a5a6",
          normal: "#3498db",
          alta: "#f39c12",
          urgente: "#e74c3c",
        };

        ticketsDb.run(
          `UPDATE tickets SET priority = ? WHERE channel_id = ?`,
          [newPriority, interaction.channel.id],
          (err) => {
            if (err) {
              return interaction.reply({
                content: "❌ Error al cambiar prioridad.",
                ephemeral: true,
              });
            }

            const priorityEmbed = new EmbedBuilder()
              .setTitle("⚡ Prioridad Actualizada")
              .setDescription(
                `La prioridad del ticket ha sido cambiada a **${newPriority.toUpperCase()}** por ${interaction.user}`,
              )
              .setColor(priorityColors[newPriority])
              .setTimestamp();

            interaction.reply({ embeds: [priorityEmbed] });
          },
        );
        break;

      case "ticketstats":
        if (
          !interaction.member.roles.cache.has(STAFF_ROLE_ID) &&
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator,
          )
        ) {
          return interaction.reply({
            content: "❌ No tienes permisos para ver estadísticas.",
            ephemeral: true,
          });
        }

        ticketsDb.all(`SELECT * FROM tickets`, [], (err, allTickets) => {
          if (err)
            return interaction.reply({
              content: "❌ Error al obtener estadísticas.",
              ephemeral: true,
            });

                    const openTickets = allTickets.filter((t) => t.status === "abierto");
                    const closedTickets = allTickets.filter(
                      (t) => t.status === "cerrado",
                    );
                    const todayTickets = allTickets.filter((t) => {
                      const ticketDate = new Date(t.created_at);
                      const today = new Date();
                      return ticketDate.toDateString() === today.toDateString();
                    });

                    const statsEmbed = new EmbedBuilder()
                      .setTitle("📊 Estadísticas de Tickets")
                      .setColor("#3498db")
                      .addFields(
                        {
                          name: "🟢 Tickets Abiertos",
                          value: `${openTickets.length}`,
                          inline: true,
                        },
                        {
                          name: "🔴 Tickets Cerrados",
                          value: `${closedTickets.length}`,
                          inline: true,
                        },
                        {
                          name: "📅 Tickets de Hoy",
                          value: `${todayTickets.length}`,
                          inline: true,
                        },
                        {
                          name: "📈 Total de Tickets",
                          value: `${allTickets.length}`,
                          inline: true,
                        },
                        {
                          name: "📊 Tipos más comunes",
                          value: `
          ${TICKET_TYPES.map((type) => {
            const count = allTickets.filter((t) => t.type === type.id).length;
            return `${type.emoji} ${type.label}: ${count}`;
          })
            .slice(0, 3)
            .join("\n")}`,
                          inline: false,
                        },
                      )
                      .setFooter({ text: "Estadísticas del sistema de tickets" })
                      .setTimestamp();

                    interaction.reply({ embeds: [statsEmbed], ephemeral: true });
                  });
                  break;

                case "renameticket":
                  if (
                    !interaction.member.roles.cache.has(STAFF_ROLE_ID) &&
                    !interaction.member.permissions.has(
                      PermissionsBitField.Flags.Administrator,
                    )
                  ) {
                    return interaction.reply({
                      content: "❌ No tienes permisos para renombrar tickets.",
                      ephemeral: true,
                    });
                  }

                  if (!interaction.channel.name.startsWith("ticket-")) {
                    return interaction.reply({
                      content:
                        "❌ Este comando solo se puede usar en canales de tickets.",
                      ephemeral: true,
                    });
                  }

                  const newName = interaction.options
                    .getString("nombre")
                    .toLowerCase()
                    .replace(/[^a-z0-9\-]/g, "");

                  try {
                    await interaction.channel.setName(`ticket-${newName}`);

                    const renameEmbed = new EmbedBuilder()
                      .setTitle("📝 Ticket Renombrado")
                      .setDescription(
                        `El ticket ha sido renombrado a **ticket-${newName}** por ${interaction.user}`,
                      )
                      .setColor("#9b59b6")
                      .setTimestamp();

                    await interaction.reply({ embeds: [renameEmbed] });
                  } catch (error) {
                    await interaction.reply({
                      content: "❌ Error al renombrar el ticket.",
                      ephemeral: true,
                    });
                  }
                  break;

                case "userinfo":
                  const userinfoTargetUser =
                    interaction.options.getUser("usuario") || interaction.user;
                  const targetMember = interaction.guild.members.cache.get(userinfoTargetUser.id);

                  if (!targetMember) {
                    return interaction.reply({
                      content: "❌ Usuario no encontrado en el servidor.",
                      ephemeral: true,
                    });
                  }

                  const roles =
                    targetMember.roles.cache
                      .filter((role) => role.name !== "@everyone")
                      .map((role) => role.name)
                      .join(", ") || "Sin roles";

                  const userEmbed = new EmbedBuilder()
                    .setTitle(`👤 Información de ${userinfoTargetUser.username}`)
                    .setColor("#3498db")
                    .setThumbnail(
                      userinfoTargetUser.displayAvatarURL({ extension: "png", size: 256 }),
                    )
                    .addFields(
                      { name: "🆔 ID", value: userinfoTargetUser.id, inline: true },
                      {
                        name: "📅 Cuenta creada",
                        value: `<t:${Math.floor(userinfoTargetUser.createdTimestamp / 1000)}:F>`,
                        inline: true,
                      },
                      {
                        name: "📥 Se unió al servidor",
                        value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:F>`,
                        inline: true,
                      },
                      { name: "🎭 Roles", value: roles, inline: false },
                      {
                        name: "🤖 Bot",
                        value: userinfoTargetUser.bot ? "Sí" : "No",
                        inline: true,
                      },
                      {
                        name: "🟢 Estado",
                        value: targetMember.presence?.status || "Desconocido",
                        inline: true,
                      },
                    )
                    .setTimestamp();

                  await interaction.reply({ embeds: [userEmbed] });
                  break;

                case "serverinfo":
                  const guild = interaction.guild;
                  const owner = await guild.fetchOwner();

                  const serverEmbed = new EmbedBuilder()
                    .setTitle(`📊 Información de ${guild.name}`)
                    .setColor("#9966ff")
                    .setThumbnail(guild.iconURL({ extension: "png", size: 256 }))
                    .addFields(
                      { name: "🆔 ID del servidor", value: guild.id, inline: true },
                      {
                        name: "👑 Propietario",
                        value: owner.user.username,
                        inline: true,
                      },
                      {
                        name: "📅 Creado",
                        value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                        inline: true,
                      },
                      {
                        name: "👥 Miembros",
                        value: `${guild.memberCount}`,
                        inline: true,
                      },
                      {
                        name: "🤖 Bots",
                        value: `${guild.members.cache.filter((m) => m.user.bot).size}`,
                        inline: true,
                      },
                      {
                        name: "📺 Canales",
                        value: `${guild.channels.cache.size}`,
                        inline: true,
                      },
                      {
                        name: "🎭 Roles",
                        value: `${guild.roles.cache.size}`,
                        inline: true,
                      },
                      {
                        name: "💎 Boosts",
                        value: `${guild.premiumSubscriptionCount || 0}`,
                        inline: true,
                      },
                      {
                        name: "🚀 Nivel de boost",
                        value: `${guild.premiumTier}`,
                        inline: true,
                      },
                    )
                    .setTimestamp();

                  await interaction.reply({ embeds: [serverEmbed] });
                  break;

                // COMANDOS DE SORTEOS
                case "sorteo":
                  if (
                    !interaction.member.permissions.has(
                      PermissionsBitField.Flags.Administrator,
                    )
                  ) {
                    return interaction.reply({
                      content: "❌ Solo administradores pueden crear sorteos.",
                      ephemeral: true,
                    });
                  }

                  const sorteoChannel = interaction.options.getChannel("canal");
                  const sorteoTitulo = interaction.options.getString("titulo");
                  const sorteoPatrocinador = interaction.options.getString("patrocinador");
                  const sorteoDuracion = interaction.options.getString("duracion");
                  const sorteoPremio = interaction.options.getString("premio");
                  const sorteoRol = interaction.options.getRole("rol");
                  const sorteoImagen = interaction.options.getString("imagen");

                  // Validar duración
                  if (!/^\d+[hd]$/.test(sorteoDuracion)) {
                    return interaction.reply({
                      content: "❌ Duración inválida. Usa formato `2h` o `1d`.",
                      ephemeral: true,
                    });
                  }

                  // Calcular tiempo finalización
                  let ms = 0;
                  if (/^\d+h$/.test(sorteoDuracion)) ms = parseInt(sorteoDuracion) * 60 * 60 * 1000;
                  else if (/^\d+d$/.test(sorteoDuracion)) ms = parseInt(sorteoDuracion) * 24 * 60 * 60 * 1000;

                  const finaliza = Date.now() + ms;

                  // Embed sorteo
                  const sorteoEmbed = new EmbedBuilder()
                    .setTitle(`🎉 Sorteo: ${sorteoTitulo}`)
                    .setDescription(
                      `**Patrocinador:** ${sorteoPatrocinador}\n**Premio:** ${sorteoPremio}\n**Rol requerido:** ${sorteoRol ? `<@&${sorteoRol.id}>` : "@everyone"}\n**Finaliza:** <t:${Math.floor(finaliza / 1000)}:R>\n\nReacciona con 🎉 para participar.`
                    )
                    .setColor("#ffb300")
                    .setFooter({ text: "Sorteo VK Community" })
                    .setTimestamp();

                  if (sorteoImagen && sorteoImagen.startsWith("http")) {
                    try {
                      sorteoEmbed.setImage(sorteoImagen);
                    } catch (error) {
                      console.error("Error setting image:", error);
                    }
                  }

                  const sorteoMsg = await sorteoChannel.send({
                    content: `@everyone ${sorteoRol ? `<@&${sorteoRol.id}>` : ""}`,
                    embeds: [sorteoEmbed],
                  });
                  await sorteoMsg.react("🎉");

                  // Guardar en DB
                  sorteosDb.run(
                    `INSERT INTO sorteos (channel_id, message_id, titulo, patrocinador, rol_requerido, finaliza, imagen, premio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [sorteoChannel.id, sorteoMsg.id, sorteoTitulo, sorteoPatrocinador, sorteoRol?.id || null, finaliza, sorteoImagen, sorteoPremio]
                  );

                  await interaction.reply({
                    content: "✅ Sorteo creado correctamente.",
                    ephemeral: true,
                  });

                  // Finalizar sorteo automáticamente
                  setTimeout(async () => {
                    try {
                      const msg = await sorteoChannel.messages.fetch(sorteoMsg.id);
                      const users = await msg.reactions.cache.get("🎉").users.fetch();
                      let participantes = Array.from(users.filter(u => !u.bot).values());

                      // Filtrar por rol si corresponde
                      if (sorteoRol) {
                        participantes = participantes.filter(u => {
                          const member = sorteoChannel.guild.members.cache.get(u.id);
                          return member && member.roles.cache.has(sorteoRol.id);
                        });
                      }

                      let ganador = participantes.length ? participantes[Math.floor(Math.random() * participantes.length)] : null;

                      // Actualizar DB
                      sorteosDb.run(`UPDATE sorteos SET ganador_id = ? WHERE message_id = ?`, [ganador?.id || null, sorteoMsg.id]);

                      // Borrar embed anterior
                      await msg.delete().catch(() => {});

                      // Nuevo embed de finalizado
                      const finalEmbed = new EmbedBuilder()
                        .setTitle("🎉 Sorteo Finalizado")
                        .setDescription(
                          ganador
                            ? `**Ganador:** <@${ganador.id}>\n**Premio:** ${sorteoPremio}\n**Patrocinador:** ${sorteoPatrocinador}`
                            : "No hubo participantes válidos."
                        )
                        .setColor("#43e97b")
                        .setFooter({ text: "Sorteo VK Community" })
                        .setTimestamp();

                      if (sorteoImagen && sorteoImagen.startsWith("http")) {
                        try {
                          finalEmbed.setImage(sorteoImagen);
                        } catch (error) {
                          console.error("Error setting final image:", error);
                        }
                      }

                      await sorteoChannel.send({ 
                        content: ganador ? `🎉 <@${ganador.id}> ¡Felicidades! Has ganado: **${sorteoPremio}**` : "@everyone", 
                        embeds: [finalEmbed] 
                      });
                    } catch (err) {
                      console.error("Error finalizando sorteo:", err);
                    }
                  }, ms);
                  break;

                case "sorteos":
                  sorteosDb.all(`SELECT * FROM sorteos ORDER BY id DESC LIMIT 10`, [], (err, rows) => {
                    if (err || !rows.length) {
                      return interaction.reply({
                        content: "No hay sorteos registrados.",
                        ephemeral: true,
                      });
                    }

                    const embed = new EmbedBuilder()
                      .setTitle("🎉 Historial de Sorteos")
                      .setColor("#ffb300")
                      .setDescription(
                        rows.map(s =>
                          `• **${s.titulo}** | Ganador: ${s.ganador_id ? `<@${s.ganador_id}>` : "Sin ganador"} | <t:${Math.floor(s.finaliza / 1000)}:F>`
                        ).join("\n")
                      )
                      .setFooter({ text: "VK Community - Sorteos" });

                    interaction.reply({ embeds: [embed], ephemeral: true });
                  });
                  break;

                // COMANDOS DE NIVELES
                case "level":
                  const levelTargetUser = interaction.options.getUser("usuario") || interaction.user;

                  levelsDb.get(`SELECT * FROM levels WHERE user_id = ?`, [levelTargetUser.id], async (err, row) => {
                    if (!row) {
                      return interaction.reply({
                        content: `${levelTargetUser.id === interaction.user.id ? "No tienes nivel aún" : `${levelTargetUser.username} no tiene nivel aún`}. ¡Empieza a participar!`,
                        ephemeral: true,
                      });
                    }

                    const Canvas = require("canvas");
                    const canvas = Canvas.createCanvas(600, 200);
                    const ctx = canvas.getContext("2d");

                    // Fondo
                    ctx.fillStyle = "#36393f";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Barra de progreso fondo
                    ctx.fillStyle = "#2f3136";
                    ctx.fillRect(150, 120, 400, 30);

                    // Barra de progreso
                    const nextLevelXp = row.level * 50 + 50;
                    const progress = Math.min(400, (row.xp / nextLevelXp) * 400);
                    ctx.fillStyle = "#5865F2";
                    ctx.fillRect(150, 120, progress, 30);

                    // Avatar
                    try {
                      const avatar = await Canvas.loadImage(levelTargetUser.displayAvatarURL({ extension: "png", size: 128 }));
                      ctx.save();
                      ctx.beginPath();
                      ctx.arc(75, 100, 60, 0, Math.PI * 2);
                      ctx.closePath();
                      ctx.clip();
                      ctx.drawImage(avatar, 15, 40, 120, 120);
                      ctx.restore();
                    } catch (error) {
                      console.error("Error loading avatar:", error);
                    }

                    // Texto
                    ctx.font = "bold 28px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(`${levelTargetUser.username}`, 150, 50);

                    ctx.font = "bold 24px Arial";
                    ctx.fillStyle = "#5865F2";
                    ctx.fillText(`Nivel ${row.level}`, 150, 85);

                    ctx.font = "18px Arial";
                    ctx.fillStyle = "#b9bbbe";
                    ctx.fillText(`${row.xp} / ${nextLevelXp} XP`, 150, 110);

                    // Porcentaje
                    ctx.font = "16px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(`${Math.round((row.xp / nextLevelXp) * 100)}%`, 480, 140);

                    const buffer = canvas.toBuffer("image/png");
                    const attachment = new AttachmentBuilder(buffer, { name: `level-${levelTargetUser.id}.png` });

                    await interaction.reply({ files: [attachment] });
                  });
                  break;

                case "leaderboard":
                  levelsDb.all(`SELECT * FROM levels ORDER BY level DESC, xp DESC LIMIT 10`, [], async (err, rows) => {
                    if (err || !rows.length) {
                      return interaction.reply({
                        content: "No hay datos de niveles aún.",
                        ephemeral: true,
                      });
                    }

                    const embed = new EmbedBuilder()
                      .setTitle("🏆 Tabla de Clasificación de Niveles")
                      .setColor("#ffd700")
                      .setDescription(
                        await Promise.all(rows.map(async (row, index) => {
                          try {
                            const user = await client.users.fetch(row.user_id);
                            const medal = index < 3 ? ["🥇", "🥈", "🥉"][index] : `${index + 1}.`;
                            return `${medal} **${user.username}** - Nivel ${row.level} (${row.xp} XP)`;
                          } catch (error) {
                            return `${index + 1}. Usuario desconocido - Nivel ${row.level} (${row.xp} XP)`;
                          }
                        })).then(descriptions => descriptions.join("\n"))
                      )
                      .setFooter({ text: "VK Community - Sistema de Niveles" })
                      .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                  });
                  break;

                // COMANDOS DE TUTORIALES
                case "tutorialmod":
                  if (
                    !interaction.member.roles.cache.has(STAFF_ROLE_ID) &&
                    !interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
                  ) {
                    return interaction.reply({
                      content: "❌ Este tutorial es solo para el staff.",
                      ephemeral: true,
                    });
                  }

                  const modTutorialEmbed = new EmbedBuilder()
                    .setTitle("🛡️ Tutorial - Comandos de Moderación")
                    .setDescription(
                      `
          **Comandos de Moderación Disponibles:**

          **🔨 Sanciones:**
          • \`vkmute @usuario 10m Spam\` - Mutear usuario
          • \`vkunmute @usuario\` - Desmutear usuario
          • \`vkban @usuario Comportamiento inadecuado\` - Banear usuario
          • \`vkkick @usuario Romper reglas\` - Expulsar usuario

          **⚠️ Advertencias:**
          • \`vkwarn @usuario Razón\` - Advertir usuario
          • \`vkwarnings @usuario\` - Ver advertencias
          • \`vkresetwarns @usuario\` - Limpiar advertencias

          **🧹 Limpieza:**
          • \`vkclear 50\` - Eliminar mensajes (1-100)

          **📊 Información:**
          • \`vkuserinfo @usuario\` - Información del usuario
          • \`vkserverinfo\` - Información del servidor

          **🎫 Tickets:**
          • \`/paneltickets\` - Enviar panel de tickets
          • \`/tickets\` - Ver tickets abiertos
          • \`/closeticket\` - Cerrar ticket
          • \`/adduser @usuario\` - Añadir usuario al ticket
          • \`/removeuser @usuario\` - Remover usuario del ticket
          • \`/assignticket @staff\` - Asignar ticket
          • \`/ticketpriority [prioridad]\` - Cambiar prioridad
          • \`/renameticket [nombre]\` - Renombrar ticket

          **Formatos de tiempo:**
          • \`s\` = segundos | \`m\` = minutos | \`h\` = horas | \`d\` = días
          • Ejemplo: \`10s\`, \`5m\`, \`2h\`, \`1d\``
                    )
                    .setColor("#e74c3c")
                    .setFooter({ text: "Sistema de moderación - VK Community" })
                    .setTimestamp();

                  await interaction.reply({ embeds: [modTutorialEmbed], ephemeral: true });
                  break;

                case "tutorialfun":
                  const funTutorialEmbed = new EmbedBuilder()
                    .setTitle("🎮 Tutorial - Comandos Divertidos")
                    .setDescription(
                      `
          **¡Comandos para divertirse en VK Community!**

          **🎭 Comandos Básicos:**
          • \`vkhola\` - Saludo personalizado
          • \`vkchiste\` - Chiste aleatorio
          • \`vkinsulto\` - Insulto creativo (sin ofender)

          **🎲 Juegos de Azar:**
          • \`vkmoneda\` - Lanzar moneda (cara o cruz)
          • \`vkdado\` - Lanzar dado (1-6)
          • \`vkfacha\` - Medidor de facha (%)

          **💤 Utilidades:**
          • \`vkafk [razón]\` - Activar modo AFK
          • \`/skin usuario\` - Ver skin de Minecraft
          • \`/ping\` - Latencia del bot

          **📊 Interactivos:**
          • \`/poll pregunta | opción1,opción2\` - Crear encuesta
          • \`/level\` - Ver tu nivel
          • \`/leaderboard\` - Tabla de clasificación

          **🆙 Sistema de Niveles:**
          • Gana XP escribiendo mensajes
          • Sube de nivel automáticamente
          • Compite en la tabla de clasificación

          ¡Prueba todos los comandos y diviértete! 🎉`
                    )
                    .setColor("#00ff00")
                    .setFooter({ text: "Comandos divertidos - VK Community" })
                    .setTimestamp();

                  await interaction.reply({ embeds: [funTutorialEmbed], ephemeral: true });
                  break;

                case "tutorialtickets":
                  if (
                    !interaction.member.roles.cache.has(STAFF_ROLE_ID) &&
                    !interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
                  ) {
                    return interaction.reply({
                      content: "❌ Este tutorial es solo para el staff.",
                      ephemeral: true,
                    });
                  }

                  const ticketsTutorialEmbed = new EmbedBuilder()
                    .setTitle("🎫 Tutorial - Sistema de Tickets")
                    .setDescription(
                      `
          **Sistema de Tickets VK Community**

          **📋 Comandos principales:**
          • \`/paneltickets\` - Enviar panel de tickets (solo admins)
          • \`/tickets\` - Ver lista de tickets abiertos
          • \`/closeticket [razón]\` - Cerrar ticket actual

          **👥 Gestión de usuarios:**
          • \`/adduser @usuario\` - Añadir usuario al ticket
          • \`/removeuser @usuario\` - Remover usuario del ticket

          **⚙️ Administración (solo admins):**
          • \`/assignticket @staff\` - Asignar ticket a staff
          • \`/ticketpriority [prioridad]\` - Cambiar prioridad
          • \`/renameticket [nombre]\` - Renombrar ticket

          **📊 Estadísticas:**
          • \`/ticketstats\` - Ver estadísticas del sistema

          **🔧 Tipos de tickets:**
          • 🛠️ Soporte Técnico
          • 🚨 Reportar Usuario  
          • 💡 Sugerencia
          • ⚖️ Apelación
          • 🤝 Partnership
          • ❓ Otro

          **⚠️ Normas:**
          • Un ticket por usuario
          • Ser respetuoso
          • Proporcionar información clara
          • No hacer spam de tickets`
                    )
                    .setColor("#5865F2")
                    .setFooter({ text: "Sistema de tickets - VK Community" })
                    .setTimestamp();

                  await interaction.reply({ embeds: [ticketsTutorialEmbed], ephemeral: true });
                  break;

                case "tutorialanuncios":
                  if (
                    !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
                  ) {
                    return interaction.reply({
                      content: "❌ Este tutorial es solo para administradores.",
                      ephemeral: true,
                    });
                  }

                  const anunciosTutorialEmbed = new EmbedBuilder()
                    .setTitle("📢 Tutorial - Sistema de Anuncios")
                    .setDescription(
                      `
          **¿Cómo usar el sistema de anuncios?**

          **Comando Slash:**
          \`/anuncio\`
          • Funciona desde cualquier canal
          • Interfaz amigable con opciones separadas
          • Siempre tagea @everyone automáticamente

          **Comando con Prefix:**
          \`vkanuncio #canal | título | descripción | imagen\`

          **Ejemplo:**
          \`vkanuncio #general | Evento Especial | Habrá un evento especial en VK Community a las 8:00 PM. ¡No te lo pierdas! | https://ejemplo.com/imagen.png\`

          **Características:**
          • Se puede enviar a cualquier canal especificado
          • Siempre tagea @everyone para máxima visibilidad
          • Imagen opcional
          • Formato profesional con embed
          • Solo administradores pueden usar estos comandos

          **Notas importantes:**
          • Usa \`|\` para separar las partes en el comando prefix
          • La imagen debe ser una URL válida
          • El anuncio se envía automáticamente al canal especificado`
                    )
                    .setColor("#9966ff")
                    .setFooter({ text: "Sistema de anuncios - VK Community" })
                    .setTimestamp();

                  await interaction.reply({ embeds: [anunciosTutorialEmbed], ephemeral: true });
                  break;

                case "tutorialsorteos":
                  if (
                    !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
                  ) {
                    return interaction.reply({
                      content: "❌ Este tutorial es solo para administradores.",
                      ephemeral: true,
                    });
                  }

                  const sorteosTutorialEmbed = new EmbedBuilder()
                    .setTitle("🎉 Tutorial - Sistema de Sorteos")
                    .setDescription(
                      `
          **¿Cómo crear sorteos automáticos?**

          **Comando Slash:**
          \`/sorteo\`
          • Interfaz fácil de usar
          • Opciones separadas y claras
          • Finalización automática

          **Comando con Prefix:**
          \`vksorteo canalID | título | patrocinador | rol | duración | imagen | premio\`

          **Ejemplo:**
          \`vksorteo #sorteos | Discord Nitro | VK Team | @Members | 2h | https://ejemplo.com/nitro.png | 1 mes de Discord Nitro\`

          **Parámetros:**
          • **Canal:** Donde se publicará el sorteo
          • **Título:** Nombre del sorteo
          • **Patrocinador:** Quien lo organiza
          • **Rol:** Rol requerido para participar (opcional)
          • **Duración:** 2h, 1d, etc.
          • **Imagen:** URL opcional para el embed
          • **Premio:** Descripción del premio

          **Características:**
          • Finalización automática
          • Selección aleatoria de ganador
          • Verificación de roles si se especifica
          • Historial con \`/sorteos\`
          • Reacción automática con 🎉

          **Duraciones válidas:**
          • \`1h\` = 1 hora
          • \`2d\` = 2 días
          • Solo se acepta formato número + h/d`
                    )
                    .setColor("#ffb300")
                    .setFooter({ text: "Sistema de sorteos - VK Community" })
                    .setTimestamp();

                  await interaction.reply({ embeds: [sorteosTutorialEmbed], ephemeral: true });
                  break;
              }
            }

            // SISTEMA DE TICKETS - SELECT MENU
            if (
              interaction.isStringSelectMenu() &&
              interaction.customId === "ticket_select"
            ) {
              const tipo = interaction.values[0];
              const userId = interaction.user.id;

              // Anti-spam: verificar cooldown
              if (ticketCooldown.has(userId)) {
                const timeLeft = Math.round(
                  (ticketCooldown.get(userId) - Date.now()) / 1000,
                );
                return interaction.reply({
                  content: `⏱️ Debes esperar ${timeLeft} segundos antes de crear otro ticket.`,
                  ephemeral: true,
                });
              }

              // Verificar si ya tiene un ticket abierto
              ticketsDb.get(
                `SELECT * FROM tickets WHERE user_id = ? AND status = 'abierto'`,
                [userId],
                async (err, row) => {
                  if (row) {
                    return interaction.reply({
                      content: `❌ Ya tienes un ticket abierto: <#${row.channel_id}>\nDebes cerrar tu ticket actual antes de crear uno nuevo.`,
                      ephemeral: true,
                    });
                  }

                  // Crear canal de ticket
                  const ticketName = `ticket-${tipo}-${interaction.user.username}`
                    .toLowerCase()
                    .replace(/[^a-z0-9\-]/g, "");

                  try {
                    const category =
                      interaction.guild.channels.cache.get(TICKETS_CATEGORY_ID);

                    if (!category || category.type !== ChannelType.GuildCategory) {
                      console.warn(
                        "⚠️ La categoría de tickets no existe o no es válida.",
                      );
                    }

                    const ticketChannel = await interaction.guild.channels.create({
                      name: ticketName,
                      type: ChannelType.GuildText,
                      parent: TICKETS_CATEGORY_ID || null,
                      permissionOverwrites: [
                        {
                          id: interaction.guild.id,
                          deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                          id: userId,
                          allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.AttachFiles,
                          ],
                        },
                        {
                          id: STAFF_ROLE_ID,
                          allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.ManageMessages,
                          ],
                        },
                        {
                          id: ADMIN_ROLE_ID,
                          allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.ManageMessages,
                          ],
                        },
                      ],
                    });

                    // Guardar en base de datos
                    ticketsDb.run(
                      `INSERT INTO tickets (user_id, channel_id, type, status, created_at, priority) VALUES (?, ?, ?, 'abierto', ?, 'normal')`,
                      [userId, ticketChannel.id, tipo, new Date().toISOString()],
                    );

                    // Mensaje de bienvenida
                    const welcomeEmbed = new EmbedBuilder()
                      .setTitle("🎫 Ticket Creado")
                      .setDescription(
                        `
          ¡Hola <@${userId}>! Tu ticket ha sido creado exitosamente.

          **📋 Tipo de consulta:** ${TICKET_TYPES.find((t) => t.id === tipo)?.label || tipo}

          **📝 Instrucciones:**
          • Describe tu consulta de manera clara y detallada
          • Un miembro del staff te atenderá lo antes posible
          • Puedes adjuntar imágenes o archivos si es necesario
          • Usa el botón 🔒 para cerrar el ticket cuando termines

          **⏰ Horario de atención:** 24/7 (respuesta en 1-24 horas)`,
                      )
                      .setColor("#5865F2")
                      .setThumbnail(
                        interaction.user.displayAvatarURL({
                          extension: "png",
                          size: 256,
                        }),
                      )
                      .setFooter({ text: "VK Community - Sistema de Tickets" })
                      .setTimestamp();

                    const closeButton = new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                        .setCustomId("close_ticket")
                        .setLabel("Cerrar Ticket")
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji("🔒"),
                    );

                    await ticketChannel.send({
                      content: `<@${userId}> <@&${STAFF_ROLE_ID}>`,
                      embeds: [welcomeEmbed],
                      components: [closeButton],
                    });

                    await interaction.reply({
                      content: `✅ Ticket creado exitosamente: ${ticketChannel}`,
                      ephemeral: true,
                    });

                    // Establecer cooldown
                    ticketCooldown.set(userId, Date.now() + 30000); // 30 segundos
                    setTimeout(() => ticketCooldown.delete(userId), 30000);

                    // Log de apertura
                    const logsChannel = interaction.guild.channels.cache.get(
                      TICKETS_LOGS_CHANNEL_ID,
                    );
                    if (logsChannel) {
                      const logEmbed = new EmbedBuilder()
                        .setTitle("🎫 Nuevo Ticket Abierto")
                        .setDescription(
                          `
          **Canal:** ${ticketChannel}
          **Usuario:** <@${userId}> (${interaction.user.tag})
          **Tipo:** ${TICKET_TYPES.find((t) => t.id === tipo)?.label || tipo}
          **ID del ticket:** ${ticketChannel.id}`,
                        )
                        .setColor("#2ecc71")
                        .setThumbnail(
                          interaction.user.displayAvatarURL({
                            extension: "png",
                            size: 256,
                          }),
                        )
                        .setTimestamp();

                      await logsChannel.send({ embeds: [logEmbed] });
                    }
                  } catch (error) {
                    console.error("Error creando ticket:", error);
                    await interaction.reply({
                      content:
                        "❌ Error al crear el ticket. Contacta a un administrador.",
                      ephemeral: true,
                    });
                  }
                },
              );
            }

            // BOTONES DE TICKETS
            if (interaction.isButton()) {
              if (interaction.customId === "close_ticket") {
                if (!interaction.channel.name.startsWith("ticket-")) {
                  return interaction.reply({
                    content: "❌ Este botón solo funciona en tickets.",
                    ephemeral: true,
                  });
                }

                const confirmRow = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId("confirm_close")
                    .setLabel("Confirmar Cierre")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("✅"),
                  new ButtonBuilder()
                    .setCustomId("cancel_close")
                    .setLabel("Cancelar")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("❌"),
                );

                const confirmEmbed = new EmbedBuilder()
                  .setTitle("🔒 Confirmar Cierre de Ticket")
                  .setDescription(
                    "¿Estás seguro de que quieres cerrar este ticket?\n\nEsta acción creará una transcripción y eliminará el canal.",
                  )
                  .setColor("#f39c12")
                  .setFooter({ text: "Esta acción no se puede deshacer" });

                await interaction.reply({
                  embeds: [confirmEmbed],
                  components: [confirmRow],
                  ephemeral: true,
                });
              }

              if (interaction.customId === "confirm_close") {
                await closeTicket(
                  interaction.channel,
                  interaction.user,
                  "Cerrado por el usuario",
                  ticketsDb,
                );
                await interaction.reply({
                  content: "✅ Ticket cerrado correctamente.",
                  ephemeral: true,
                });
              }

              if (interaction.customId === "cancel_close") {
                await interaction.reply({
                  content: "❌ Cierre de ticket cancelado.",
                  ephemeral: true,
                });
              }
            }
          });

          // Sistema AFK - detectar menciones
          client.on("messageCreate", async (message) => {
            if (message.author.bot || !message.guild) return;

            // Verificar menciones para usuarios AFK
            if (message.mentions.users.size > 0) {
              message.mentions.users.forEach((mentionedUser) => {
                db.get(
                  `SELECT * FROM afk_users WHERE user_id = ?`,
                  [mentionedUser.id],
                  (err, row) => {
                    if (err || !row) return;

                    const afkTime = new Date(row.timestamp);
                    const timeDiff = Date.now() - afkTime.getTime();
                    const timeStr =
                      Math.floor(timeDiff / 1000 / 60) > 60
                        ? `${Math.floor(timeDiff / 1000 / 60 / 60)}h ${Math.floor((timeDiff / 1000 / 60) % 60)}m`
                        : `${Math.floor(timeDiff / 1000 / 60)}m`;

                    const afkEmbed = new EmbedBuilder()
                      .setTitle("💤 Usuario AFK")
                      .setDescription(`**${mentionedUser.username}** está AFK`)
                      .addFields(
                        { name: "📝 Razón", value: row.reason, inline: true },
                        { name: "⏰ Desde hace", value: timeStr, inline: true },
                      )
                      .setColor("#f39c12")
                      .setThumbnail(
                        mentionedUser.displayAvatarURL({ extension: "png", size: 256 }),
                      )
                      .setTimestamp();

                    message.reply({ embeds: [afkEmbed] });
                  },
                );
              });
            }

            // Remover AFK si el usuario habla
            db.get(
              `SELECT * FROM afk_users WHERE user_id = ?`,
              [message.author.id],
              (err, row) => {
                if (err || !row) return;

                db.run(`DELETE FROM afk_users WHERE user_id = ?`, [message.author.id]);

                const backEmbed = new EmbedBuilder()
                  .setDescription(`👋 **${message.author.username}** ya no está AFK`)
                  .setColor("#2ecc71");

                message.channel.send({ embeds: [backEmbed] }).then((msg) => {
                  setTimeout(() => msg.delete().catch(() => {}), 5000);
                });
              },
            );

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const cmd = args.shift()?.toLowerCase();

            if (!message.content.startsWith(prefix)) return;

            // Comandos de texto
            if (cmd === "hola") {
              const saludos = [
                `¡Hola **${message.author.username}**! Bienvenido a VK Community 👑`,
                `¡Qué tal **${message.author.username}**! ¿Cómo estás hoy? 😊`,
                `¡Hey **${message.author.username}**! ¡Qué bueno verte por aquí! 🎉`,
                `¡Saludos **${message.author.username}**! ¡Espero que tengas un gran día! ☀️`,
                `¡Hola **${message.author.username}**! ¡Listo para divertirte en VK? 🚀`,
                `¡Buenos días/tardes **${message.author.username}**! ¡Que disfrutes tu estancia! 🌟`,
                `¡Hola **${message.author.username}**! ¡La comunidad se alegra de verte! 💜`,
                `¡Hey **${message.author.username}**! ¡Otro día increíble en VK Community! ⭐`,
                `¡Hola **${message.author.username}**! ¡Siempre es un placer saludarte! 🎭`,
                `¡Qué pasa **${message.author.username}**! ¡Listo para la diversión! 🎪`
              ];

              // Evitar repetir el último saludo usado
              let lastGreeting = message.channel.lastGreeting || -1;
              let randomIndex;
              do {
                randomIndex = Math.floor(Math.random() * saludos.length);
              } while (randomIndex === lastGreeting && saludos.length > 1);

              message.channel.lastGreeting = randomIndex;

              return message.channel.send(saludos[randomIndex]);
            }

            if (cmd === "chiste") {
              const chistes = [
              "Mi abuela siempre decía: 'Sigue tus sueños'… Por eso sigo durmiendo todo el día.",
              "Me dijeron: 'Piensa en los niños que no tienen comida'… Y ahora tengo miedo de que vengan por la mía.",
              "En la escuela me decían que no llegaría a nada… Y mira, aquí estoy, sin llegar a nada.",
              "Dicen que el trabajo duro nunca mató a nadie… Pero yo no pienso ser el primero.",
              "Mi suerte es tan mala… que si abro una galleta de la fortuna, seguro está vacía.",
              "Dicen que lo importante es participar… por eso siempre pierdo tranquilo.",
              "Mi vida social es como un cementerio… solo hay silencio y recuerdos.",
              "Me dijeron: 'Levántate y lucha'… y me caí otra vez.",
              "Siempre supe que nací para brillar… como los focos quemados.",
              "—¿Cómo te va en el amor? —Como en el examen… sabía todo hasta que empezó.",
              "Algunos nacen con estrella… yo nací con apagón.",
              "Mi vida está tan organizada… que hasta mis fracasos van en orden.",
              "Dicen que hay que ver el lado bueno… lástima que siempre me tapan la vista.",
              "Me dijeron que la esperanza es lo último que se pierde… por eso ya ni me molesto en buscarla.",
              "Mi motivación es como el Wi-Fi… Desaparece cuando más la necesito.",
              "El karma nunca me alcanza… Debe estar tan vago como yo.",
              "—Papá, ¿por qué nadie me quiere? —Porque ni yo te quiero.",
              "Siempre me dicen que mi humor es tan negro… que si cruza la calle, la policía lo detiene.",
              "—Doctor, tengo miedo de morir solo. —Tranquilo, la muerte nunca viene sola.",
              "Pedí un café sin azúcar… y me trajeron mi vida en una taza.",
              "Mi vida amorosa es como el Wi-Fi… solo se conecta cuando nadie lo usa.",
              "Le pedí a la vida una señal… y me mandó un recibo de luz.",
              "Dicen que todo llega a su tiempo… menos mi felicidad, parece que se perdió.",
              "¿Sabes cuál es mi meta en la vida? Sobrevivir al lunes.",
              "Dicen que el tiempo lo cura todo… excepto la estupidez humana.",
              "Me dijeron que todo esfuerzo tiene recompensa… entonces, ¿por qué sigo pobre?",
              "Le pregunté a la vida si algún día me iría bien… y se fue sin responderme.",
              "Mi suerte es tan buena… que si me tiro a un pozo, caigo arriba de la cuenta del banco.",
              "Mis planes siempre salen bien… en mi cabeza.",
              "Dicen que el dinero no da la felicidad… pero prefiero llorar en un yate.",
              "A veces pienso en positivo… pero la realidad siempre me cachetea.",
              "Las malas decisiones me persiguen… y yo corriendo en círculos.",
              "Siempre me esfuerzo… en perder las ganas de hacer algo.",
              "Dicen que soy un caso perdido… y no pienso defraudarlos.",
              "Si la vida te da limones… échale tequila.",
              "Mi sentido común está en cuarentena desde que nací.",
              "Los lunes y yo… tenemos una relación tóxica.",
              "Dicen que el amor todo lo puede… excepto arreglar mi cara.",
              "Algunos tienen ángel… a mí ni el demonio me quiere.",
              "Dicen que uno aprende de sus errores… por eso soy un genio.",
              "Los problemas y yo… inseparables desde 1999.",
              "Si tuviera un peso por cada vez que me sale mal algo… sería rico y miserable.",
              "La paciencia es una virtud… que nunca descargué.",
              "A mí la suerte me da like… pero nunca me sigue.",
              "No es que esté en la ruina… es que vivo en modo ahorro extremo.",
              "La esperanza es lo último que se pierde… menos si se cae conmigo.",
              "El amor es ciego… y parece que sordo también.",
              "Cada vez que sonrío… es porque algo se rompió en mí.",
              "Dicen que la fe mueve montañas… a mí ni la cama.",
              "Si el fracaso fuera un deporte… ya tendría medallas olímpicas."
          ];

              const embed = new EmbedBuilder()
                .setTitle("😂 Chiste Random")
                .setDescription(chistes[Math.floor(Math.random() * chistes.length)])
                .setColor("#00ff00")
                .setFooter({ text: "Generado aleatoriamente" });
              return message.channel.send({ embeds: [embed] });
            }

            if (cmd === "coinflip" || cmd === "moneda") {
              const result = Math.random() < 0.5 ? "Cara" : "Cruz";
              const emoji = result === "Cara" ? "🪙" : "💰";
              const embed = new EmbedBuilder()
                .setTitle("🪙 Lanzamiento de Moneda")
                .setDescription(`${emoji} **${result}**`)
                .setColor("#ffd700");
              return message.channel.send({ embeds: [embed] });
            }

            if (cmd === "dado") {
              const numero = Math.floor(Math.random() * 6) + 1;
              const embed = new EmbedBuilder()
                .setTitle("🎲 Lanzamiento de Dado")
                .setDescription(`Sacaste un **${numero}**`)
                .setColor("#9b59b6");
              return message.channel.send({ embeds: [embed] });
            }

            if (cmd === "insulto") {
              const insultos = [
                "Eres tan lento que cuando corres, el WiFi se desconecta. 🐌",
                "Tienes menos flow que un PDF. 📄",
                "Eres como un semáforo en verde... nadie te respeta. 🚦",
                "Tu coeficiente intelectual es tan bajo que se puede medir en temperatura ambiente. 🌡️",
                "Eres como Internet Explorer: nadie te quiere usar. 🌐",
                "Tienes tanta personalidad como una hoja de Excel en blanco. 📊",
                "Eres la razón por la que existe el modo incógnito. 🕵️",
                "Tu cara es tan fea que cuando naciste, el doctor le pegó a tu mamá. 👨‍⚕️",
                "Eres como un lunes: nadie te quiere ver llegar. 📅",
                "Tienes menos gracia que un funeral en un cementerio. ⚰️",
                "Eres tan aburrido que haces que ver pintura secarse parezca emocionante. 🎨",
                "Tu existencia es la mejor campaña para el control de natalidad. 👶",
                "Eres como un chicle en el zapato: molesto y difícil de quitar. 👟",
                "Tienes menos sentido común que un pez tratando de escalar un árbol. 🐟",
                "Eres la razón por la que los aliens no quieren visitarnos. 👽",
              ];
              const embed = new EmbedBuilder()
                .setTitle("🤬 Insulto Creativo")
                .setDescription(insultos[Math.floor(Math.random() * insultos.length)])
                .setColor("#e74c3c");
              return message.channel.send({ embeds: [embed] });
            }

            if (cmd === "amor" || cmd === "facha") {
              const porcentaje = Math.floor(Math.random() * 101);
              let color, emoji;

              if (porcentaje >= 80) {
                color = "#e91e63";
                emoji = "💕";
              } else if (porcentaje >= 60) {
                color = "#ff5722";
                emoji = "❤️";
              } else if (porcentaje >= 40) {
                color = "#ff9800";
                emoji = "🧡";
              } else if (porcentaje >= 20) {
                color = "#ffeb3b";
                emoji = "💛";
              } else {
                color = "#607d8b";
                emoji = "💔";
              }

              const embed = new EmbedBuilder()
                .setTitle("💖 Medidor de Facha")
                .setDescription(
                  `${emoji} **${message.author.username}**, tu nivel de facha es de **${porcentaje}%**`,
                )
                .setColor(color)
                .setThumbnail(
                  message.author.displayAvatarURL({ extension: "png", size: 256 }),
                );
              return message.channel.send({ embeds: [embed] });
            }

            if (cmd === "afk") {
              const afkReason = args.join(" ") || "Sin razón especificada";
              const timestamp = new Date().toISOString();

              db.run(
                `INSERT OR REPLACE INTO afk_users (user_id, reason, timestamp) VALUES (?, ?, ?)`,
                [message.author.id, afkReason, timestamp],
              );

              const afkEmbed = new EmbedBuilder()
                .setTitle("💤 Modo AFK Activado")
                .setDescription(`**${message.author.username}** ahora está AFK`)
                .addFields(
                  { name: "📝 Razón", value: afkReason, inline: true },
                  {
                    name: "⏰ Desde",
                    value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                    inline: true,
                  },
                )
                .setColor("#f39c12")
                .setThumbnail(
                  message.author.displayAvatarURL({ extension: "png", size: 256 }),
                )
                .setTimestamp();

              return message.channel.send({ embeds: [afkEmbed] });
            }

            if (cmd === "anuncio") {
              if (
                !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
              ) {
                return message.reply("❌ No tienes permisos de administrador.");
              }

              const content = args.join(" ");
              if (!content) {
                return message.reply(
                  "❌ Debes proporcionar el contenido del anuncio.\n**Formato:** `vkanuncio #canal | título | descripción | imagen_url`",
                );
              }

              const parts = content.split("|").map((part) => part.trim());
              if (parts.length < 3) {
                return message.reply(
                  "❌ Formato incorrecto. Usa: `vkanuncio #canal | título | descripción | imagen_url`",
                );
              }

              const [canalParam, titulo, descripcion, imagen] = parts;

              // Buscar canal por mención o ID
              let anuncioChannel;
              const channelMention = canalParam.match(/^<#(\d+)>$/);
              if (channelMention) {
                anuncioChannel = message.guild.channels.cache.get(channelMention[1]);
              } else if (/^\d+$/.test(canalParam)) {
                anuncioChannel = message.guild.channels.cache.get(canalParam);
              } else {
                return message.reply("❌ Canal inválido. Usa #canal o ID del canal.");
              }

              if (!anuncioChannel) {
                return message.reply("❌ Canal no encontrado.");
              }

              const anuncioEmbed = new EmbedBuilder()
                .setTitle(`📢 ${titulo}`)
                .setDescription(descripcion)
                .setColor("#9966ff")
                .setFooter({ text: "Anuncio oficial - VK Community" })
                .setTimestamp();

              if (imagen && imagen.startsWith("http")) {
                try {
                  anuncioEmbed.setImage(imagen);
                } catch (error) {
                  console.error("Error setting image:", error);
                }
              }

              await anuncioChannel.send({ 
                content: "@everyone", 
                embeds: [anuncioEmbed] 
              });
              await message.reply("✅ Anuncio enviado correctamente.");

              // Borrar comando después de 3 segundos
              setTimeout(() => message.delete().catch(() => {}), 3000);
              return;
            }

            // Comandos de moderación (mantenidos para compatibilidad)
            if (cmd === "warn") {
              if (
                !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
              ) {
                return message.reply("❌ No tienes permisos para advertir usuarios.");
              }

              const user = message.mentions.users.first();
              if (!user) return message.reply("❌ Debes mencionar a un usuario.");

              const reason = args.slice(1).join(" ") || "Sin razón especificada";
              const date = new Date().toISOString();

              db.run(`INSERT INTO warnings (user, reason, date) VALUES (?, ?, ?)`, [
                user.id,
                reason,
                date,
              ]);

              const embed = new EmbedBuilder()
                .setTitle("⚠️ Usuario Advertido")
                .setColor("#f39c12")
                .addFields(
                  { name: "👤 Usuario", value: `${user.tag}`, inline: true },
                  { name: "🛡️ Moderador", value: `${message.author.tag}`, inline: true },
                  { name: "📝 Razón", value: reason, inline: false },
                )
                .setThumbnail(user.displayAvatarURL({ extension: "png", size: 256 }))
                .setTimestamp();

              return message.channel.send({ embeds: [embed] });
            }

            if (cmd === "warnings") {
              const user = message.mentions.users.first();
              if (!user) return message.reply("❌ Debes mencionar a un usuario.");

              db.all(`SELECT * FROM warnings WHERE user = ?`, [user.id], (err, rows) => {
                if (err || !rows.length) {
                  return message.reply("❌ Este usuario no tiene advertencias.");
                }

                const embed = new EmbedBuilder()
                  .setTitle(`⚠️ Advertencias de ${user.username}`)
                  .setColor("#f39c12")
                  .setThumbnail(user.displayAvatarURL({ extension: "png", size: 256 }))
                  .setDescription(`Total de advertencias: **${rows.length}**`)
                  .setTimestamp();

                rows.forEach((row, index) => {
                  embed.addFields({
                    name: `Advertencia #${index + 1}`,
                    value: `**Razón:** ${row.reason}\n**Fecha:** ${new Date(row.date).toLocaleDateString()}`,
                    inline: true,
                  });
                });

                message.channel.send({ embeds: [embed] });
              });
            }

            if (cmd === "resetwarns") {
              if (
                !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
              ) {
                return message.reply("❌ No tienes permisos de administrador.");
              }

              const user = message.mentions.users.first();
              if (!user) return message.reply("❌ Debes mencionar a un usuario.");

              db.run(`DELETE FROM warnings WHERE user = ?`, [user.id]);

              const embed = new EmbedBuilder()
                .setDescription(
                  `✅ Se han limpiado todas las advertencias de **${user.username}**`,
                )
                .setColor("#2ecc71");

              return message.channel.send({ embeds: [embed] });
            }

            // Nuevos comandos de moderación con prefix vk
            if (cmd === "mute") {
              if (
                !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
              ) {
                return message.reply("❌ No tienes permisos para mutear usuarios.");
              }

              const user = message.mentions.users.first();
              if (!user)
                return message.reply(
                  "❌ Debes mencionar a un usuario. Uso: `vkmute @usuario 10m razón`",
                );

              const timeArg = args[1];
              if (!timeArg || !/^\d+[smhd]$/.test(timeArg)) {
                return message.reply(
                  "❌ Formato de tiempo inválido. Usa: `10s`, `5m`, `2h`, `1d`",
                );
              }

              const reason = args.slice(2).join(" ") || "Sin razón especificada";

              const timeUnit = timeArg.slice(-1);
              const timeValue = parseInt(timeArg.slice(0, -1));
              let milliseconds;

              switch (timeUnit) {
                case "s":
                  milliseconds = timeValue * 1000;
                  break;
                case "m":
                  milliseconds = timeValue * 60 * 1000;
                  break;
                case "h":
                  milliseconds = timeValue * 60 * 60 * 1000;
                  break;
                case "d":
                  milliseconds = timeValue * 24 * 60 * 60 * 1000;
                  break;
              }

              const member = message.guild.members.cache.get(user.id);
              try {
                await member.timeout(milliseconds, reason);

                const muteEmbed = new EmbedBuilder()
                  .setTitle("🔇 Usuario Muteado")
                  .setColor("#e74c3c")
                  .addFields(
                    { name: "👤 Usuario", value: `${user.tag}`, inline: true },
                    {
                      name: "🛡️ Moderador",
                      value: `${message.author.tag}`,
                      inline: true,
                    },
                    { name: "⏰ Duración", value: timeArg, inline: true },
                    { name: "📝 Razón", value: reason, inline: false },
                  )
                  .setThumbnail(user.displayAvatarURL({ extension: "png", size: 256 }))
                  .setTimestamp();

                await message.channel.send({ embeds: [muteEmbed] });

                // Log en canal de moderadores
                const logsChannel = message.guild.channels.cache.get(
                  "1394028954527989939",
                );
                if (logsChannel) {
                  await logsChannel.send({ embeds: [muteEmbed] });
                }
              } catch (error) {
                await message.reply("❌ Error al mutear al usuario.");
              }
              return;
            }

            if (cmd === "unmute") {
              if (
                !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
              ) {
                return message.reply("❌ No tienes permisos para desmutear usuarios.");
              }

              const user = message.mentions.users.first();
              if (!user)
                return message.reply(
                  "❌ Debes mencionar a un usuario. Uso: `vkunmute @usuario`",
                );

              const member = message.guild.members.cache.get(user.id);
              try {
                await member.timeout(null);

                const unmuteEmbed = new EmbedBuilder()
                  .setTitle("🔊 Usuario Desmuteado")
                  .setColor("#2ecc71")
                  .addFields(
                    { name: "👤 Usuario", value: `${user.tag}`, inline: true },
                    {
                      name: "🛡️ Moderador",
                      value: `${message.author.tag}`,
                      inline: true,
                    },
                  )
                  .setThumbnail(user.displayAvatarURL({ extension: "png", size: 256 }))
                  .setTimestamp();

                await message.channel.send({ embeds: [unmuteEmbed] });

                // Log en canal de moderadores
                const logsChannel = message.guild.channels.cache.get(
                  "1394028954527989939",
                );
                if (logsChannel) {
                  await logsChannel.send({ embeds: [unmuteEmbed] });
                }
              } catch (error) {
                await message.reply("❌ Error al desmutear al usuario.");
              }
              return;
            }

            if (cmd === "ban") {
              if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return message.reply("❌ No tienes permisos para banear usuarios.");
              }

              const user = message.mentions.users.first();
              if (!user)
                return message.reply(
                  "❌ Debes mencionar a un usuario. Uso: `vkban @usuario razón`",
                );

              const reason = args.slice(1).join(" ") || "Sin razón especificada";
              const member = message.guild.members.cache.get(user.id);

              if (!member) {
                return message.reply("❌ Usuario no encontrado en el servidor.");
              }

              try {
                await member.ban({ reason: reason });

                const banEmbed = new EmbedBuilder()
                  .setTitle("🔨 Usuario Baneado")
                  .setColor("#8b0000")
                  .addFields(
                    { name: "👤 Usuario", value: `${user.tag}`, inline: true },
                    {
                      name: "🛡️ Moderador",
                      value: `${message.author.tag}`,
                      inline: true,
                    },
                    { name: "📝 Razón", value: reason, inline: false },
                  )
                  .setThumbnail(
                    user.displayAvatarURL({ extension: "png", size: 256 }),
                  )
                  .setTimestamp();

                await message.channel.send({ embeds: [banEmbed] });

                // Log en canal de moderadores
                const logsChannel = message.guild.channels.cache.get(
                  "1394028954527989939",
                );
                if (logsChannel) {
                  await logsChannel.send({ embeds: [banEmbed] });
                }
              } catch (error) {
                await message.reply("❌ Error al banear al usuario.");
              }
              return;
            }

            if (cmd === "kick") {
              if (
                !message.member.permissions.has(PermissionsBitField.Flags.KickMembers)
              ) {
                return message.reply("❌ No tienes permisos para expulsar usuarios.");
              }

              const user = message.mentions.users.first();
              if (!user)
                return message.reply(
                  "❌ Debes mencionar a un usuario. Uso: `vkkick @usuario razón`",
                );

              const reason = args.slice(1).join(" ") || "Sin razón especificada";
              const member = message.guild.members.cache.get(user.id);

              if (!member) {
                return message.reply("❌ Usuario no encontrado en el servidor.");
              }

              try {
                await member.kick(reason);

                const kickEmbed = new EmbedBuilder()
                  .setTitle("👢 Usuario Expulsado")
                  .setColor("#f39c12")
                  .addFields(
                    { name: "👤 Usuario", value: `${user.tag}`, inline: true },
                    {
                      name: "🛡️ Moderador",
                      value: `${message.author.tag}`,
                      inline: true,
                    },
                    { name: "📝 Razón", value: reason, inline: false },
                  )
                  .setThumbnail(
                    user.displayAvatarURL({ extension: "png", size: 256 }),
                  )
                  .setTimestamp();

                await message.channel.send({ embeds: [kickEmbed] });

                // Log en canal de moderadores
                const logsChannel = message.guild.channels.cache.get(
                  "1394028954527989939",
                );
                if (logsChannel) {
                  await logsChannel.send({ embeds: [kickEmbed] });
                }
              } catch (error) {
                await message.reply("❌ Error al expulsar al usuario.");
              }
              return;
            }

            if (cmd === "clear") {
              if (
                !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
              ) {
                return message.reply("❌ No tienes permisos para gestionar mensajes.");
              }

              const amount = parseInt(args[0]);
              if (!amount || amount < 1 || amount > 100) {
                return message.reply(
                  "❌ Debes especificar un número entre 1 y 100. Uso: `vkclear 50`",
                );
              }

              try {
                await message.delete();
                const deleted = await message.channel.bulkDelete(amount, true);

                const clearEmbed = new EmbedBuilder()
                  .setDescription(`🧹 Se han eliminado **${deleted.size}** mensajes.`)
                  .setColor("#2ecc71")
                  .setFooter({
                    text: `Limpieza realizada por ${message.author.username}`,
                  })
                  .setTimestamp();

                const msg = await message.channel.send({ embeds: [clearEmbed] });
                setTimeout(() => msg.delete().catch(() => {}), 5000);

                // Log en canal de moderadores
                const logsChannel = message.guild.channels.cache.get(
                  "1394028954527989939",
                );
                if (logsChannel) {
                  const logEmbed = new EmbedBuilder()
                    .setTitle("🧹 Mensajes Eliminados")
                    .setDescription(
                      `**Canal:** ${message.channel}\n**Moderador:** ${message.author}\n**Cantidad:** ${deleted.size} mensajes`,
                    )
                    .setColor("#f39c12")
                    .setTimestamp();
                  await logsChannel.send({ embeds: [logEmbed] });
                }
              } catch (error) {
                await message.reply(
                  "❌ Error al eliminar mensajes. Pueden ser muy antiguos (más de 14 días).",
                );
              }
              return;
            }

            if (cmd === "userinfo") {
              const user = message.mentions.users.first() || message.author;
              const member = message.guild.members.cache.get(user.id);

              if (!member) {
                return message.reply("❌ Usuario no encontrado en el servidor.");
              }

              const roles =
                member.roles.cache
                  .filter((role) => role.name !== "@everyone")
                  .map((role) => role.name)
                  .join(", ") || "Sin roles";

              const userEmbed = new EmbedBuilder()
                .setTitle(`👤 Información de ${user.username}`)
                .setColor("#3498db")
                .setThumbnail(user.displayAvatarURL({ extension: "png", size: 256 }))
                .addFields(
                  { name: "🆔 ID", value: user.id, inline: true },
                  {
                    name: "📅 Cuenta creada",
                    value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`,
                    inline: true,
                  },
                  {
                    name: "📥 Se unió al servidor",
                    value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
                    inline: true,
                  },
                  { name: "🎭 Roles", value: roles, inline: false },
                  { name: "🤖 Bot", value: user.bot ? "Sí" : "No", inline: true },
                  {
                    name: "🟢 Estado",
                    value: member.presence?.status || "Desconocido",
                    inline: true,
                  },
                )
                .setTimestamp();

              return message.channel.send({ embeds: [userEmbed] });
            }

            if (cmd === "serverinfo") {
              const guild = message.guild;
              const owner = await guild.fetchOwner();

              const serverEmbed = new EmbedBuilder()
                .setTitle(`📊 Información de ${guild.name}`)
                .setColor("#9966ff")
                .setThumbnail(guild.iconURL({ extension: "png", size: 256 }))
                .addFields(
                  { name: "🆔 ID del servidor", value: guild.id, inline: true },
                  { name: "👑 Propietario", value: owner.user.username, inline: true },
                  {
                    name: "📅 Creado",
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                    inline: true,
                  },
                  { name: "👥 Miembros", value: `${guild.memberCount}`, inline: true },
                  {
                    name: "🤖 Bots",
                    value: `${guild.members.cache.filter((m) => m.user.bot).size}`,
                    inline: true,
                  },
                  {
                    name: "📺 Canales",
                    value: `${guild.channels.cache.size}`,
                    inline: true,
                  },
                  { name: "🎭 Roles", value: `${guild.roles.cache.size}`, inline: true },
                  {
                    name: "💎 Boosts",
                    value: `${guild.premiumSubscriptionCount || 0}`,
                    inline: true,
                  },
                  {
                    name: "🚀 Nivel de boost",
                    value: `${guild.premiumTier}`,
                    inline: true,
                  },
                )
                .setTimestamp();

              return message.channel.send({ embeds: [serverEmbed] });
            }

            if (cmd === "help" || cmd === "ayuda") {
              const usersRoleId = "1394028954062553339";
              const hasUsersRole = message.member.roles.cache.has(usersRoleId);
              const hasModRole = message.member.permissions.has(
                PermissionsBitField.Flags.ModerateMembers,
              );

              const embed = new EmbedBuilder()
                .setTitle("📚 Lista de Comandos")
                .setDescription("Aquí tienes los comandos disponibles para ti:")
                .setColor("#9966ff")
                .setThumbnail(
                  client.user.displayAvatarURL({ extension: "png", size: 256 }),
                )
                .setFooter({ text: `Prefix: ${prefix} | Usa / para comandos slash` })
                .setTimestamp();

              if (hasModRole) {
                // Mostrar todos los comandos para moderadores
                embed.addFields(
                  {
                    name: "🛡️ **Moderación (Slash)**",
                    value:
                      "`/ban` - Banear usuario\n`/kick` - Expulsar usuario\n`/mute` - Mutear usuario\n`/clear` - Limpiar mensajes",
                    inline: false,
                  },
                  {
                    name: "🎫 **Tickets (Slash)**",
                    value:
                      "`/paneltickets` - Enviar panel\n`/tickets` - Ver tickets abiertos\n`/closeticket` - Cerrar ticket\n`/adduser` - Añadir usuario\n`/removeuser` - Remover usuario\n`/assignticket` - Asignar ticket\n`/ticketpriority` - Cambiar prioridad\n`/ticketstats` - Ver estadísticas\n`/renameticket` - Renombrar ticket",
                    inline: false,
                  },
                  {
                    name: "📢 **Administración**",
                    value:
                      "`/anuncio` - Crear anuncios oficiales\n`vkanuncio` - Crear anuncios (texto)",
                    inline: false,
                  },
                  {
                    name: "🎮 **Divertidos**",
                    value:
                      "`vkhola` - Saludo\n`vkchiste` - Chiste random\n`vkmoneda` - Lanzar moneda\n`vkdado` - Lanzar dado\n`vkinsulto` - Insulto creativo\n`vkfacha` - Medidor de facha\n`vkafk` - Modo AFK",
                    inline: false,
                  },
                  {
                    name: "🧱 **Minecraft**",
                    value: "`/skin` - Ver skin de Minecraft",
                    inline: false,
                  },
                  {
                    name: "🔧 **Utilidad**",
                    value:
                      "`/ping` - Latencia del bot\n`/afk` - Modo AFK\n`/poll` - Crear encuesta\n`vkuserinfo` - Info de usuario\n`vkserverinfo` - Info del servidor",
                    inline: false,
                  },
                  {
                    name: "🛠️ **Moderación (Texto)**",
                    value:
                      "`vkwarn <@usuario> <razón>` - Advertir usuario\n`vkwarnings <@usuario>` - Ver advertencias\n`vkresetwarns <@usuario>` - Limpiar advertencias\n`vkmute <@usuario> <tiempo> <razón>` - Mutear usuario\n`vkunmute <@usuario>` - Desmutear usuario\n`vkban <@usuario> <razón>` - Banear usuario\n`vkkick <@usuario> <razón>` - Expulsar usuario\n`vkclear <cantidad>` - Eliminar mensajes",
                    inline: false,
                  },
                );
              } else if (hasUsersRole) {
                // Mostrar solo comandos básicos para usuarios con rol Users
                embed.addFields(
                  {
                    name: "🎮 **Comandos Divertidos**",
                    value:
                      "`vkhola` - Saludo\n`vkchiste` - Chiste random\n`vkmoneda` - Lanzar moneda\n`vkdado` - Lanzar dado\n`vkinsulto` - Insulto creativo\n`vkfacha` - Medidor de facha\n`vkafk` - Modo AFK",
                    inline: false,
                  },
                  {
                    name: "🧱 **Minecraft**",
                    value: "`/skin` - Ver skin de Minecraft",
                    inline: false,
                  },
                  {
                    name: "🔧 **Utilidad**",
                    value:
                      "`/ping` - Latencia del bot\n`/afk` - Modo AFK\n`/poll` - Crear encuesta\n`vkuserinfo` - Info de usuario\n`vkserverinfo` - Info del servidor",
                    inline: false,
                  },
                );
              } else {
                // Mostrar comandos básicos para usuarios sin roles específicos
                embed.addFields({
                  name: "🔧 **Comandos Básicos**",
                  value:
                    "`/ping` - Latencia del bot\n`vkhola` - Saludo\n`vkchiste` - Chiste random\n\n⚠️ **Necesitas el rol de usuario para acceder a más comandos**\nVe al canal de autoroles para obtenerlo.",
                  inline: false,
                });
              }

              return message.channel.send({ embeds: [embed] });
            }

            // COMANDOS DE TICKETS CON PREFIJO VK
            if (cmd === "ticket") {
              const embed = new EmbedBuilder()
                .setTitle("🎫 Sistema de Tickets")
                .setDescription(
                  `Para crear un ticket, usa el panel en el canal correspondiente o contacta a un administrador.\n\n**Comandos disponibles:**\n• \`/paneltickets\` - Enviar panel (solo admins)\n• \`/tickets\` - Ver tickets abiertos (staff)\n• \`/closeticket\` - Cerrar ticket (staff)`,
                )
                .setColor("#5865F2")
                .setFooter({ text: "VK Community - Sistema de Tickets" });

              return message.channel.send({ embeds: [embed] });
            }

            if (cmd === "ticketstats") {
              if (
                !message.member.roles.cache.has(STAFF_ROLE_ID) &&
                !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
              ) {
                return message.reply(
                  "❌ No tienes permisos para ver las estadísticas de tickets.",
                );
              }

              ticketsDb.all(`SELECT * FROM tickets`, [], (err, allTickets) => {
                if (err) return message.reply("❌ Error al obtener estadísticas.");

                const openTickets = allTickets.filter((t) => t.status === "abierto");
                const closedTickets = allTickets.filter((t) => t.status === "cerrado");
                const todayTickets = allTickets.filter((t) => {
                  const ticketDate = new Date(t.created_at);
                  const today = new Date();
                  return ticketDate.toDateString() === today.toDateString();
                });

                const statsEmbed = new EmbedBuilder()
                  .setTitle("📊 Estadísticas de Tickets")
                  .setColor("#3498db")
                  .addFields(
                    {
                      name: "🟢 Tickets Abiertos",
                      value: `${openTickets.length}`,
                      inline: true,
                    },
                    {
                      name: "🔴 Tickets Cerrados",
                      value: `${closedTickets.length}`,
                      inline: true,
                    },
                    {
                      name: "📅 Tickets de Hoy",
                      value: `${todayTickets.length}`,
                      inline: true,
                    },
                    {
                      name: "📈 Total de Tickets",
                      value: `${allTickets.length}`,
                      inline: true,
                    },
                    {
                      name: "📊 Tipos más comunes",
                      value: `
          ${TICKET_TYPES.map((type) => {
            const count = allTickets.filter((t) => t.type === type.id).length;
            return `${type.emoji} ${type.label}: ${count}`;
          })
            .slice(0, 3)
            .join("\n")}`,
                      inline: false,
                    },
                  )
                  .setFooter({ text: "Estadísticas del sistema de tickets" })
                  .setTimestamp();

                message.channel.send({ embeds: [statsEmbed] });
              });
            }
          });

          // --- SISTEMA vK AI (Groq API) ---
          const groqApiKey = process.env.GROQ_API_KEY;
          const groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";
          const vkAiPrefix = "vk ask";
          const vkAiName = "vK AI";

          // Memoria de conversación por canal
          const vkAiMemory = new Map();

          // Información completa del bot para la IA
          const botKnowledge = `
          Soy vK AI, asistente inteligente del bot VK Community. Este bot tiene las siguientes funciones:

          COMANDOS DE MODERACIÓN:
          - /ban, /kick, /mute, /clear - Comandos básicos de moderación
          - vkwarn, vkwarnings, vkresetwarns - Sistema de advertencias
          - vkmute, vkunmute, vkban, vkkick, vkclear - Comandos con prefix

          SISTEMA DE TICKETS:
          - /paneltickets - Crear panel de tickets
          - /tickets - Ver tickets abiertos
          - /closeticket - Cerrar tickets
          - /adduser, /removeuser - Gestionar usuarios en tickets
          - /assignticket, /ticketpriority, /renameticket - Administración avanzada
          - Tipos: Soporte Técnico, Reportar Usuario, Sugerencia, Apelación, Partnership, Otro

          COMANDOS DIVERTIDOS:
          - vkhola - Saludos personalizados
          - vkchiste - Chistes aleatorios
          - vkmoneda - Lanzar moneda
          - vkdado - Lanzar dado
          - vkinsulto - Insultos creativos
          - vkfacha - Medidor de facha
          - vkafk - Modo AFK

          SISTEMA DE NIVELES:
          - Gana XP escribiendo mensajes (1 XP base, +4 por archivos, +2 por mensajes largos)
          - Gana 3 XP por minuto en llamadas de voz CON MICRÓFONO PRENDIDO
          - /level - Ver nivel personal
          - /leaderboard - Tabla de clasificación
          - vklevel, vktop - Comandos alternativos

          SISTEMA DE ANUNCIOS:
          - /anuncio - Crear anuncios oficiales (slash)
          - vkanuncio #canal | título | descripción | imagen - Comando con prefix

          SISTEMA DE SORTEOS:
          - /sorteo - Crear sorteos automáticos (slash)
          - vksorteo canalID | título | patrocinador | rol | duración | imagen | premio
          - Finalización automática con selección de ganador

          UTILIDADES:
          - /ping - Latencia del bot
          - /poll - Crear encuestas
          - /skin - Ver skins de Minecraft
          - /userinfo, /serverinfo - Información
          - vkuserinfo, vkserverinfo - Comandos alternativos

          SISTEMA DE AUTOROLES:
          - Reacciones automáticas para obtener roles
          - Roles: Users, Boy/Girl, English/Español, rangos de edad

          IA AVANZADA:
          - vk ask [pregunta] - Preguntas a la IA
          - Continuación por respuestas
          - Memoria conversacional por canal

          El bot también tiene sistema de logs, detección AFK, bienvenidas automáticas, y más funciones administrativas.
          `;

          // Función para generar respuesta IA
          async function getVkAiResponse(channel, userId, prompt, imageRequest = false) {
            // Recuperar historial
            let history = vkAiMemory.get(channel.id) || [];
            history.push({ role: "user", content: prompt });

            // Construir payload
            const payload = {
              model: "llama3-70b-8192",
              messages: [
                { role: "system", content: `${botKnowledge}\n\nEres ${vkAiName}, la IA del bot VK Community. Conoces todas las funciones del bot detalladas arriba. Responde en español, sé útil y preciso. Si preguntan sobre comandos o funciones del bot, usa la información proporcionada.` },
                ...history,
              ],
              max_tokens: 2048,
              temperature: 0.7,
            };

            // Si se pide imagen, añade instrucción
            if (imageRequest) {
              payload.messages.push({ role: "user", content: "Genera una imagen relacionada a la respuesta." });
            }

            try {
              const res = await axios.post(groqApiUrl, payload, {
                headers: {
                  "Authorization": `Bearer ${groqApiKey}`,
                  "Content-Type": "application/json",
                },
              });

              const aiMsg = res.data.choices[0].message.content;
              // Guardar en memoria (máx 10 mensajes)
              history.push({ role: "assistant", content: aiMsg });
              vkAiMemory.set(channel.id, history.slice(-10));
              return aiMsg;
            } catch (err) {
              return "❌ Error al conectar con la IA. Intenta más tarde.";
            }
          }

          // Detectar vk ask y continuación de conversación
          client.on("messageCreate", async (message) => {
            if (message.author.bot || !message.guild) return;

            // --- vK AI: comando vk ask ---
            if (message.content.toLowerCase().startsWith(vkAiPrefix)) {
              const prompt = message.content.slice(vkAiPrefix.length).trim();
              if (!prompt) return message.reply("❌ Escribe una pregunta después de `vk ask`.");

              // Detectar si pide imagen
              const imageRequest = /imagen|foto|dibuja|genera.*imagen/i.test(prompt);

              // Mostrar indicador de escritura
              await message.channel.sendTyping();

              const aiResponse = await getVkAiResponse(message.channel, message.author.id, prompt, imageRequest);

              // Enviar respuesta directamente (no editar)
              await message.reply({
                embeds: [
                  new EmbedBuilder()
                    .setAuthor({ name: vkAiName, iconURL: client.user.displayAvatarURL() })
                    .setDescription(aiResponse)
                    .setColor("#00bfff")
                    .setFooter({ text: `Pregunta de ${message.author.username}` })
                    .setTimestamp(),
                ],
              });
              return;
            }

            // --- vK AI: continuación de conversación por reply ---
            if (
              message.reference &&
              message.reference.messageId &&
              message.channel &&
              !message.content.startsWith(prefix)
            ) {
              try {
                const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
                if (
                  repliedMsg.author.bot &&
                  repliedMsg.embeds.length &&
                  repliedMsg.embeds[0].author?.name === vkAiName
                ) {
                  // Continuar conversación
                  const prompt = message.content;
                  const imageRequest = /imagen|foto|dibuja|genera.*imagen/i.test(prompt);

                  // Mostrar indicador de escritura
                  await message.channel.sendTyping();

                  const aiResponse = await getVkAiResponse(message.channel, message.author.id, prompt, imageRequest);

                  await message.reply({
                    embeds: [
                      new EmbedBuilder()
                        .setAuthor({ name: vkAiName, iconURL: client.user.displayAvatarURL() })
                        .setDescription(aiResponse)
                        .setColor("#00bfff")
                        .setFooter({ text: `Continuación de ${message.author.username}` })
                        .setTimestamp(),
                    ],
                  });
                  return;
                }
              } catch (err) {}
            }
          });

          // --- SISTEMA DE NIVELES ---
          const levelsDb = new sqlite3.Database("./levels.sqlite", (err) => {
            if (err) console.error("❌ Error al conectar levels:", err);
            else console.log("🆙 Base de datos de niveles conectada.");
          });
          levelsDb.run(`CREATE TABLE IF NOT EXISTS levels (
            user_id TEXT PRIMARY KEY,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1
          )`);

          // XP por mensaje, imagen, video, voz
          client.on("messageCreate", async (message) => {
            if (message.author.bot || !message.guild) return;

            let xp = 1;
            if (message.attachments.size > 0) xp += 4;
            if (message.content.length > 100) xp += 2;

            // Sumar XP
            addUserXP(message.author.id, xp, message.guild);
          });

          // Sistema de XP por estar en llamada con micrófono
          const voiceXpCooldown = new Map();

          // Dar XP cada minuto en llamada con micrófono prendido
          setInterval(() => {
            client.guilds.cache.forEach(guild => {
              guild.channels.cache.filter(channel => channel.type === 2).forEach(voiceChannel => { // Type 2 = voice channel
                voiceChannel.members.forEach(member => {
                  if (member.user.bot) return;

                  // Verificar que el micrófono esté prendido (no muteado)
                  if (!member.voice.mute && !member.voice.selfMute && member.voice.channelId) {
                    const cooldownKey = `${member.id}-${Date.now()}`;
                    const lastXp = voiceXpCooldown.get(member.id) || 0;

                    // Dar XP cada minuto
                    if (Date.now() - lastXp >= 60000) { // 60 segundos
                      addUserXP(member.id, 3, guild); // 3 XP por minuto en llamada con mic
                      voiceXpCooldown.set(member.id, Date.now());
                    }
                  }
                });
              });
            });
          }, 60000); // Cada minuto

          // Función para añadir XP y manejar subidas de nivel
          async function addUserXP(userId, xp, guild) {
            levelsDb.get(
              `SELECT * FROM levels WHERE user_id = ?`,
              [userId],
              async (err, row) => {
                let newXp = (row?.xp || 0) + xp;
                let newLevel = row?.level || 1;
                let nextLevelXp = newLevel * 50 + 50;

                if (newXp >= nextLevelXp) {
                  newLevel++;
                  newXp = newXp - nextLevelXp;

                  // Log de subida de nivel con imagen personalizada
                  const Canvas = require("canvas");
                  const canvas = Canvas.createCanvas(500, 120);
                  const ctx = canvas.getContext("2d");
                  ctx.fillStyle = "#23272A";
                  ctx.fillRect(0, 0, canvas.width, canvas.height);

                  // Barra XP
                  ctx.fillStyle = "#5865F2";
                  ctx.fillRect(120, 70, Math.min(350, (newXp / (newLevel * 50 + 50)) * 350), 25);

                  try {
                    // Avatar
                    const user = await client.users.fetch(userId);
                    const avatar = await Canvas.loadImage(user.displayAvatarURL({ extension: "png", size: 128 }));
                    ctx.drawImage(avatar, 10, 20, 90, 90);

                    // Texto
                    ctx.font = "bold 22px Arial";
                    ctx.fillStyle = "#fff";
                    ctx.fillText(`Nivel ${newLevel}`, 120, 50);
                    ctx.font = "16px Arial";
                    ctx.fillText(`XP: ${newXp} / ${newLevel * 50 + 50}`, 120, 95);

                    // Tag
                    ctx.font = "bold 18px Arial";
                    ctx.fillStyle = "#00bfff";
                    ctx.fillText(`@${user.username}`, 120, 25);

                    const buffer = canvas.toBuffer("image/png");
                    const attachment = new AttachmentBuilder(buffer, { name: `levelup-${userId}.png` });

                    // Canal de levels
                    const levelsChannel = guild.channels.cache.get("1394460624804909107");
                    if (levelsChannel) {
                      levelsChannel.send({
                        content: `<@${userId}>`,
                        files: [attachment],
                      });
                    }
                  } catch (error) {
                    console.error("Error creando imagen de nivel:", error);
                  }
                }

                // Guardar en DB
                levelsDb.run(
                  `INSERT OR REPLACE INTO levels (user_id, xp, level) VALUES (?, ?, ?)`,
                  [userId, newXp, newLevel]
                );
              }
            );
          }

          // Comando vk level
          client.on("messageCreate", async (message) => {
            if (message.author.bot || !message.guild) return;
            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const cmd = args.shift()?.toLowerCase();

            if (cmd === "level") {
              const targetUser = message.mentions.users.first() || message.author;

              levelsDb.get(`SELECT * FROM levels WHERE user_id = ?`, [targetUser.id], async (err, row) => {
                if (!row) {
                  return message.reply(`${targetUser.id === message.author.id ? "No tienes nivel aún" : `${targetUser.username} no tiene nivel aún`}. ¡Empieza a participar!`);
                }

                // Crear imagen de nivel personalizada
                const Canvas = require("canvas");
                const canvas = Canvas.createCanvas(600, 200);
                const ctx = canvas.getContext("2d");

                // Fondo
                ctx.fillStyle = "#36393f";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Barra de progreso fondo
                ctx.fillStyle = "#2f3136";
                ctx.fillRect(150, 120, 400, 30);

                // Barra de progreso
                const nextLevelXp = row.level * 50 + 50;
                const progress = Math.min(400, (row.xp / nextLevelXp) * 400);
                ctx.fillStyle = "#5865F2";
                ctx.fillRect(150, 120, progress, 30);

                // Avatar
                try {
                  const avatar = await Canvas.loadImage(targetUser.displayAvatarURL({ extension: "png", size: 128 }));
                  ctx.save();
                  ctx.beginPath();
                  ctx.arc(75, 100, 60, 0, Math.PI * 2);
                  ctx.closePath();
                  ctx.clip();
                  ctx.drawImage(avatar, 15, 40, 120, 120);
                  ctx.restore();
                } catch (error) {
                  console.error("Error loading avatar:", error);
                }

                // Texto
                ctx.font = "bold 28px Arial";
                ctx.fillStyle = "#ffffff";
                ctx.fillText(`${targetUser.username}`, 150, 50);

                ctx.font = "bold 24px Arial";
                ctx.fillStyle = "#5865F2";
                ctx.fillText(`Nivel ${row.level}`, 150, 85);

                ctx.font = "18px Arial";
                ctx.fillStyle = "#b9bbbe";
                ctx.fillText(`${row.xp} / ${nextLevelXp} XP`, 150, 110);

                // Porcentaje
                ctx.font = "16px Arial";
                ctx.fillStyle = "#ffffff";
                ctx.fillText(`${Math.round((row.xp / nextLevelXp) * 100)}%`, 480, 140);

                const buffer = canvas.toBuffer("image/png");
                const attachment = new AttachmentBuilder(buffer, { name: `level-${targetUser.id}.png` });

                await message.channel.send({ files: [attachment] });
              });
            }
          });

          // ...existing code...

          // --- SISTEMA DE SORTEOS VK ---
          const sorteosDb = new sqlite3.Database("./sorteos.sqlite", (err) => {
            if (err) console.error("❌ Error al conectar sorteos:", err);
            else console.log("🎉 Base de datos de sorteos conectada.");
          });
          sorteosDb.run(`CREATE TABLE IF NOT EXISTS sorteos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id TEXT,
            message_id TEXT,
            titulo TEXT,
            patrocinador TEXT,
            rol_requerido TEXT,
            finaliza INTEGER,
            imagen TEXT,
            premio TEXT,
            ganador_id TEXT
          )`);

          // Comando vk sorteo
          client.on("messageCreate", async (message) => {
            if (message.author.bot || !message.guild) return;
            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const cmd = args.shift()?.toLowerCase();

            if (cmd === "sorteo") {
              if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply("❌ Solo administradores pueden crear sorteos.");
              }
              // Sintaxis: vk sorteo canalID | titulo | patrocinador | rol | duración(h/d) | imagen | premio
              const content = args.join(" ");
              const parts = content.split("|").map(p => p.trim());
              if (parts.length < 5) {
                return message.reply("❌ Formato: `vk sorteo canalID | titulo | patrocinador | rol | duración(h/d) | imagen(opcional) | premio`");
              }
              const [canalId, titulo, patrocinador, rol, duracion, imagen, premio] = parts;
              const sorteoChannel = message.guild.channels.cache.get(canalId);
              if (!sorteoChannel) return message.reply("❌ Canal no encontrado.");

              // Calcular tiempo finalización
              let ms = 0;
              if (/^\d+h$/.test(duracion)) ms = parseInt(duracion) * 60 * 60 * 1000;
              else if (/^\d+d$/.test(duracion)) ms = parseInt(duracion) * 24 * 60 * 60 * 1000;
              else return message.reply("❌ Duración inválida. Usa formato `2h` o `1d`.");

              const finaliza = Date.now() + ms;

              // Embed sorteo
              const embed = new EmbedBuilder()
                .setTitle(`🎉 Sorteo: ${titulo}`)
                .setDescription(
                  `**Patrocinador:** ${patrocinador}\n**Premio:** ${premio || "No especificado"}\n**Rol requerido:** ${rol ? `<@&${rol}>` : "@everyone"}\n**Finaliza:** <t:${Math.floor(finaliza / 1000)}:R>\n\nReacciona con 🎉 para participar.`
                )
                .setColor("#ffb300")
                .setFooter({ text: "Sorteo VK Community" })
                .setTimestamp();
              if (imagen && imagen.startsWith("http")) embed.setImage(imagen);

              const sorteoMsg = await sorteoChannel.send({ content: rol ? `<@&${rol}>` : "@everyone", embeds: [embed] });
              await sorteoMsg.react("🎉");

              // Guardar en DB
              sorteosDb.run(
                `INSERT INTO sorteos (channel_id, message_id, titulo, patrocinador, rol_requerido, finaliza, imagen, premio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [canalId, sorteoMsg.id, titulo, patrocinador, rol, finaliza, imagen, premio]
              );

              await message.reply("✅ Sorteo creado correctamente.");
              // Borrar mensaje de comando
              setTimeout(() => message.delete().catch(() => {}), 3000);

              // Finalizar sorteo automáticamente
              setTimeout(async () => {
                try {
                  const msg = await sorteoChannel.messages.fetch(sorteoMsg.id);
                  const users = await msg.reactions.cache.get("🎉").users.fetch();
                  let participantes = Array.from(users.filter(u => !u.bot).values());

                  // Filtrar por rol si corresponde
                  if (rol) {
                    participantes = participantes.filter(u => {
                      const member = sorteoChannel.guild.members.cache.get(u.id);
                      return member && member.roles.cache.has(rol);
                    });
                  }

                  let ganador = participantes.length ? participantes[Math.floor(Math.random() * participantes.length)] : null;

                  // Actualizar DB
                  sorteosDb.run(`UPDATE sorteos SET ganador_id = ? WHERE message_id = ?`, [ganador?.id || null, sorteoMsg.id]);

                  // Borrar embed anterior
                  await msg.delete().catch(() => {});

                  // Nuevo embed de finalizado
                  const finalEmbed = new EmbedBuilder()
                    .setTitle("🎉 Sorteo Finalizado")
                    .setDescription(
                      ganador
                        ? `**Ganador:** <@${ganador.id}>\n**Premio:** ${premio}\n**Patrocinador:** ${patrocinador}`
                        : "No hubo participantes válidos."
                    )
                    .setColor("#43e97b")
                    .setFooter({ text: "Sorteo VK Community" })
                    .setTimestamp();
                  if (imagen && imagen.startsWith("http")) finalEmbed.setImage(imagen);

                  await sorteoChannel.send({ content: ganador ? `<@${ganador.id}>` : "@everyone", embeds: [finalEmbed] });
                } catch (err) {
                  console.error("Error finalizando sorteo:", err);
                }
              }, ms);
            }
          });

          // Comando vk sorteos (ver historial)
          client.on("messageCreate", async (message) => {
            if (message.author.bot || !message.guild) return;
            if (!message.content.startsWith(prefix)) return;
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const cmd = args.shift()?.toLowerCase();

            if (cmd === "sorteos") {
              sorteosDb.all(`SELECT * FROM sorteos ORDER BY id DESC LIMIT 10`, [], (err, rows) => {
                if (err || !rows.length) return message.reply("No hay sorteos registrados.");
                const embed = new EmbedBuilder()
                  .setTitle("🎉 Historial de Sorteos")
                  .setColor("#ffb300")
                  .setDescription(
                    rows.map(s =>
                      `• **${s.titulo}** | Ganador: ${s.ganador_id ? `<@${s.ganador_id}>` : "Sin ganador"} | <t:${Math.floor(s.finaliza / 1000)}:F>`
                    ).join("\n")
                  )
                  .setFooter({ text: "VK Community - Sorteos" });
                message.channel.send({ embeds: [embed] });
              });
            }
          });


          // Comando vk leaderboard (mover al lugar correcto)
          client.on("messageCreate", async (message) => {
            if (message.author.bot || !message.guild) return;
            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const cmd = args.shift()?.toLowerCase();

            if (cmd === "leaderboard" || cmd === "top") {
              levelsDb.all(`SELECT * FROM levels ORDER BY level DESC, xp DESC LIMIT 10`, [], async (err, rows) => {
                if (err || !rows.length) {
                  return message.reply("No hay datos de niveles aún.");
                }

                const embed = new EmbedBuilder()
                  .setTitle("🏆 Tabla de Clasificación de Niveles")
                  .setColor("#ffd700")
                  .setDescription(
                    await Promise.all(rows.map(async (row, index) => {
                      try {
                        const user = await client.users.fetch(row.user_id);
                        const medal = index < 3 ? ["🥇", "🥈", "🥉"][index] : `${index + 1}.`;
                        return `${medal} **${user.username}** - Nivel ${row.level} (${row.xp} XP)`;
                      } catch (error) {
                        return `${index + 1}. Usuario desconocido - Nivel ${row.level} (${row.xp} XP)`;
                      }
                    })).then(descriptions => descriptions.join("\n"))
                  )
                  .setFooter({ text: "VK Community - Sistema de Niveles" })
                  .setTimestamp();

                return message.channel.send({ embeds: [embed] });
              });
            }
          });

          // Tutorial de sorteos 
          client.once("ready", async () => {
            const adminChannelId = "1394028954527989940";
            const adminChannel = client.channels.cache.get(adminChannelId);
            if (adminChannel) {
              const messages = await adminChannel.messages.fetch({ limit: 10 });
              const tutorialExists = messages.some(
                m => m.author.id === client.user.id && m.embeds.length && m.embeds[0].title?.includes("Tutorial Sorteos VK")
              );
              if (!tutorialExists) {
                const embed = new EmbedBuilder()
                  .setTitle("🎉 Tutorial Sorteos VK")
                  .setDescription(
                    `
          **¿Cómo crear un sorteo automático?**

          \`vk sorteo canalID | título | patrocinador | rol requerido | duración(h/d) | imagen(opcional) | premio\`

          • **canalID:** ID del canal donde se publicará el sorteo
          • **título:** Nombre del sorteo
          • **patrocinador:** Quien lo patrocina
          • **rol requerido:** ID del rol necesario para participar (o vacío para @everyone)
          • **duración:** Ejemplo: 2h, 1d
          • **imagen:** URL de imagen opcional
          • **premio:** Descripción del premio

          **Ejemplo:**
          \`vk sorteo 123456789012345678 | Nitro | VK Team | 987654321098765432 | 2h | https://ejemplo.com/nitro.png | Discord Nitro\`

          Al finalizar, el ganador se anunciará automáticamente y el embed original se borrará.
          `
                  )
                  .setColor("#ffb300")
                  .setFooter({ text: "Sistema de sorteos VK Community" });
                await adminChannel.send({ embeds: [embed] });
              }
            }
          });

          // Iniciar bot
          client.login(process.env.DISCORD_TOKEN);

          // Iniciar servidor web
          require("./server.js");

