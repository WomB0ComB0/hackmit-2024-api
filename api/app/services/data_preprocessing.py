import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import requests

# Load the dataset from the provided URL
url = "https://storage.googleapis.com/hackmit-fraudguard/Fraudulent_E-Commerce_Transaction_Data.csv"
response = requests.get(url)
open('Fraudulent_E-Commerce_Transaction_Data.csv', 'wb').write(response.content)

# Load the dataset
data = pd.read_csv('Fraudulent_E-Commerce_Transaction_Data.csv')

# Display the first few rows of the dataset
print("Original Data:")
print(data.head())

# Remove duplicate rows if any
data.drop_duplicates(inplace=True)

# --- Step 1: Label Encoding for 'Product Category' (Merchant Type) ---
print("\nPerforming Label Encoding on 'Product Category'...")

# Initialize the LabelEncoder for Product Category
label_encoder_category = LabelEncoder()

# Apply Label Encoding for Product Category (Merchant Type)
data_encoded = data.copy()
data_encoded['Product Category'] = label_encoder_category.fit_transform(data['Product Category'])

# --- Step 2: Label Encoding for 'Customer Location' (Location) ---
print("\nPerforming Label Encoding on 'Customer Location'...")

# Initialize the LabelEncoder for Customer Location
label_encoder_location = LabelEncoder()

# Apply Label Encoding for Customer Location (Location)
data_encoded['Customer Location'] = label_encoder_location.fit_transform(data['Customer Location'])

# --- Step 3: Feature Extraction from 'Transaction Date' (Transaction Time) ---
print("\nExtracting features from 'Transaction Date'...")

# Convert 'Transaction Date' to datetime format
data_encoded['Transaction Date'] = pd.to_datetime(data_encoded['Transaction Date'])

# Extract year, month, day, and hour from 'Transaction Date'
data_encoded['Transaction Year'] = data_encoded['Transaction Date'].dt.year
data_encoded['Transaction Month'] = data_encoded['Transaction Date'].dt.month
data_encoded['Transaction Day'] = data_encoded['Transaction Date'].dt.day
data_encoded['Transaction Hour'] = data_encoded['Transaction Date'].dt.hour

# Optionally: Combine Transaction Year, Month, and Day into a single feature (e.g., day of year)
data_encoded['Transaction Time'] = data_encoded['Transaction Date'].dt.dayofyear + (data_encoded['Transaction Hour'] / 24)

# Drop the original Transaction Date columns (after extracting features)
data_encoded = data_encoded.drop(['Transaction Date', 'Transaction Year', 'Transaction Month', 'Transaction Day', 'Transaction Hour'], axis=1)

# --- Step 4: Calculate 'Transaction Frequency' (Frequency of Transactions) ---
print("\nCalculating 'Transaction Frequency'...")

# Sort data by Customer ID and Transaction Date (now using the combined 'Transaction Time')
data_encoded.sort_values(by=['Customer Location', 'Transaction Time'], inplace=True)

# Calculate the frequency of transactions per customer (based on rolling time window)
data_encoded['Transaction Frequency'] = data_encoded.groupby('Customer Location')['Transaction Time'].diff().fillna(0).apply(lambda x: 1 if x <= 7 else 0).cumsum()

# --- Step 5: Keep Only the Necessary Columns ---
print("\nSelecting relevant features...")

# Define the columns to keep (including the newly combined 'Product Category' column)
columns_to_keep = [
    'Transaction Amount',       # Transaction Amount
    'Transaction Time',         # Transaction Time
    'Customer Location',        # Location
    'Transaction Frequency',    # Frequency of Transactions
    'Account Age Days',         # Account Age
    'Product Category'          # Combined Product Category (Merchant Type)
]

# Keep only the relevant columns
data_encoded = data_encoded[columns_to_keep]

# --- Step 6: Train-Test Split ---
print("\nSplitting the dataset into training and testing sets...")

# Define the target (y) and features (X)
X = data_encoded
y = data['Is Fraudulent']

# Reset the index for training
X.reset_index(drop=True, inplace=True)

# Split the data into 70% training and 30% testing
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Output the shape of the training and test sets
print(f"\nTraining set shape: {X_train.shape}")
print(f"Test set shape: {X_test.shape}")

# Save the preprocessed data for model training
X_train.to_csv('X_train.csv', index=False)
X_test.to_csv('X_test.csv', index=False)
y_train.to_csv('y_train.csv', index=False)
y_test.to_csv('y_test.csv', index=False)
