# Personal AI Finance Tracker

A full-stack AI-powered personal finance tracking application built with React and Python (FastAPI). The app allows users to track their spending, automatically categorize transactions using machine learning, view monthly summaries, and forecast next month's expenses by category.

---

## Features

- **Add transactions** — log expenses with description, amount, category, and date
- **AI category suggestion** — as you type a description, the app automatically suggests the most likely category using a trained ML model (falls back to keyword-based rules if the model isn't trained yet)
- **Monthly spend by category** — view a breakdown of your spending for any selected month
- **Next month forecast** — predicts next month's spending per category using a weighted average of the last 3 months, with trend indicators
- **Train the ML model** — the category classifier can be retrained directly from your own transaction history via the API

---

## Tech Stack

**Frontend**
- React 18
- React Router v6
- Create React App

**Backend**
- Python 3
- FastAPI
- SQLAlchemy (ORM)
- SQLite (database)
- scikit-learn (ML category classifier — TF-IDF + Logistic Regression)
- joblib (model persistence)
- Uvicorn (ASGI server)

---

## Project Structure

```
project/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI app, all routes
│       ├── models.py        # SQLAlchemy database models
│       ├── schemas.py       # Pydantic request/response schemas
│       ├── crud.py          # Database operations
│       ├── db.py            # Database connection and session setup
│       ├── ml.py            # ML model training, loading, prediction
│       └── ml_models/
│           └── category_model.joblib  # Saved ML model (auto-generated)
└── frontend/
    └── src/
        ├── App.js           # Main React app, all pages and components
        ├── App.css          # Styles
        └── index.js         # React entry point
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

---

### Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install fastapi uvicorn sqlalchemy pydantic scikit-learn joblib python-multipart
```

Start the backend server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

---

### Frontend Setup

Open a new terminal and navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The app will open at `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions` | List all transactions |
| POST | `/transactions` | Add a new transaction |
| DELETE | `/transactions/{id}` | Delete a transaction |
| POST | `/ai/suggest-category` | Suggest a category for a description |
| POST | `/ai/train-category-model` | Train the ML model on existing transactions |
| GET | `/summary/monthly-by-category?month=YYYY-MM` | Monthly spending summary |
| GET | `/forecast/categories?months=3` | Next month forecast by category |

---

## ML Category Classifier

The app includes a machine learning model that predicts the category of a transaction based on its description. It uses a **TF-IDF vectorizer** combined with a **Logistic Regression** classifier, trained on your own transaction history.

- The model is trained by calling `POST /ai/train-category-model` (requires at least 10 transactions across 2+ categories)
- Once trained, it is saved to `backend/app/ml_models/category_model.joblib` and loaded automatically on each prediction request
- If no trained model exists, the app falls back to simple keyword matching (e.g. "netflix" → Entertainment, "fuel" → Transport)

---

## Notes

- The database is a local SQLite file (`finance.db`) created automatically in the backend folder on first run
- The frontend expects the backend to be running on `http://127.0.0.1:8000` — this is hardcoded in `App.js`
- CORS is configured to allow requests from `http://localhost:3000` only
