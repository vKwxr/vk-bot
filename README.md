
# vK Bot (Versión Reparada ✅)

Bot de Discord con sistema de tickets, economía, juegos, niveles, IA, sorteos y panel web.

## 🚀 Cómo iniciar el bot

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear el archivo `.env`
Debes incluir:
```
TOKEN=tu_token
CLIENT_ID=tu_client_id
GUILD_ID=opcional
```
(O más si usas panel web o bases externas)

### 3. Iniciar el bot
```bash
node index.js
```

## 📁 Archivos clave
- `/utils/casinoGames.js`: lógica de juegos de casino.
- `/utils/giveawayUtils.js`: funciones para editar y revertir sorteos.
- `/commands`: comandos slash y prefijo.
- `generateKnowledge.js`: sistema para generar conocimiento automático del bot.
- `.sqlite`: bases de datos locales para economía, sorteos, niveles, etc.

## 🛠 Funcionalidades
- 🎟️ Sistema de tickets universal
- 🎲 Juegos interactivos: ruleta, trivia, Simon Dice
- 🎁 Sorteos con edición y rollback
- 🧠 IA integrada (según configuración)
- 💰 Economía, niveles, autoroles, etc.

---

> Bot reparado y preparado para producción.
