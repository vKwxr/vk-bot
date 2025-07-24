const path = require('path');

module.exports = {
  editarSorteo: (id, nuevoPremio) => {
    return `🎁 Sorteo ${id} editado. Nuevo premio: ${nuevoPremio}`;
  },
  revertirSorteo: (id) => {
    return `⏪ Sorteo ${id} ha sido revertido.`;
  }
};
