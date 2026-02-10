const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const http = require('http');

// Servidor para que Railway no lo apague
http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Karla Online");
}).listen(process.env.PORT || 8080);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session_karla');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Karla Bot", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("\n⬇️ ESCANEA ESTE QR CON WHATSAPP ⬇️\n");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log("✅ KARLA CONECTADA Y VIVA");
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const msgText = m.message.conversation || m.message.extendedTextMessage?.text;
        if (!msgText) return;

        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "Eres Karla de Neo Pisk 🐯. Responde ruda y breve (15 palabras max)." },
                    { role: "user", content: msgText }
                ],
                model: "llama-3.3-70b-versatile",
            });
            await sock.sendMessage(m.key.remoteJid, { text: completion.choices[0].message.content });
        } catch (e) { console.log("Error Groq:", e.message); }
    });
}

startBot().catch(err => console.log("Error critico:", err));
