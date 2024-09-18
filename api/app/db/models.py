# pylint: disable=E0401

from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean
from app.db.database import Base
from datetime import datetime


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    product_category = Column(String, nullable=False)
    customer_location = Column(String, nullable=False)
    account_age_days = Column(Integer, nullable=False)
    transaction_date = Column(DateTime, default=datetime.utcnow)
    is_fraudulent = Column(Boolean, nullable=True)
    fraud_explanation = Column(String, nullable=True)
