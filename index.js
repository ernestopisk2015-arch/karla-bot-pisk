const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const http = require('http');

// Servidor para que Railway no apague el bot
http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Karla Online");
}).listen(process.env.PORT || 8080);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

async function conectarWA() {
    // Esto crea una carpeta para guardar tu sesión
    const { state, saveCreds } = await useMultiFileAuthState('sesion_karla');

    const sock = makeWASocket({
        auth: state,
        browser: ["Karla Bot", "Chrome", "1.0.0"],
        logger: require('pino')({ level: 'silent' }) // Esto oculta avisos molestos
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        // AQUÍ ES DONDE APARECE EL QR
        if (qr) {
            console.log("\n\n--- ⬇️ ESCANEA ESTE CÓDIGO CON TU WHATSAPP ⬇️ ---");
            qrcode.generate(qr, { small: true });
            console.log("--- ⬆️ SI SE VE RARO, ALEJA EL ZOOM (CTRL y -) ⬆️ ---\n\n");
        }

        if (connection === 'close') {
            const errorStatus = lastDisconnect?.error?.output?.statusCode;
            if (errorStatus !== DisconnectReason.loggedOut) {
                console.log("Reconectando...");
                conectarWA();
            }
        } else if (connection === 'open') {
            console.log("✅ ¡CONECTADO! Karla está lista para responder.");
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const texto = m.message.conversation || m.message.extendedTextMessage?.text;
        if (!texto) return;

        try {
            const res = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "Eres Karla de Neo Pisk 🐯. Responde ruda y breve (15 palabras max)." },
                    { role: "user", content: texto }
                ],
                model: "llama-3.3-70b-versatile",
            });
            await sock.sendMessage(m.key.remoteJid, { text: res.choices[0].message.content });
        } catch (e) { console.log("Error de IA:", e.message); }
    });
}

conectarWA();
    
