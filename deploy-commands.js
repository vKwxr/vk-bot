const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && typeof command.data.toJSON === 'function') {
      commands.push(command.data.toJSON());
    } else {
      console.warn(`⚠️ El archivo ${file} no tiene .data válido`);
    }
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    if (!commands.length) {
      console.warn('⚠️ No se encontraron comandos para registrar.');
      return;
    }

    console.log('🚀 Registrando comandos slash...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), 
      
      { body: commands }
    );

    console.log(`✅ ${commands.length} comando(s) registrados exitosamente.`);
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();
