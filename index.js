const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const http = require('http');

// Servidor para Railway
http.createServer((req, res) => { res.end("Karla Online"); }).listen(process.env.PORT || 8080);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

async function conectarWA() {
    // Usamos un nombre de sesión nuevo para limpiar errores previos
    const { state, saveCreds } = await useMultiFileAuthState('sesion_limpia');

    const sock = makeWASocket({
        auth: state,
        browser: ["Karla Bot", "Chrome", "1.0.0"],
        logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n\n--- ⬇️ CÓDIGO QR (ESCANEA RÁPIDO) ⬇️ ---");
            qrcode.generate(qr, { small: true });
            console.log("------------------------------------------\n\n");
        }

        if (connection === 'close') {
            const errorStatus = lastDisconnect?.error?.output?.statusCode;
            console.log("Conexión cerrada. Motivo:", errorStatus);
            
            // EL TRUCO: Esperar 10 segundos antes de reintentar
            console.log("Esperando 10 segundos para reintentar...");
            setTimeout(() => conectarWA(), 10000);
        } else if (connection === 'open') {
            console.log("✅ KARLA CONECTADA!");
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const texto = m.message.conversation || m.message.extendedTextMessage?.text;
        if (texto) {
            try {
                const res = await groq.chat.completions.create({
                    messages: [{ role: "system", content: "Eres Karla. Ruda y breve." }, { role: "user", content: texto }],
                    model: "llama-3.3-70b-versatile",
                });
                await sock.sendMessage(m.key.remoteJid, { text: res.choices[0].message.content });
            } catch (e) { console.log("Error IA"); }
        }
    });
}

conectarWA();
    
