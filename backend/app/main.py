from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .ml import train_category_model, predict_category, fallback_category
from datetime import date, datetime
from collections import defaultdict


from .db import Base, engine, SessionLocal
from . import schemas, crud

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finance Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "API running"}

@app.get("/transactions", response_model=list[schemas.TransactionOut])
def list_transactions(db: Session = Depends(get_db)):
    return crud.get_transactions(db)

@app.post("/transactions", response_model=schemas.TransactionOut)
def add_transaction(tx: schemas.TransactionCreate, db: Session = Depends(get_db)):
    return crud.create_transaction(db, tx)

@app.delete("/transactions/{tx_id}", response_model=schemas.TransactionOut)
def remove_transaction(tx_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_transaction(db, tx_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return deleted

@app.post("/ai/train-category-model", response_model=schemas.TrainResponse)
def train_model(db: Session = Depends(get_db)):
    texts, labels = crud.get_training_samples(db)
    trained, n, classes, message = train_category_model(texts, labels)
    return {
        "trained": trained,
        "samples_used": n,
        "classes": classes,
        "message": message,
    }


@app.post("/ai/suggest-category", response_model=schemas.CategorySuggestResponse)
def suggest_category(payload: schemas.CategorySuggestRequest):
    desc = payload.description.strip()
    if not desc:
        return {"category": "Other", "method": "fallback"}

    ml_pred = predict_category(desc)
    if ml_pred is not None:
        return {"category": ml_pred, "method": "ml"}

    return {"category": fallback_category(desc), "method": "fallback"}

@app.get("/summary/monthly-by-category")
def monthly_summary_by_category(month: str, db: Session = Depends(get_db)):
    # Basic validation
    if len(month) != 7 or month[4] != "-":
        raise HTTPException(status_code=400, detail="month must be in format YYYY-MM")

    txs = crud.get_transactions(db)

    totals = defaultdict(float)
    for t in txs:
        if t.date[:7] == month:
            totals[t.category] += float(t.amount)

    result = [{"category": k, "total": round(v, 2)} for k, v in totals.items()]
    result.sort(key=lambda x: x["total"], reverse=True)

    return {"month": month, "totals": result}


@app.get("/forecast/categories")
def forecast_categories(months: int = 3, db: Session = Depends(get_db)):
    txs = crud.get_transactions(db)
    today = date.today()

   
    filtered = []
    for t in txs:
        try:
            d = datetime.strptime(t.date, "%Y-%m-%d").date()
        except ValueError:
            continue
        if d <= today:
            filtered.append(t)

    if not filtered:
        return {"months_used": months, "history_months": [], "categories": []}

    
    by_cat_month = defaultdict(lambda: defaultdict(float))
    all_months = set()

    for t in filtered:
        m = t.date[:7]  # "YYYY-MM"
        all_months.add(m)
        by_cat_month[t.category][m] += float(t.amount)

    sorted_months = sorted(all_months)
    history_months = sorted_months[-months:]

    if not history_months:
        return {"months_used": months, "history_months": [], "categories": []}

    weights = list(range(1, len(history_months) + 1))
    weight_sum = sum(weights)

    categories_out = []
    for cat, month_map in by_cat_month.items():
        values = [round(month_map.get(m, 0.0), 2) for m in history_months]

        forecast = sum(w * v for w, v in zip(weights, values)) / weight_sum
        forecast = round(forecast, 2)

        last_month_total = values[-1]

        if last_month_total == 0:
            trend_pct = None
            trend_direction = "up" if forecast > 0 else "flat"
        else:
            trend_pct = round(((forecast - last_month_total) / last_month_total) * 100, 2)
            trend_direction = "up" if trend_pct > 0 else "down" if trend_pct < 0 else "flat"

        categories_out.append({
            "category": cat,
            "forecast_next_month": forecast,
            "last_month_total": round(last_month_total, 2),
            "trend_pct_vs_last_month": trend_pct,
            "trend_direction": trend_direction
        })

    categories_out.sort(key=lambda x: x["forecast_next_month"], reverse=True)

    return {
        "months_used": months,
        "history_months": history_months,
        "categories": categories_out
    }
