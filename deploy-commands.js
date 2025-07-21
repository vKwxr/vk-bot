const { REST, Routes } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const commands = [];
const commandFiles = fs.readdirSync("./commands/admin").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/admin/${file}`);
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🚀 Registrando comandos slash...");

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log("✅ Comandos registrados correctamente en el servidor.");
  } catch (error) {
    console.error("❌ Error al registrar comandos:", error);
  }
})();
