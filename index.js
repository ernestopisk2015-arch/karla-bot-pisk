const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const http = require('http');

// Servidor para Railway
http.createServer((req, res) => { res.end("Karla Online"); }).listen(process.env.PORT || 8080);

async function conectarWA() {
    console.log("🛠️ Intentando generar nuevo código QR...");
    
    // Cambiamos el nombre de la carpeta para forzar un QR nuevo
    const { state, saveCreds } = await useMultiFileAuthState('sesion_emergencia_v3');

    const sock = makeWASocket({
        auth: state,
        browser: ["Karla Bot", "Chrome", "1.0.0"],
        logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n✅ ¡AQUÍ ESTÁ! ESCANEA RÁPIDO:");
            qrcode.generate(qr, { small: true });
            console.log("Si no ves un cuadrado, aleja el zoom (Ctrl y -)\n");
        }

        if (connection === 'close') {
            const error = lastDisconnect?.error?.output?.statusCode;
            console.log("Conexión cerrada. Código:", error);
            console.log("Reintentando en 10 segundos...");
            setTimeout(() => conectarWA(), 10000);
        } else if (connection === 'open') {
            console.log("✅ ¡CONECTADO EXITOSAMENTE!");
        }
    });
}

conectarWA().catch(err => console.log("Error fatal:", err));

