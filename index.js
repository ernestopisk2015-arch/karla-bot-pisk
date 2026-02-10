const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const http = require('http');

http.createServer((req, res) => { res.end("Karla Final"); }).listen(process.env.PORT || 8080);

async function conectarWA() {
    // 1. Usamos un nombre de carpeta que NUNCA hayamos usado (v999)
    const { state, saveCreds } = await useMultiFileAuthState('sesion_final_de_verdad_v999');

    const sock = makeWASocket({
        auth: state,
        // 2. IMPORTANTE: Cambiamos a una identidad de Tablet Android
        // Esto a veces salta los bloqueos de "Navegador" (405)
        browser: ["Android (Tablet)", "Chrome", "110.0.0"], 
        logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n\n*****************************************");
            console.log("¡ÚLTIMO INTENTO! ESCANEA ESTE QR:");
            qrcode.generate(qr, { small: true });
            console.log("*****************************************\n\n");
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log("Error final:", statusCode);
            
            // Si falla, esperamos 1 minuto para no saturar
            setTimeout(() => conectarWA(), 60000);
        } else if (connection === 'open') {
            console.log("✅ ¡INCREÍBLE! CONECTADO.");
        }
    });
}
conectarWA();
