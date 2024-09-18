import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder
import json

# Load the transaction data from a JSON file
with open("mock_bank_transactions_data.json", "r") as json_file:
    mock_transactions = json.load(json_file)

# Convert the list of dictionaries to a DataFrame for easier handling
df = pd.DataFrame(mock_transactions)

# Define the fields we want to encode and their types
categorical_columns = ['type', 'location', 'medium', 'status']
numerical_columns = ['amount', 'fraud_score']

# Initialize the OneHotEncoder for categorical features
encoder = OneHotEncoder(sparse=False)

# Fit and transform the categorical data into one-hot encoded vectors
encoded_categorical_data = encoder.fit_transform(df[categorical_columns])

# Extract the numerical data
numerical_data = df[numerical_columns].values

# Combine numerical and categorical data into vectors
transaction_vectors = np.concatenate([numerical_data, encoded_categorical_data], axis=1)

# Prepare the output in a list format for saving to JSON
output_vectors = []
for i, vector in enumerate(transaction_vectors):
    # Create a dictionary with the original transaction ID and the vector
    output_vectors.append({
        "_id": df["_id"].iloc[i],
        "vector": vector.tolist()  # Convert the NumPy array to a list for JSON serialization
    })

# Save the vectors to a new JSON file
with open("transaction_vectors.json", "w") as output_json_file:
    json.dump(output_vectors, output_json_file, indent=4)

print("Transaction vectors have been saved to 'transaction_vectors.json'")