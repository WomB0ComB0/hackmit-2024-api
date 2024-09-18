# pylint: disable=E0401

from fastapi import FastAPI
from app.routers import transactions
from app.db.database import create_tables, get_db
from app.services.transaction_service import transaction_service
from app.db.models import Transaction  # Add this import
from dotenv import load_dotenv
import logging
import os

load_dotenv()  # Load environment variables from .env file

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    create_tables()
    logger.info("Database tables created")

    # Train the model if it doesn't exist
    if not os.path.exists("fraud_detection_model.joblib"):
        logger.info("Training fraud detection model")
        db = next(get_db())
        transactions = db.query(Transaction).all()
        if transactions:
            transaction_service.train_fraud_model(transactions)
        else:
            logger.warning("No transactions found for model training")

app.include_router(transactions.router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
