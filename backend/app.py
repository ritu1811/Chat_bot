from flask import Flask, request, jsonify, send_from_directory
from uuid import uuid4
import google.genai as genai
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# 🔐 Gemini API Key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY environment variable is required")

# Configure client (new google.genai API style)
try:
    genai_client = genai.Client(api_key=api_key)
except Exception as e:
    raise RuntimeError(f"Failed to initialize GenAI client: {e}")

# ✅ Working model
model_name = "gemini-3-flash-preview"  # Use available model

# 🧠 Session storage
SESSIONS = {}

# 📋 Interview steps
INTERVIEW_STEPS = [
    {"id": "Introduction", "question": "Hi! I am your virtual HR interviewer. Can you please introduce yourself?"},
    {"id": "Experience", "question": "Can you summarize your most relevant experience?"},
    {"id": "Strength", "question": "What is one strength and one weakness?"},
    {"id": "Challenge", "question": "Describe a challenge and how you solved it."},
    {"id": "Motivation", "question": "Why do you want this job?"},
    {"id": "Questions", "question": "Do you have any questions for us?"}
]

# 🧠 Prompt
def build_prompt(question, answer, history):
    return f"""
You are a professional HR interviewer.

Question: {question}
Candidate Answer: {answer}

Tasks:
- Check if answer is relevant
- If relevant → give score (0–10), 2 strengths, 2 improvements
- If not → ask to answer properly

Keep it short and professional.
"""

# 🌐 Serve frontend
@app.route("/")
def home():
    return send_from_directory('.', 'index.html')

# 🚀 Start
@app.route("/start", methods=["POST"])
def start():
    session_id = str(uuid4())

    SESSIONS[session_id] = {
        "step": 0,
        "answers": [],
        "completed": False
    }

    return jsonify({
        "session_id": session_id,
        "question": INTERVIEW_STEPS[0]["question"]
    })

# 💬 Chat
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()

    session_id = data.get("session_id")
    message = data.get("message", "").strip()

    if not session_id or session_id not in SESSIONS:
        return jsonify({"error": "Invalid session"}), 400

    session = SESSIONS[session_id]

    if session["completed"]:
        return jsonify({"message": "Interview already completed"})

    if not message:
        return jsonify({"reply": "Please provide a valid answer."})

    step = session["step"]

    if step >= len(INTERVIEW_STEPS):
        session["completed"] = True
        return jsonify({"message": "Interview completed!"})

    question = INTERVIEW_STEPS[step]["question"]

    # 🧠 Gemini call
    try:
        prompt = build_prompt(question, message, "")

        response = genai_client.models.generate_content(
            model=model_name,
            contents=prompt
        )

        # Extract text from response
        if hasattr(response, 'text') and response.text:
            ai_reply = response.text
        elif hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                ai_reply = ''.join(part.text for part in candidate.content.parts if hasattr(part, 'text'))
            else:
                ai_reply = str(candidate)
        else:
            ai_reply = str(response)
    except Exception as e:
        print("🔥 ERROR:", e)
        ai_reply = f"{e}"

    # Save
    session["answers"].append({
        "q": question,
        "a": message,
        "feedback": ai_reply
    })

    session["step"] += 1

    # End
    if session["step"] == len(INTERVIEW_STEPS):
        session["completed"] = True
        return jsonify({
            "message": "Interview completed!",
            "responses": session["answers"]
        })

    next_q = INTERVIEW_STEPS[session["step"]]["question"]

    return jsonify({
        "reply": ai_reply,
        "next_question": next_q
    })

if __name__ == "__main__":
    app.run(debug=True)