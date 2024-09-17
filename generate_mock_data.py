import pandas as pd
import random
import numpy as np
import json

# Set seed for reproducibility
random.seed(42)
np.random.seed(42)

# Define min and max values for scaling purposes
min_amount = 5
max_amount = 5000
preferred_time = 12  # Noon (12 PM) as the preferred transaction time
total_time_range = 24  # Full 24-hour range
max_distance = 5000  # Max distance in kilometers
merchant_risk_scores = {
    "Gambling": 0.9,
    "Electronics": 0.7,
    "Grocery": 0.3,
    "Fashion": 0.5,
    "Travel": 0.8,
    "Restaurants": 0.4,
    "Entertainment": 0.6
}

# Updated weights based on ranking
weights = {
    "Transaction Time": 0.35,
    "Account Age": 0.25,
    "Transaction Amount": 0.15,
    "Product Category": 0.10,
    "Customer Location": 0.10,
    "Transaction Frequency": 0.05
}

# Generate random values for the mock data
def generate_mock_transaction():
    amount = round(random.uniform(min_amount, max_amount), 2)
    time = round(random.uniform(0, total_time_range), 2)  # Random hour of the day
    location = round(random.uniform(0, max_distance), 2)  # Random distance in km
    merchant = random.choice(list(merchant_risk_scores.keys()))
    frequency = random.randint(1, 15)  # Random number of transactions per day
    account_age = random.randint(1, 3650)  # Random account age in days (up to 10 years)
    
    return amount, time, location, merchant, frequency, account_age

# Calculate normalized feature scores for each transaction
def normalize_and_score(amount, time, location, merchant, frequency, account_age):
    # Normalize features
    scaled_amount = (amount - min_amount) / (max_amount - min_amount)
    scaled_time = abs(time - preferred_time) / total_time_range
    scaled_location = location / max_distance
    merchant_score = merchant_risk_scores[merchant]
    scaled_frequency = (frequency - 1) / 14  # Normalize based on a range of 1-15
    scaled_account_age = account_age / 3650  # Normalize based on a 10-year maximum age
    
    # Calculate the fraud score using the weighted sum with new weights
    fraud_score = (
        weights["Transaction Time"] * scaled_time +
        weights["Account Age"] * scaled_account_age +
        weights["Transaction Amount"] * scaled_amount +
        weights["Product Category"] * merchant_score +
        weights["Customer Location"] * scaled_location +
        weights["Transaction Frequency"] * scaled_frequency
    )
    
    # Add random noise to simulate real-world conditions
    random_noise = np.random.uniform(-0.05, 0.05)
    final_fraud_score = max(0, min(fraud_score + random_noise, 1))  # Ensure fraud score stays between 0 and 1
    
    # Round the fraud score to 2 decimal points
    return round(final_fraud_score, 2)

# Generate a mock dataset
def generate_mock_transactions(num_records):
    transactions = []
    
    for _ in range(num_records):
        amount, time, location, merchant, frequency, account_age = generate_mock_transaction()
        fraud_score = normalize_and_score(amount, time, location, merchant, frequency, account_age)
        
        transaction = {
            "Transaction Amount": amount,
            "Transaction Time": time,
            "Location": location,
            "Merchant Type": merchant,
            "Transaction Frequency": frequency,
            "Account Age": account_age,
            "Fraud Score": fraud_score
        }
        
        transactions.append(transaction)
    
    return transactions

# Generate 10,000 mock transactions
mock_transactions = generate_mock_transactions(10000)

# Save the data to a JSON file
print("Saving transactions to JSON file...")
with open("mock_bank_transactions_data.json", "w") as json_file:
    json.dump(mock_transactions, json_file, indent=4)

print("Transactions saved to mock_bank_transactions_data.json")

# Display the first few transactions
print("Here are the first 5 transactions:")
print(mock_transactions[:5])
