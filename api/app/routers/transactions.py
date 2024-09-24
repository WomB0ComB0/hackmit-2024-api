# pylint: disable=E0401

from fastapi import APIRouter
from app.models.transaction import TransactionCreate, TransactionResponse
from app.ml.logistic_regression import predict_fraud
from app.ml.llama_integration import analyze_transaction
from app.ml.tf_model import predict_fraud_tf

router = APIRouter()

@router.post("/predict_fraud", response_model=TransactionResponse)
def predict_fraud_endpoint(transaction: TransactionCreate):
    # Extract features for the fraud prediction models
    features = [
        transaction.amount,
        transaction.account_age_days,
        len(transaction.product_category),
        len(transaction.customer_location),
        transaction.amount / (transaction.account_age_days + 1),  # transaction amount per day of account age
        (1 if transaction.product_category.lower() in ["electronics", "jewelry"] else 0),  # high-risk category flag
    ]

    # Use the logistic regression model to predict fraud
    lr_prediction = predict_fraud(features)

    # Use TensorFlow model to predict fraud
    tf_prediction = predict_fraud_tf(features)

    # Use LLaMA to analyze the transaction
    llama_fraudulent, llama_explanation = analyze_transaction(transaction.dict())

    # Combine predictions (you can adjust this logic based on your preferences)
    is_fraudulent = lr_prediction or tf_prediction or llama_fraudulent

    # Generate explanation based on the predictions
    if is_fraudulent:
        fraud_explanation = f"Potential fraud detected. {llama_explanation}"
    else:
        fraud_explanation = "No fraudulent activity detected."

    # Create and return the response
    response = TransactionResponse(
        id=-1,  # We're not storing in DB, so use a placeholder ID
        amount=transaction.amount,
        product_category=transaction.product_category,
        customer_location=transaction.customer_location,
        account_age_days=transaction.account_age_days,
        transaction_date=transaction.transaction_date,
        is_fraudulent=is_fraudulent,
        fraud_explanation=fraud_explanation,
    )
    return response
