const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const commands = [];
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🚀 Registrando comandos slash...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Comandos registrados correctamente en el servidor.");
  } catch (error) {
    console.error("❌ Error al registrar comandos:", error);
  }
})();
