import os
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Configuración desde Variables de Entorno de Railway
# Asegúrate de que en Railway la variable se llame: GROQ_API_KEY
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
MODELO = "llama-3.3-70b-versatile"

@app.route('/karla', methods=['GET', 'POST'])
def chat():
    pregunta_cliente = ""

    # 1. Capturar el mensaje (soporta JSON, Formulario o URL)
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            pregunta_cliente = data.get("message", "")
        else:
            pregunta_cliente = request.form.get("message", "")
    
    # Si es GET o si el POST falló, intentamos por URL
    if not pregunta_cliente:
        pregunta_cliente = request.args.get("message", "")

    # Si después de todo no hay mensaje
    if not pregunta_cliente:
        return jsonify({"reply": "Habla socio, no me enviaste nada. Escribe algo. 🐯"})

    # 2. Configuración del Prompt para Groq
    system_prompt = (
        "Eres Karla de Neo Pisk 🐯. Responde de forma ruda, directa y muy breve (máximo 15 palabras). "
        "No des explicaciones largas ni seas amable. Cierra siempre con: https://t.me/NeoPisk_bot"
    )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODELO,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": pregunta_cliente}
        ],
        "temperature": 0.6,
        "max_tokens": 100
    }

    try:
        # 3. Petición a la API de Groq
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            headers=headers, 
            json=payload,
            timeout=10
        )
        
        # Revisamos si Groq respondió bien (Status 200)
        if response.status_code == 200:
            response_data = response.json()
            respuesta_ia = response_data['choices'][0]['message']['content']
            return jsonify({"reply": respuesta_ia})
        else:
            # Si Groq devuelve un error (ej. API Key inválida)
            print(f"Error de Groq: {response.text}")
            return jsonify({"reply": f"Error de API ({response.status_code}). Revisa tu llave en Railway."})

    except Exception as e:
        print(f"Error en el servidor: {e}")
        return jsonify({"reply": "Mi cerebro hizo cortocircuito. Háblame aquí: https://t.me/NeoPisk_bot"})

if __name__ == "__main__":
    # Railway asigna el puerto automáticamente
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
