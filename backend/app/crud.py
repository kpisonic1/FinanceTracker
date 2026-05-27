from sqlalchemy.orm import Session
from . import models, schemas

def create_transaction(db: Session, tx: schemas.TransactionCreate):
    db_tx = models.Transaction(**tx.model_dump())
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

def get_transactions(db: Session):
    return db.query(models.Transaction).order_by(models.Transaction.id.desc()).all()

def delete_transaction(db: Session, tx_id: int):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not tx:
        return None
    db.delete(tx)
    db.commit()
    return tx

def get_training_samples(db: Session):
    rows = db.query(models.Transaction.description, models.Transaction.category).all()
    texts = [desc for (desc, cat) in rows if desc and cat]
    labels = [cat for (desc, cat) in rows if desc and cat]
    return texts, labels
