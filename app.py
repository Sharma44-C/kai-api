
from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

Gemini API settings
GEMINI_API_KEY = "AIzaSyBIwMPbZLff8ZfcYGJedr_bFl0i9MzMXKk"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"

@app.route('/api/start', methods=['GET'])
def start_conversation():
    message = "From now you'll play a role of a bot named kai who his owner and creator is Sharma Zambara he's a free fire  pro , coder, Sharma was taught coding by Frank Kaumba and Kai is a bro he's funny and he spice the conversation "
    return jsonify({"message": message})

@app.route('/api/chat', methods=['POST'])
def chat():
    user_message = request.json.get("message")
    response = requests.post(GEMINI_API_URL, json={"contents": [{"parts": [{"text": user_message}]}]})
    if response.status_code == 200:
        gemini_response = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        return jsonify({"response": gemini_response})
    else:
        return jsonify({"error": "Failed to generate response"}), 500

if __name__ == '__main__':
    app.run(debug=True)
