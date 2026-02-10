const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const http = require('http');

// Servidor para Railway
http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Karla Online");
}).listen(process.env.PORT || 8080);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function conectarWA() {
    // CAMBIO CLAVE: Usamos una carpeta temporal única para evitar el error SIGTERM
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Karla Bot", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n--- ESCANEA ESTE QR ---");
            qrcode.generate(qr, { small: true });
            console.log("-----------------------\n");
        }

        if (connection === 'close') {
            const codigoError = lastDisconnect?.error?.output?.statusCode;
            console.log('Conexión cerrada. Código:', codigoError);
            
            // Solo reiniciamos si no fue porque nos deslogueamos
            if (codigoError !== DisconnectReason.loggedOut) {
                console.log("Reintentando en 10 segundos...");
                setTimeout(() => conectarWA(), 10000);
            }
        } else if (connection === 'open') {
            console.log('✅ CONECTADO CON ÉXITO');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const texto = m.message.conversation || m.message.extendedTextMessage?.text;
        if (!texto) return;

        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "Eres Karla de Neo Pisk 🐯. Responde ruda y breve (15 palabras max). Cierra con: https://t.me/NeoPisk_bot" },
                    { role: "user", content: texto }
                ],
                model: "llama-3.3-70b-versatile",
            });
            await sock.sendMessage(m.key.remoteJid, { text: completion.choices[0].message.content });
        } catch (e) { console.log("Error Groq"); }
    });
}

conectarWA();
