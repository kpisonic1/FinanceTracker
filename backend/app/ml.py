import os
import joblib
from typing import Optional, List, Tuple

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

MODEL_DIR = os.path.join(os.path.dirname(__file__), "ml_models")
MODEL_PATH = os.path.join(MODEL_DIR, "category_model.joblib")


def ensure_model_dir():
    os.makedirs(MODEL_DIR, exist_ok=True)


def build_pipeline() -> Pipeline:
    return Pipeline(
        steps=[
            ("tfidf", TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2)
            )),
            ("clf", LogisticRegression(
                max_iter=2000
            )),
        ]
    )


def train_category_model(texts: List[str], labels: List[str]) -> Tuple[bool, int, List[str], str]:
    if len(texts) < 10:
        return False, len(texts), [], "Not enough samples to train (need ~10)."

    classes = sorted(set(labels))
    if len(classes) < 2:
        return False, len(texts), classes, "Need at least 2 different categories."

    ensure_model_dir()
    model = build_pipeline()
    model.fit(texts, labels)

    joblib.dump(model, MODEL_PATH)
    return True, len(texts), classes, f"Model saved to {MODEL_PATH}"


def load_model() -> Optional[Pipeline]:
    if not os.path.exists(MODEL_PATH):
        return None
    try:
        return joblib.load(MODEL_PATH)
    except Exception:
        return None


def predict_category(description: str) -> Optional[str]:
    model = load_model()
    if not model:
        return None
    try:
        return str(model.predict([description])[0])
    except Exception:
        return None


def fallback_category(description: str) -> str:
    desc = (description or "").lower()

    if any(w in desc for w in ["mcdonald", "kfc", "pizza", "burger", "restaurant", "cafe", "coffee"]):
        return "Food"
    if any(w in desc for w in ["fuel", "gas", "petrol", "ina", "diesel", "benz"]):
        return "Transport"
    if any(w in desc for w in ["rent", "stanarina", "apartment", "housing"]):
        return "Housing"
    if any(w in desc for w in ["netflix", "cinema", "spotify", "concert"]):
        return "Entertainment"

    return "Other"
