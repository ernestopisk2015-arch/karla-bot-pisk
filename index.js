const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const http = require('http');

http.createServer((req, res) => { res.end("Karla Online"); }).listen(process.env.PORT || 8080);

async function conectarWA() {
    const { state, saveCreds } = await useMultiFileAuthState('sesion_final');
    const sock = makeWASocket({
        auth: state,
        browser: ["Karla Bot", "Chrome", "1.0.0"],
        logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n\n#########################################");
            console.log("¡DETENTE! ESCANEA ESTE CÓDIGO AHORA:");
            qrcode.generate(qr, { small: true });
            console.log("#########################################\n\n");
        }

        if (connection === 'close') {
            const error = lastDisconnect?.error?.output?.statusCode;
            // Si no es un cierre voluntario, esperamos 15 segundos (más tiempo para ti)
            console.log("Esperando para reintentar... No cierres los logs.");
            setTimeout(() => conectarWA(), 15000);
        } else if (connection === 'open') {
            console.log("✅ ¡CONECTADO EXITOSAMENTE!");
        }
    });
}
conectarWA();
