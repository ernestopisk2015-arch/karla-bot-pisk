const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const http = require('http');

http.createServer((req, res) => {
    res.write("Karla Status: Online");
    res.end();
}).listen(process.env.PORT || 8080);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function conectarWA() {
    // Usamos un nombre de carpeta diferente para limpiar errores previos
    const { state, saveCreds } = await useMultiFileAuthState('sesion_nueva_karla');

    const sock = makeWASocket({
        auth: state,
        browser: ["Karla Bot", "Chrome", "1.0.0"],
        logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n--- ESCANEA ESTE CÓDIGO QR ---");
            qrcode.generate(qr, { small: true });
            console.log("------------------------------\n");
        }

        if (connection === 'close') {
            const debeReconectar = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Conexión cerrada. ¿Reintentando?:', debeReconectar);
            if (debeReconectar) {
                // Esperamos 5 segundos antes de reintentar para evitar el bucle infinito
                setTimeout(() => conectarWA(), 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ ¡VICTORIA! Karla está conectada.');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const textoRecibido = m.message.conversation || m.message.extendedTextMessage?.text;
        if (!textoRecibido) return;

        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "Eres Karla de Neo Pisk 🐯. Responde ruda y breve (máximo 15 palabras). Cierra con: https://t.me/NeoPisk_bot" },
                    { role: "user", content: textoRecibido }
                ],
                model: "llama-3.3-70b-versatile",
            });
            await sock.sendMessage(m.key.remoteJid, { text: completion.choices[0].message.content });
        } catch (e) { console.log("Error en Groq"); }
    });
}

conectarWA();
