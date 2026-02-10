const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const http = require('http');

http.createServer((req, res) => { res.end("Karla Online"); }).listen(process.env.PORT || 8080);

async function conectarWA() {
    // CAMBIAMOS EL NOMBRE A UNO TOTALMENTE NUEVO
    const { state, saveCreds } = await useMultiFileAuthState('limpieza_total_999');

    const sock = makeWASocket({
        auth: state,
        browser: ["Karla Bot", "Chrome", "1.0.0"],
        logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n⚠️ ¡ELIMINADO ERROR 405! ESCANEA AHORA:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log("Cerrado con código:", statusCode);
            
            // Si es 405 o error de sesión, borramos memoria interna si fuera posible, 
            // pero aquí solo esperaremos un poco más.
            setTimeout(() => conectarWA(), 15000);
        } else if (connection === 'open') {
            console.log("✅ ¡POR FIN! CONECTADO.");
        }
    });
}
conectarWA();
