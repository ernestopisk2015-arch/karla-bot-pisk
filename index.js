const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const http = require('http');

// Servidor para Railway
http.createServer((req, res) => { res.end("Karla Online"); }).listen(process.env.PORT || 8080);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function conectarWA() {
    const { state, saveCreds } = await useMultiFileAuthState('sesion_definitiva');
    const sock = makeWASocket({
        auth: state,
        browser: ["Karla Bot", "Chrome", "1.0.0"],
        logger: require('pino')({ level: 'silent' }) // Esto apaga los avisos molestos
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) {
            console.log("\n\n\n--- ⬇️ ESCANEA AQUÍ ABAJO ⬇️ ---");
            // Generamos el QR un poco más grande para que Railway no lo rompa
            qrcode.generate(qr, { small: false }); 
            console.log("--- ⬆️ ESCANEA AQUÍ ARRIBA ⬆️ ---\n\n\n");
        }
        if (connection === 'open') console.log("✅ KARLA CONECTADA!");
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const texto = m.message.conversation || m.message.extendedTextMessage?.text;
        if (texto) {
            const res = await groq.chat.completions.create({
                messages: [{ role: "system", content: "Eres Karla de Neo Pisk 🐯. Ruda y breve." }, { role: "user", content: texto }],
                model: "llama-3.3-70b-versatile",
            });
            await sock.sendMessage(m.key.remoteJid, { text: res.choices[0].message.content });
        }
    });
}
conectarWA();
