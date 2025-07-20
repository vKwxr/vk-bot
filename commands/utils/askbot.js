
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('askbot')
    .setDescription('🤖 Pregunta sobre comandos y funciones del bot VK')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('Tu pregunta sobre el bot VK')
        .setRequired(true)
    ),

  name: 'askbot',
  description: 'IA especializada en el bot VK',
  usage: 'vk askbot <pregunta>',

  async execute(interaction, client) {
    const pregunta = interaction.options.getString('pregunta');
    await this.handleAskBot(interaction, pregunta, client);
  },

  async run(message, args, client) {
    if (!args.length) {
      return message.reply('❌ **Debes hacer una pregunta sobre el bot**\n📝 Uso: `vk askbot <pregunta>`');
    }

    const pregunta = args.join(' ');
    await this.handleAskBot(message, pregunta, client);
  },

  async handleAskBot(context, pregunta, client) {
    const isInteraction = context.replied !== undefined;
    
    try {
      const respuesta = this.getBotResponse(pregunta.toLowerCase());
      
      const embed = new EmbedBuilder()
        .setTitle('🤖 VK Bot Assistant')
        .setDescription(respuesta)
        .setColor('#9966ff')
        .setFooter({ text: 'VK Bot Assistant • Especialista en comandos del bot' })
        .setThumbnail('https://cdn.discordapp.com/avatars/bot-id/avatar.png')
        .setTimestamp();

      return isInteraction 
        ? await context.reply({ embeds: [embed] })
        : await context.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error en askbot:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error de VK Bot Assistant')
        .setDescription('No pude procesar tu pregunta. Inténtalo de nuevo.')
        .setColor('#ff0000');

      return isInteraction 
        ? await context.reply({ embeds: [errorEmbed], ephemeral: true })
        : await context.reply({ embeds: [errorEmbed] });
    }
  },

  getBotResponse(pregunta) {
    // Respuestas sobre comandos específicos
    if (pregunta.includes('comandos') || pregunta.includes('help') || pregunta.includes('ayuda')) {
      return `📚 **Lista completa de comandos VK Bot**

**🛡️ MODERACIÓN (Slash & Prefix vk)**
• \`/ban\` o \`vk ban\` - Banear usuarios
• \`/kick\` o \`vk kick\` - Expulsar usuarios  
• \`/warn\` o \`vk warn\` - Advertir usuarios
• \`/clear\` o \`vk clear\` - Borrar mensajes
• \`/timeout\` o \`vk mute\` - Silenciar usuarios

**💰 ECONOMÍA (Slash & Prefix vk)**
• \`/balance\` o \`vk balance\` - Ver tu dinero
• \`/daily\` o \`vk daily\` - Recompensa diaria
• \`/weekly\` o \`vk weekly\` - Recompensa semanal
• \`/work\` o \`vk work\` - Trabajar por dinero
• \`/shop\` o \`vk shop\` - Ver la tienda
• \`/buy\` o \`vk buy\` - Comprar items

**🎮 DIVERSIÓN (Slash & Prefix vk)**
• \`/hug\` o \`vk hug\` - Abrazar usuarios
• \`/kiss\` o \`vk kiss\` - Besar usuarios
• \`/pat\` o \`vk pat\` - Acariciar usuarios
• \`/poke\` o \`vk poke\` - Tocar usuarios

**🆙 NIVELES (Slash & Prefix vk)**
• \`/level\` o \`vk level\` - Ver tu nivel
• \`/rank\` o \`vk rank\` - Ver ranking

**🛠️ UTILIDADES (Slash & Prefix vk)**
• \`/ask\` o \`vk ask\` - IA general avanzada
• \`/askbot\` o \`vk askbot\` - IA del bot (yo!)
• \`/avatar\` o \`vk avatar\` - Ver avatar
• \`/serverinfo\` o \`vk serverinfo\` - Info del servidor

**Servidor oficial:** https://discord.gg/3Nm8WsgmmU`;
    }

    if (pregunta.includes('tienda') || pregunta.includes('shop') || pregunta.includes('comprar')) {
      return `🛒 **Sistema de Tienda VK**

**¿Cómo funciona?**
1️⃣ Usa \`/shop\` o \`vk shop\` para ver los artículos
2️⃣ Gana dinero con \`/daily\`, \`/weekly\`, \`/work\`
3️⃣ Compra con \`/buy <nombre del item>\`
4️⃣ Para roles/recompensas, crea un ticket de tipo "Recompensas"

**💎 Items Especiales:**
• **Crear Rol Personalizado** (20,000 coins) - Te permite usar \`/createrole\` para crear roles únicos
• **Roles VIP** - Roles exclusivos del servidor
• **Boosts de XP** - Acelera tu progreso de niveles

**💡 Consejo:** Los administradores pueden añadir nuevos items con \`/shopmanager\``;
    }

    if (pregunta.includes('ticket') || pregunta.includes('soporte') || pregunta.includes('ayuda')) {
      return `🎫 **Sistema de Tickets VK**

**¿Cómo crear un ticket?**
1️⃣ Usa el panel de tickets (creado por admins con \`/paneltickets\`)
2️⃣ Selecciona el tipo apropiado:
   • 🛠️ **Soporte Técnico** - Problemas con comandos
   • 🚨 **Reportar Usuario** - Comportamientos inadecuados  
   • 💡 **Sugerencias** - Ideas para mejorar
   • ⚖️ **Apelaciones** - Disputar sanciones
   • 🤝 **Partnership** - Colaboraciones
   • 🛒 **Recompensas** - Reclamar compras de la tienda
   • ❓ **Otros** - Consultas generales

**⚠️ Reglas importantes:**
• Solo 1 ticket abierto por usuario
• No crear tickets falsos (puede resultar en sanciones)
• Proporciona información detallada`;
    }

    if (pregunta.includes('nivel') || pregunta.includes('level') || pregunta.includes('xp') || pregunta.includes('experiencia')) {
      return `🆙 **Sistema de Niveles VK**

**¿Cómo funciona?**
• Ganas XP automáticamente enviando mensajes
• Cada 1000 XP subes de nivel
• Usa \`/level\` o \`vk level\` para ver tu progreso
• Usa \`/rank\` o \`vk rank\` para ver el leaderboard

**💫 Características:**
• Imágenes de nivel personalizadas
• Soporte para avatares GIF
• Ranking global del servidor
• XP por participación activa

**🚀 Tip:** Mantente activo en el chat para subir niveles más rápido!`;
    }

    if (pregunta.includes('economia') || pregunta.includes('dinero') || pregunta.includes('coins') || pregunta.includes('trabajo')) {
      return `💰 **Sistema de Economía VK**

**💸 Ganar Dinero:**
• \`/daily\` o \`vk daily\` - 500-1500 coins (24h cooldown)
• \`/weekly\` o \`vk weekly\` - 2000-5000 coins (7 días cooldown)
• \`/work\` o \`vk work\` - 100-800 coins (1h cooldown)

**🏦 Gestionar Dinero:**
• \`/balance\` o \`vk balance\` - Ver tu dinero
• \`/deposit\` o \`vk deposit\` - Depositar en el banco
• \`/withdraw\` o \`vk withdraw\` - Retirar del banco
• \`/donate\` o \`vk donate\` - Donar a otros usuarios

**🛒 Gastar Dinero:**
• \`/shop\` - Ver la tienda
• \`/buy <item>\` - Comprar artículos

**💡 Estrategia:** Deposita dinero en el banco para evitar perderlo!`;
    }

    if (pregunta.includes('moderacion') || pregunta.includes('ban') || pregunta.includes('kick') || pregunta.includes('warn')) {
      return `🛡️ **Sistema de Moderación VK**

**🔨 Comandos de Moderación (Solo Staff):**
• \`/ban @usuario [razón]\` - Banear permanentemente
• \`/kick @usuario [razón]\` - Expulsar del servidor
• \`/warn @usuario <razón>\` - Dar advertencia
• \`/timeout @usuario <tiempo>\` - Silenciar temporalmente
• \`/clear <cantidad>\` - Borrar mensajes

**📋 Consultar Historial:**
• \`/warnings @usuario\` - Ver advertencias de un usuario

**⚙️ Comandos Admin:**
• \`/paneltickets\` - Crear panel de tickets
• \`/shopmanager\` - Gestionar tienda
• \`/addrole\` - Asignar roles

**🔐 Permisos:** Requiere roles de Staff/Admin configurados`;
    }

    if (pregunta.includes('prefix') || pregunta.includes('vk ')) {
      return `⚡ **Sistema de Prefijos VK**

**🎯 Prefijo Principal:** \`vk\`

**✅ Ambos formatos funcionan:**
• Comandos Slash: \`/comando\`
• Comandos Prefix: \`vk comando\`

**📝 Ejemplos:**
• \`/balance\` = \`vk balance\`
• \`/level\` = \`vk level\`  
• \`/shop\` = \`vk shop\`
• \`/ask pregunta\` = \`vk ask pregunta\`

**💡 Ventajas del Prefix vk:**
• Más rápido de escribir
• Funciona en todos los canales
• Ideal para comandos frecuentes

**🚀 Tip:** Usa el que prefieras, ¡ambos hacen lo mismo!`;
    }

    if (pregunta.includes('ai') || pregunta.includes('ia') || pregunta.includes('ask') || pregunta.includes('askbot')) {
      return `🧠 **Sistema de IA VK**

**🤖 VK Bot Assistant (vk askbot):**
• Especializado en comandos del bot
• Responde dudas sobre funciones
• Lista todos los comandos disponibles
• Explica cómo usar cada función

**🧠 VK AI (vk ask):**
• IA general avanzada
• Responde cualquier pregunta
• Genera imágenes contextuales con Giphy
• Memoria de datos del servidor (birthdays, etc.)

**💡 ¿Cuál usar?**
• \`vk askbot\` - Para dudas sobre el bot
• \`vk ask\` - Para preguntas generales

**🌐 Servidor oficial:** https://discord.gg/3Nm8WsgmmU`;
    }

    if (pregunta.includes('crear rol') || pregunta.includes('createrole') || pregunta.includes('role')) {
      return `🎨 **Crear Roles Personalizados VK**

**💰 Costo:** 20,000 VK Coins (Gratis para admins)

**🛒 ¿Cómo obtenerlo?**
1️⃣ Usa \`/buy Crear Rol Personalizado\` 
2️⃣ Una vez comprado, puedes usar \`/createrole\`

**⚙️ Uso del comando:**
\`/createrole nombre:#color:separado\`
• **Nombre:** Nombre del rol (máx. 50 caracteres)
• **Color:** Código hex (#ff0000 para rojo)
• **Separado:** Si aparece separado en la lista

**📝 Ejemplo:**
\`/createrole Mi Rol #ff0000 true\`

**✨ Características:**
• Rol único y personalizado
• Tu eliges nombre y color  
• Se te asigna automáticamente
• Permiso permanente tras comprar`;
    }

    // Respuesta por defecto si no encuentra coincidencia específica
    return `🤖 **VK Bot Assistant**

No encontré información específica sobre "${pregunta}", pero puedo ayudarte con:

**📚 Temas que domino:**
• Lista completa de comandos (\`comandos\`)
• Sistema de tienda (\`tienda\`)
• Crear tickets (\`tickets\`) 
• Sistema de niveles (\`niveles\`)
• Economía y dinero (\`economia\`)
• Moderación (\`moderacion\`)
• Prefijos (\`prefix\`)
• Inteligencias artificiales (\`ai\`)
• Crear roles personalizados (\`crear rol\`)

**💡 Tip:** Haz una pregunta más específica como "¿cómo funciona la tienda?" o "lista de comandos"

**🌐 Servidor oficial:** https://discord.gg/3Nm8WsgmmU`;
  }
};
