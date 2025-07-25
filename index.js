require("dotenv").config();

const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();

const dbPath = (file) => path.join(__dirname, '..', file);

const db = new sqlite3.Database(dbPath("moderacion.sqlite"), (err) => {
  if (err) console.error("❌ Error al conectar con la base de datos:", err);
  else console.log("📦 Base de datos conectada correctamente.");
});

const ticketsDb = new sqlite3.Database(dbPath("tickets.sqlite"), (err) => {
  if (err) console.error("❌ Error al conectar con la base de datos de tickets:", err);
  else console.log("🎫 Base de datos de tickets conectada correctamente.");
});

const levelsDb = new sqlite3.Database(dbPath("levels.sqlite"), (err) => {
  if (err) console.error("❌ Error al conectar levels:", err);
  else console.log("🆙 Base de datos de niveles conectada.");
});

const economyDb = new sqlite3.Database(dbPath("economy.sqlite"), (err) => {
  if (err) console.error("❌ Error al conectar economía:", err);
  else console.log("💰 Base de datos de economía conectada.");
});

const sorteosDb = new sqlite3.Database(dbPath("sorteos.sqlite"), (err) => {
  if (err) console.error("❌ Error al conectar sorteos:", err);
  else console.log("🎉 Base de datos de sorteos conectada.");
});


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

  db.run(`CREATE TABLE IF NOT EXISTS birthdays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE,
    birthday TEXT,
    year INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    inviter_id TEXT,
    join_date TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_invites (
    user_id TEXT PRIMARY KEY,
    total_invites INTEGER DEFAULT 0,
    current_invites INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    channel_id TEXT,
    message TEXT,
    remind_at INTEGER,
    created_at INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS confessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    confession TEXT,
    timestamp TEXT,
    anonymous INTEGER DEFAULT 1
  )`);

  // 🔥 NUEVA TABLA USERS
  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    joined_at TEXT,
    server_id TEXT
  )`);
});

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

levelsDb.run(`CREATE TABLE IF NOT EXISTS levels (
  user_id TEXT PRIMARY KEY,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1
)`);

levelsDb.run(`CREATE TABLE IF NOT EXISTS level_config (
  guild_id TEXT PRIMARY KEY,
  level_channel_id TEXT
)`);

economyDb.serialize(() => {
  economyDb.run(`CREATE TABLE IF NOT EXISTS economy (
    user_id TEXT PRIMARY KEY,
    wallet INTEGER DEFAULT 0,
    bank INTEGER DEFAULT 0,
    last_daily TEXT,
    last_weekly TEXT,
    last_work TEXT
  )`);

  economyDb.run(`CREATE TABLE IF NOT EXISTS shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price INTEGER,
    description TEXT,
    emoji TEXT,
    category TEXT,
    stock INTEGER DEFAULT -1
  )`);

  economyDb.run(`CREATE TABLE IF NOT EXISTS user_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    item_id INTEGER,
    quantity INTEGER DEFAULT 1
  )`);

  economyDb.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    job_name TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    cooldown INTEGER
  )`);
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
  ganadores_cantidad INTEGER DEFAULT 1,
  min_invites INTEGER DEFAULT 0,
  participantes TEXT DEFAULT '[]'
)`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildInvites,
  ],
});

client.commands = new Collection();
client.slashCommands = new Collection();

const prefix = "vk";

client.config = {
  prefix,
  STAFF_ROLE_ID: "1394028954079461487",
  ADMIN_ROLE_ID: "1394028954079461488",
  TICKETS_LOGS_CHANNEL_ID: "1394028954527989939",
  LOGS_CHANNEL_ID: "1394028954527989939",
  GIPHY_API_KEY: "Hl1zxEofHCK03N5a4u7LLXhxVfemKWEY",
  db,
  ticketsDb,
  levelsDb,
  economyDb,
  sorteosDb,
};

function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFolders = fs.readdirSync(commandsPath).filter(folder => {
  return fs.statSync(path.join(commandsPath, folder)).isDirectory();
});


  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      try {
        const command = require(filePath);

        if (command.data && command.execute) {
          client.slashCommands.set(command.data.name, command);
          console.log(`✅ Comando slash cargado: ${command.data.name}`);
        }

        if (command.name && command.run) {
          client.commands.set(command.name, command);
          console.log(`✅ Comando prefix cargado: ${command.name}`);
        }
      } catch (error) {
        console.error(`❌ Error cargando comando ${file}:`, error);
      }
    }
  }
}

function loadEvents() {
  const eventsPath = path.join(__dirname, 'events');
  if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      try {
        const event = require(filePath);
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args, client));
        } else {
          client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`✅ Evento cargado: ${event.name}`);
      } catch (error) {
        console.error(`❌ Error cargando evento ${file}:`, error);
      }
    }
  }
}

async function deployCommands() {
  const commands = [];
  client.slashCommands.forEach(command => {
    commands.push(command.data.toJSON());
  });

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`🔄 Registrando ${commands.length} comandos slash...`);

    const existingCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));

    for (const command of commands) {
      try {
        await rest.post(Routes.applicationCommands(process.env.CLIENT_ID), { body: command });
      } catch (cmdError) {
        if (cmdError.code !== 50035) { 
          console.error(`❌ Error registrando comando ${command.name}:`, cmdError.message);
        }
      }
    }

    console.log('✅ Comandos slash registrados correctamente.');
  } catch (error) {
    console.error('❌ Error registrando comandos:', error.message);
  }
}

require(path.join(__dirname, 'generateKnowledge.js'));

loadCommands();
loadEvents();

setTimeout(() => {
  try {
    const shopManager = require(path.join("__dirname\\commands\\admin\\shopmanager.js"));
    if (shopManager.initializeDefaultItems) {
      shopManager.initializeDefaultItems(economyDb);
    }
  } catch (error) {
    console.log('Items de tienda ya inicializados o error menor:', error.message);
  }
}, 2000);

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      const reply = { content: '❌ Error al ejecutar el comando.', ephemeral: true };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
    const handlerFile = path.join(__dirname, 'handlers', `${interaction.customId.split('_')[0]}.js`);
    if (fs.existsSync(handlerFile)) {
      try {
        const handler = require(handlerFile);
        await handler.execute(interaction, client);
      } catch (error) {
        console.error(error);
      }
    }
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.run(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply('❌ Error al ejecutar el comando.');
  }
});

client.once('ready', async () => {
  console.log(`🤖 ${client.user.tag} está conectado!`);
  await deployCommands();
  client.user.setActivity('vK Help | La Romana', { type: 0 });
});

client.on('guildMemberAdd', (member) => {
  const userId = member.user.id;
  const username = member.user.username;
  const joinedAt = new Date().toISOString();
  const serverId = member.guild.id;

  db.run(`
    INSERT OR IGNORE INTO users (user_id, username, joined_at, server_id)
    VALUES (?, ?, ?, ?)
  `, [userId, username, joinedAt, serverId], (err) => {
    if (err) {
      console.error(`❌ Error registrando al usuario ${username} en users:`, err.message);
    } else {
      console.log(`✅ Usuario ${username} registrado en la tabla users.`);
    }
  });
});

client.login(process.env.DISCORD_TOKEN);

const server = require(path.join(__dirname, 'server.js'));
