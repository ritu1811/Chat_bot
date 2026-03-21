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
model_name = "gemini-2.5-flash"  # Use available model

# 🧠 Session storage
SESSIONS = {}

# 📋 Interview steps
INTERVIEW_STEPS = [
    {"id": "Introduction", "question": "Hi! I am your virtual HR interviewer. Can you please introduce yourself?"},
    {"id": "Experience", "question": "Can you summarize your most relevant experience?"},
    {"id": "Strength", "question": "What is your one strength and one weakness?"},
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
1. Determine if the answer is a genuine attempt at answering the question. A generic greeting ("hello", "bye") or completely irrelevant/off-topic text must be considered a FAIL.
2. If it is a valid attempt (worthy of a score of 1 or higher), begin your response exactly with the tag [PASS]. Then give a score (1-10), 2 strengths, and 2 improvements.
3. If it is an irrelevant answer or invalid, begin your response exactly with the tag [FAIL]. Then politely ask the candidate to provide a proper answer to the question.

Very important: Your response MUST start exactly with either [PASS] or [FAIL]. Keep it short and professional.
"""

# 🌐 Serve frontend
@app.route("/")
def home():
    return send_from_directory('.', 'index.html')

# 🚀 Start
@app.route("/api/start", methods=["POST"])
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
@app.route("/api/chat", methods=["POST"])
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

    if int(step) >= len(INTERVIEW_STEPS):
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
        ai_reply = f"[PASS] {e}" # default to pass on error to avoid getting totally stuck

    passed = "[PASS]" in ai_reply
    ai_reply_clean = ai_reply.replace("[PASS]", "").replace("[FAIL]", "").strip()

    if passed:
        # Save and increment only if passed
        session["answers"].append({
            "q": question,
            "a": message,
            "feedback": ai_reply_clean
        })
        session["step"] += 1

        # End if completed
        if session["step"] == len(INTERVIEW_STEPS):
            session["completed"] = True
            return jsonify({
                "message": "Interview completed! Thank you for your time.",
                "responses": session["answers"],
                "reply": ai_reply_clean
            })

        next_q = INTERVIEW_STEPS[session["step"]]["question"]
        return jsonify({
            "reply": ai_reply_clean,
            "next_question": next_q
        })
    else:
        # Treat as invalid attempt, don't increment step, don't send next_question
        return jsonify({
            "reply": ai_reply_clean,
        })

if __name__ == "__main__":
    app.run(debug=True)