import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder
import json
import logging
from pathlib import Path
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_transactions(file_path: str) -> List[Dict[str, Any]]:
    try:
        with open(file_path, "r", encoding="utf-8") as json_file:
            return json.load(json_file)
    except FileNotFoundError:
        logger.error("File not found: %s", file_path)
        raise
    except json.JSONDecodeError:
        logger.error("Invalid JSON in file %s", file_path)
        raise


def preprocess_data(transactions: List[Dict[str, Any]]) -> pd.DataFrame:
    df = pd.DataFrame(transactions)
    categorical_columns = ["type", "location", "medium", "status"]
    numerical_columns = ["amount", "fraud_score"]

    encoder = OneHotEncoder(sparse_output=False)
    encoded_categorical_data = encoder.fit_transform(df[categorical_columns])
    numerical_data = df[numerical_columns].values

    feature_names = numerical_columns + [
        f"{col}_{val}"
        for col, vals in zip(categorical_columns, encoder.categories_)
        for val in vals
    ]

    transaction_vectors = np.concatenate(
        [numerical_data, encoded_categorical_data], axis=1
    )
    return pd.DataFrame(transaction_vectors, columns=feature_names, index=df["_id"])


def create_output_vectors(df: pd.DataFrame) -> List[Dict[str, Any]]:
    return [
        {
            "_id": index,
            "vector": row.tolist(),
        }
        for index, row in df.iterrows()
    ]


def save_vectors(vectors: List[Dict[str, Any]], output_file: str):
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as output_json_file:
        json.dump(vectors, output_json_file, indent=4)
    logger.info("Transaction vectors have been saved to '%s'", output_file)


def process_transactions(input_file: str, output_file: str):
    try:
        transactions = load_transactions(input_file)
        df = preprocess_data(transactions)
        output_vectors = create_output_vectors(df)
        save_vectors(output_vectors, output_file)
    except Exception as e:
        logger.error("An error occurred while processing transactions: %s", e)
        raise


if __name__ == "__main__":
    input_file = "mock_bank_transactions_data.json"
    output_file = "transaction_vectors.json"
    process_transactions(input_file, output_file)
