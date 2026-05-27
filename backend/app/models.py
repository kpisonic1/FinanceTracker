from sqlalchemy import Column, Integer, String, Float
from .db import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    date = Column(String, nullable=False)  # "YYYY-MM-DD"
