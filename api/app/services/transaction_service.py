# pylint: disable=E0401

from sqlalchemy.orm import Session
from app.models.transaction import TransactionCreate, TransactionUpdate
from app.db.models import Transaction
from app.ml.logistic_regression import predict_fraud, train_model
from app.ml.llama_integration import analyze_transaction


class TransactionService:
    @staticmethod
    def create_transaction(session: Session, transaction: TransactionCreate):
        db_transaction = Transaction(**transaction.dict())
        session.add(db_transaction)
        session.commit()
        session.refresh(db_transaction)
        return db_transaction

    @staticmethod
    def get_transactions(session: Session, skip: int = 0, limit: int = 100):
        return session.query(Transaction).offset(skip).limit(limit).all()

    @staticmethod
    def get_transaction(session: Session, transaction_id: int):
        return (
            session.query(Transaction).filter(Transaction.id == transaction_id).first()
        )

    @staticmethod
    def update_transaction(
        session: Session,
        db_transaction: Transaction,
        transaction_update: TransactionUpdate,
    ):
        for key, value in transaction_update.dict().items():
            setattr(db_transaction, key, value)
        session.commit()
        session.refresh(db_transaction)
        return db_transaction

    @staticmethod
    def delete_transaction(session: Session, db_transaction: Transaction):
        session.delete(db_transaction)
        session.commit()
        return db_transaction

    @staticmethod
    def extract_features(transaction: Transaction):
        features = [
            transaction.amount,
            transaction.account_age_days,
            # Add more features here
            len(transaction.product_category),
            len(transaction.customer_location),
            1 if transaction.is_fraudulent else 0  # Convert boolean to int
        ]
        return features

    @staticmethod
    def predict_fraud(features):
        return predict_fraud(features)

    @staticmethod
    def predict_fraud_with_llama(transaction: Transaction):
        transaction_details = f"""
        Amount: {transaction.amount}
        Product Category: {transaction.product_category}
        Customer Location: {transaction.customer_location}
        Account Age: {transaction.account_age_days} days
        """
        is_fraudulent, explanation = analyze_transaction(transaction_details)
        return is_fraudulent, explanation

    @staticmethod
    def train_fraud_model(transactions):
        X = [TransactionService.extract_features(t) for t in transactions]
        y = [1 if t.is_fraudulent else 0 for t in transactions]
        train_model(X, y)


transaction_service = TransactionService()
