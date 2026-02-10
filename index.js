const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const http = require('http'); // Para que Railway no lo apague

// Crear un servidor básico para que Railway vea actividad
http.createServer((req, res) => {
    res.write("Karla está viva");
    res.end();
}).listen(process.env.PORT || 8080);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function conectarWA() {
    const { state, saveCreds } = await useMultiFileAuthState('sesion_auth');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Karla Bot", "Chrome", "1.0.0"],
        logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) {
            console.log("⬇️ ESCANEA ESTE QR EN TU WHATSAPP ⬇️");
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') console.log("✅ KARLA ESTÁ VIVA EN TU WHATSAPP");
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const textoRecibido = m.message.conversation || m.message.extendedTextMessage?.text;
        if (!textoRecibido) return;

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "Eres Karla de Neo Pisk 🐯. Responde ruda, directa y breve (máximo 15 palabras). Cierra con: https://t.me/NeoPisk_bot" },
                    { role: "user", content: textoRecibido }
                ],
                model: "llama-3.3-70b-versatile",
            });
            const respuesta = chatCompletion.choices[0].message.content;
            await sock.sendMessage(m.key.remoteJid, { text: respuesta });
        } catch (e) { console.log("Error en Groq"); }
    });
}

conectarWA();
