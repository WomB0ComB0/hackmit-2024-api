import random
import numpy as np
import json
from typing import List, Dict, Any
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
MIN_AMOUNT = 5
MAX_AMOUNT = 5000
PREFERRED_TIME = 12  # Noon (12 PM) as the preferred transaction time
TOTAL_TIME_RANGE = 24  # Full 24-hour range
MAX_DISTANCE = 5000  # Max distance in kilometers
MERCHANT_RISK_SCORES = {
    "Gambling": 0.9,
    "Electronics": 0.7,
    "Grocery": 0.3,
    "Fashion": 0.5,
    "Travel": 0.8,
    "Restaurants": 0.4,
    "Entertainment": 0.6,
}
WEIGHTS = {
    "Transaction Time": 0.35,
    "Account Age": 0.25,
    "Transaction Amount": 0.15,
    "Product Category": 0.10,
    "Customer Location": 0.10,
    "Transaction Frequency": 0.05,
}


def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)


def generate_mock_transaction() -> tuple:
    amount = round(random.uniform(MIN_AMOUNT, MAX_AMOUNT), 2)
    time = round(random.uniform(0, TOTAL_TIME_RANGE), 2)
    location = round(random.uniform(0, MAX_DISTANCE), 2)
    merchant = random.choice(list(MERCHANT_RISK_SCORES.keys()))
    frequency = random.randint(1, 15)
    account_age = random.randint(1, 3650)
    return amount, time, location, merchant, frequency, account_age


def normalize_and_score(
    amount: float,
    time: float,
    location: float,
    merchant: str,
    frequency: int,
    account_age: int,
) -> float:
    scaled_amount = (amount - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT)
    scaled_time = abs(time - PREFERRED_TIME) / TOTAL_TIME_RANGE
    scaled_location = location / MAX_DISTANCE
    merchant_score = MERCHANT_RISK_SCORES[merchant]
    scaled_frequency = (frequency - 1) / 14
    scaled_account_age = account_age / 3650

    fraud_score = sum(
        WEIGHTS[key] * value
        for key, value in {
            "Transaction Time": scaled_time,
            "Account Age": scaled_account_age,
            "Transaction Amount": scaled_amount,
            "Product Category": merchant_score,
            "Customer Location": scaled_location,
            "Transaction Frequency": scaled_frequency,
        }.items()
    )

    random_noise = np.random.uniform(-0.05, 0.05)
    final_fraud_score = max(0, min(fraud_score + random_noise, 1))
    return round(final_fraud_score, 2)


def generate_mock_transactions(num_records: int) -> List[Dict[str, Any]]:
    return [
        {
            "Transaction Amount": amount,
            "Transaction Time": time,
            "Location": location,
            "Merchant Type": merchant,
            "Transaction Frequency": frequency,
            "Account Age": account_age,
            "Fraud Score": normalize_and_score(
                amount, time, location, merchant, frequency, account_age
            ),
        }
        for amount, time, location, merchant, frequency, account_age in (
            generate_mock_transaction() for _ in range(num_records)
        )
    ]


def save_transactions(transactions: List[Dict[str, Any]], filename: str):
    try:
        Path(filename).parent.mkdir(parents=True, exist_ok=True)
        with open(filename, "w", encoding="utf-8") as json_file:
            json.dump(transactions, json_file, indent=4)
        logger.info(f"Transactions saved to {filename}")
    except IOError as e:
        logger.error(f"Error saving transactions to {filename}: {e}")
        raise


def main(
    num_records: int = 10000, output_file: str = "mock_bank_transactions_data.json"
):
    set_seed()
    logger.info(f"Generating {num_records} mock transactions...")
    mock_transactions = generate_mock_transactions(num_records)
    save_transactions(mock_transactions, output_file)
    logger.info("Here are the first 5 transactions:")
    for transaction in mock_transactions[:5]:
        logger.info(json.dumps(transaction, indent=2))


if __name__ == "__main__":
    main()
