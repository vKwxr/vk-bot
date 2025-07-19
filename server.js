const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Ruta principal
app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VK Community Bot Status</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background: linear-gradient(135deg, #9966ff 0%, #6633cc 100%);
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                color: white;
            }
            .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 2rem;
                border-radius: 20px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            }
            h1 { font-size: 2.5rem; margin-bottom: 1rem; }
            .status { font-size: 1.2rem; margin-bottom: 2rem; }
            .badge {
                display: inline-block;
                background: #43a047;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 25px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>👑 VK Community Bot</h1>
            <div class="status">
                <span class="badge">✅ Bot Online</span>
            </div>
            <p>El bot de VK Community está funcionando correctamente</p>
            <p>Uptime: ${Math.floor(process.uptime())} segundos</p>
        </div>
    </body>
    </html>
  `);
});

// Ruta de estado del bot
app.get("/status", (req, res) => {
    res.json({
        status: "online",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Servidor web iniciado en puerto ${PORT}`);
});