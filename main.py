import os
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Configuración de la API Key desde las variables de Railway
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODELO = "llama-3.3-70b-versatile"

@app.route('/karla', methods=['GET', 'POST'])
def chat():
    pregunta_cliente = ""

    # 1. Intentar obtener el mensaje si viene por POST (JSON)
    if request.method == 'POST':
        if request.is_json:
            data = request.json
            pregunta_cliente = data.get("message", "")
        else:
            pregunta_cliente = request.form.get("message", "")

    # 2. Intentar obtener el mensaje si viene por GET (en la URL)
    if not pregunta_cliente:
        pregunta_cliente = request.args.get("message", "")

    # Si no hay mensaje, responder algo por defecto
    if not pregunta_cliente:
        return jsonify({"reply": "Habla socio, no me enviaste ningún mensaje. 🐯"})

    # 3. Configuración del prompt rudo de Karla
    prompt_sistema = (
        "Eres Karla de Neo Pisk 🐯. Responde de forma ruda, directa y muy breve (máximo 15 palabras). "
        "No des explicaciones largas. Cierra siempre con: https://t.me/NeoPisk_bot"
    )

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
        # 4. Petición a la Inteligencia Artificial de Groq
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        response_data = response.json()
        respuesta_ia = response_data['choices'][0]['message']['content']
        return jsonify({"reply": respuesta_ia})
    except Exception as e:
        # Por si falla la API Key o la conexión
        return jsonify({"reply": "Tengo un problema en el cerebro. Háblame por aquí: https://t.me/NeoPisk_bot"})

if __name__ == "__main__":
    # Railway usa el puerto 8080 por defecto
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
