import os
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Aquí el servidor buscará tu llave de forma segura
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODELO = "llama-3.3-70b-versatile"

@app.route('/karla', methods=['POST'])
def chat():
    data = request.json
    pregunta_cliente = data.get("message", "")

    prompt_sistema = "Eres Karla de Neo Pisk 🐯. Responde ruda, directa y breve (máximo 15 palabras). Cierra con: https://t.me/NeoPisk_bot"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODELO,
        "messages": [
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": pregunta_cliente}
        ],
        "max_tokens": 80
    }

    try:
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        respuesta_ia = response.json()['choices'][0]['message']['content']
        return jsonify({"reply": respuesta_ia})
    except:
        return jsonify({"reply": "Habla socio, entra a Telegram: https://t.me/NeoPisk_bot"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))