# Mind Map Game

A web-based game where players build a mind map by connecting related words or phrases, starting from a central concept.

## Features

*   Mind-map style gameplay.
*   Connect related words/phrases outwards from a central node.
*   Time limits and move-based scoring.
*   Shareable mind map progress.
*   (Planned) Daily puzzles, premium content, subscriptions.

## Project Structure

```
Mind Map/
├── backend/
│   ├── main.py             # FastAPI application, API endpoints
│   └── requirements.txt    # Python backend dependencies
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components (Gameboard, Node, InputForm, Timer, ScoreDisplay)
│   │   ├── App.tsx         # Main application component
│   │   ├── index.css       # Main CSS file (includes Tailwind)
│   │   └── main.tsx        # Entry point for React app
│   ├── index.html          # Main HTML page
│   ├── package.json        # Frontend dependencies and scripts
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── postcss.config.js   # PostCSS configuration
│   └── tsconfig.json       # TypeScript configuration
├── .gitignore
└── README.md               # This file
```

## Running Locally

**Prerequisites:**

*   Node.js and npm
*   Python 3.8+ and pip

**1. Backend Setup:**

```bash
cd "Mind Map/backend"
python -m venv venv
# Activate venv (source venv/bin/activate or venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
# Backend runs on http://127.0.0.1:8001
```

**2. Frontend Setup:**

```bash
cd "Mind Map/frontend"
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

## Running with GitHub Codespaces

1.  Open the repository in a GitHub Codespace.
2.  Open two terminals.
3.  **Terminal 1 (Backend):** `cd backend`, `python -m venv venv`, `source venv/bin/activate`, `pip install -r requirements.txt`, `uvicorn main:app --host 0.0.0.0 --port 8001 --reload`
4.  **Terminal 2 (Frontend):** `cd frontend`, `npm install`, `npm run dev -- --host 0.0.0.0`
5.  Access the application via the forwarded **frontend port (5173)** in the Codespace "Ports" tab.

## Next Steps

*   **Frontend:** Implement node selection logic propagation, refine UI, handle game over state, add sharing features.
*   **Backend:** Implement connection validation logic, user accounts, database integration, premium puzzle handling, monetization endpoints.
*   Connect frontend validation calls to the backend. 