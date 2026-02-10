const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const http = require('http');
const pino = require('pino');

http.createServer((req, res) => { res.end("Karla Online"); }).listen(process.env.PORT || 8080);

async function conectarWA() {
    // CAMBIAMOS EL NOMBRE DE LA SESIÓN OTRA VEZ
    const { state, saveCreds } = await useMultiFileAuthState('sesion_definitiva_v5');

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        // Cambiamos a Windows para variar la firma de conexión
        browser: ["Windows", "Chrome", "110.0.0"],
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n🔥 ¡AQUÍ ESTÁ EL QR! ESCANEA RÁPIDO 🔥");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log("Cerrado con código:", statusCode);
            
            // Si sigue saliendo 405, esperaremos 30 segundos (más tiempo)
            const waitTime = statusCode === 405 ? 30000 : 10000;
            console.log(`Reintentando en ${waitTime/1000} segundos...`);
            setTimeout(() => conectarWA(), waitTime);
        } else if (connection === 'open') {
            console.log("✅ ¡CONEXIÓN EXITOSA! Karla vive.");
        }
    });
}
conectarWA();
