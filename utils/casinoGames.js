const path = require('path');

module.exports = {
  jugarRuleta: () => {
    const opciones = ["🔴 Rojo", "⚫ Negro", "🟢 Verde"];
    const resultado = opciones[Math.floor(Math.random() * opciones.length)];
    return resultado;
  },
  jugarSlot: () => {
    const simbolos = ["🍒", "🍋", "🔔", "⭐", "7️⃣"];
    const resultado = [0, 0, 0].map(() => simbolos[Math.floor(Math.random() * simbolos.length)]);
    return resultado;
  }
};
