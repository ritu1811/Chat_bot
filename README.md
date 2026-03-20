# HR Interview Chatbot (Python)

A simple rule-based HR interview chatbot using Flask.

## Setup

1. Create and activate a Python virtual environment:
   - `python -m venv .venv`
   - `.venv\Scripts\activate` (Windows)

2. Install dependencies:
   - Backend: `pip install flask python-dotenv google-genai flask-cors`
   - Frontend: `cd frontend && npm install`

## Run

1. Start the backend server:
   - `python backend/app.py`

2. Start the frontend:
   - `cd frontend && npm run dev`

3. Open http://localhost:5173 in your browser.

## API Endpoints

- `POST /start` (no body) → returns `session_id` and first question.
- `POST /chat` with JSON `{ "session_id": "<id>", "message": "your answer" }`.

3. The flow is linear through core HR questions and returns a final response summary.

## Example

```bash
curl -X POST http://localhost:5000/start
curl -X POST -H "Content-Type: application/json" -d '{"session_id":"<id>","message":"My background is..."}' http://localhost:5000/chat
```
