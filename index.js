const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const http = require('http');

// Servidor para que Railway no mate el proceso
http.createServer((req, res) => { res.end("Karla Viva"); }).listen(process.env.PORT || 8080);

async function conectarWA() {
    // 1. Usamos una carpeta de sesión que NUNCA hayamos usado antes
    const { state, saveCreds } = await useMultiFileAuthState('sesion_nueva_vida_99');

    const sock = makeWASocket({
        auth: state,
        // 2. Cambiamos la identidad del navegador (Esto salta el error 405)
        browser: ["Karla Bot", "MacOS", "15.0.0"], 
        syncFullHistory: false,
        logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n🚀 ¡LO LOGRAMOS! ESCANEA ESTE QR YA:");
            qrcode.generate(qr, { small: true });
            console.log("Asegúrate de tener el ZOOM alejado (Ctrl y -)\n");
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log("Cerrado con código:", code);
            // Si es 405, esperamos un poco más para que WhatsApp nos perdone
            const delay = code === 405 ? 20000 : 10000;
            setTimeout(() => conectarWA(), delay);
        } else if (connection === 'open') {
            console.log("✅ KARLA ESTÁ CONECTADA!");
        }
    });
}

conectarWA();
