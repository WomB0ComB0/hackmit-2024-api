# pylint: disable=E0611

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount")
    product_category: str = Field(..., description="Product category")
    customer_location: str = Field(..., description="Customer location")
    account_age_days: int = Field(..., ge=0, description="Account age in days")


class TransactionCreate(TransactionBase):
    transaction_date: datetime = Field(
        default_factory=datetime.now, description="Transaction date and time"
    )


class TransactionResponse(TransactionBase):
    id: int
    transaction_date: datetime
    is_fraudulent: Optional[bool] = Field(None, description="Fraud prediction result")
    fraud_explanation: Optional[str] = Field(
        None, description="Explanation for fraud prediction"
    )

    class Config:
        orm_mode = True


class TransactionUpdate(BaseModel):
    is_fraudulent: bool = Field(..., description="Manual fraud flag update")
