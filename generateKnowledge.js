const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'comandos'); // Cambia a 'commands' si tu carpeta se llama así
const outputPath = path.join(__dirname, 'botKnowledge.json');

const categories = fs.readdirSync(commandsPath).filter(folder =>
  fs.statSync(path.join(commandsPath, folder)).isDirectory()
);

let sections = [];

for (const category of categories) {
  const categoryPath = path.join(commandsPath, category);
  const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

  const commandDescriptions = [];

  for (const file of commandFiles) {
    try {
      const command = require(path.join(categoryPath, file));
      const name = command.name || path.parse(file).name;
      const description = command.description || 'Sin descripción.';
      const slash = command.data?.name ? `\`/${command.data.name}\`` : '';
      const prefix = name.startsWith('vk ') ? `\`${name}\`` : `\`vk ${name}\``;

      const usage = slash && prefix !== slash ? `${slash} y ${prefix}` : (slash || prefix);

      commandDescriptions.push(`- ${usage}: ${description}`);
    } catch (err) {
      console.warn(`⚠️ Error leyendo el comando ${file}:`, err.message);
    }
  }

  if (commandDescriptions.length > 0) {
    sections.push(`### ${category.toUpperCase()}\n${commandDescriptions.join('\n')}`);
  }
}

const knowledgeContent = `
Eres un asistente experto del bot de Discord llamado VK. Conoces todas sus funciones actualizadas.

Este es el resumen completo de los comandos del bot, organizados por categoría:

${sections.join('\n\n')}

Responde preguntas como:
- ¿Cómo configuro los tickets?
- ¿Qué hace el comando /daily?
- ¿Qué comandos hay para diversión?
- ¿Cómo funcionan los niveles?
- ¿Qué comandos tiene VK de moderación?
`;

fs.writeFileSync(outputPath, JSON.stringify({ content: knowledgeContent.trim() }, null, 2));

console.log('✅ Archivo botKnowledge.json generado correctamente.');
