from pydantic import BaseModel

class TransactionCreate(BaseModel):
    description: str
    amount: float
    category: str
    date: str  # "YYYY-MM-DD"

class TransactionOut(TransactionCreate):
    id: int

    class Config:
        from_attributes = True

class CategorySuggestRequest(BaseModel):
    description: str

class CategorySuggestResponse(BaseModel):
    category: str
    method: str  # "ml" or "fallback"

class TrainResponse(BaseModel):
    trained: bool
    samples_used: int
    classes: list[str]
    message: str
