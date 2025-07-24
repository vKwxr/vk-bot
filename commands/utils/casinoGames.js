const path = require('path');
module.exports = {
    rollDice: () => {
        return Math.floor(Math.random() * 6) + 1; // Simula tirar un dado
    },
    playRoulette: () => {
        const outcomes = ['red', 'black', 'green'];
        return outcomes[Math.floor(Math.random() * outcomes.length)];
    }
};