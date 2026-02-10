const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');
const http = require('http');

// 1. SERVIDOR PARA MANTENER VIVO EL CONTENEDOR EN RAILWAY
http.createServer((req, res) => {
    res.write("Karla Status: Online");
    res.end();
}).listen(process.env.PORT || 8080);

// 2. CONFIGURACIÓN DE LA IA (GROQ)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function llamarAKarla(texto) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Eres Karla de Neo Pisk 🐯. Responde ruda, directa y breve (máximo 15 palabras). Cierra con: https://t.me/NeoPisk_bot" },
                { role: "user", content: texto }
            ],
            model: "llama-3.3-70b-versatile",
        });
        return completion.choices[0].message.content;
    } catch (e) {
        return "Tengo un error en el cerebro. https://t.me/NeoPisk_bot";
    }
}

// 3. FUNCIÓN PRINCIPAL DE WHATSAPP
async function conectarWA() {
    // Esto guarda la sesión para que no tengas que escanear el QR cada vez que reinicies
    const { state, saveCreds } = await useMultiFileAuthState('sesion_auth');

    const sock = makeWASocket({
        auth: state,
        browser: ["Karla Bot", "Chrome", "1.0.0"],
        logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;

        if (qr) {
            console.log("\n--- INICIO DEL CÓDIGO QR ---");
            // small: true suele verse mejor en terminales pequeñas como la de Railway
            qrcode.generate(qr, { small: true });
            console.log("--- ESCANEA ARRIBA CON TU WHATSAPP --- \n");
        }

        if (connection === 'open') {
            console.log("✅ ¡VICTORIA! Karla está conectada y lista.");
        }
        
        if (connection === 'close') {
            console.log("⚠️ Conexión perdida. Reiniciando...");
            conectarWA();
        }
    });

    // 4. ESCUCHAR MENSAJES RECIBIDOS
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const textoRecibido = m.message.conversation || m.message.extendedTextMessage?.text;
        if (!textoRecibido) return;

        console.log(`📩 Mensaje de ${m.key.remoteJid}: ${textoRecibido}`);
        
        const respuesta = await llamarAKarla(textoRecibido);
        await sock.sendMessage(m.key.remoteJid, { text: respuesta });
    });
}

// Mensaje de control para saber que el proceso no se ha colgado
setInterval(() => console.log("⏳ Karla esperando mensajes..."), 30000);

conectarWA();
