# pylint: disable=E0401

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..models.transaction import (
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)
from ..services.transaction_service import transaction_service
from ..db.database import get_db

router = APIRouter()


@router.post("/transactions/", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    db_transaction = transaction_service.create_transaction(db, transaction)

    # Extract features
    features = transaction_service.extract_features(db_transaction)

    # Use both traditional ML and LLaMA for fraud detection
    is_fraudulent_ml = transaction_service.predict_fraud(features)

    is_fraudulent_llama, explanation = transaction_service.predict_fraud_with_llama(
        db_transaction
    )

    # Combine results (you can adjust this logic based on your preferences)
    db_transaction.is_fraudulent = is_fraudulent_ml or is_fraudulent_llama
    db_transaction.fraud_explanation = explanation if is_fraudulent_llama else None

    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.get("/transactions/", response_model=List[TransactionResponse])
def read_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    transactions = transaction_service.get_transactions(db, skip=skip, limit=limit)
    return transactions


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def read_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transaction = transaction_service.get_transaction(db, transaction_id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return db_transaction


@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db),
):
    db_transaction = transaction_service.get_transaction(db, transaction_id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    updated_transaction = transaction_service.update_transaction(
        db, db_transaction, transaction_update
    )
    return updated_transaction


@router.delete("/transactions/{transaction_id}", response_model=TransactionResponse)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transaction = transaction_service.get_transaction(db, transaction_id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    deleted_transaction = transaction_service.delete_transaction(db, db_transaction)
    return deleted_transaction
