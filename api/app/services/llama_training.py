import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from torch.utils.data import Dataset, DataLoader
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import torch

# Your Hugging Face API token (replace with your actual token)
HUGGING_FACE_API_TOKEN = ''

# Step 1: Load and preprocess the data
print("Starting data loading and preprocessing...")

# Load the dataset
data = pd.read_json(r'C:\Users\mckayz\Documents\GitHub\hackmit-2024-api\mock_bank_transactions_data.json')
print("Data loaded successfully!")

# Rename "Merchant Type" to "Product Category"
data.rename(columns={'Merchant Type': 'Product Category'}, inplace=True)
print("First 5 rows of the dataset after renaming column:")
print(data.head())

# Extract features and labels
X = data[['Transaction Amount', 'Transaction Time', 'Location', 'Product Category', 
          'Transaction Frequency', 'Account Age']]
y = data['Fraud Score']

print("Feature columns extracted:", X.columns)
print("Label (Fraud Score) extracted.")

# One-hot encode categorical variables (Product Category)
X = pd.get_dummies(X, columns=['Product Category'])
print("One-hot encoding completed for 'Product Category'.")
print("Columns after one-hot encoding:", X.columns)

# Normalize numerical features
scaler = StandardScaler()
X[['Transaction Amount', 'Transaction Time', 'Location', 'Transaction Frequency', 'Account Age']] = scaler.fit_transform(
    X[['Transaction Amount', 'Transaction Time', 'Location', 'Transaction Frequency', 'Account Age']]
)
print("Normalization of numerical features completed.")

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print(f"Data split into training and testing sets.")
print(f"Training set size: {X_train.shape[0]} samples.")
print(f"Testing set size: {X_test.shape[0]} samples.")

# Step 2: Load the LLaMA 3.1 70B model using manual authentication
print("Loading LLaMA 3.1 70B model...")

# Load the LLaMA tokenizer and model using the correct identifier
tokenizer = AutoTokenizer.from_pretrained('meta-llama/Meta-Llama-3.1-70B', token=HUGGING_FACE_API_TOKEN)
model = AutoModelForCausalLM.from_pretrained('meta-llama/Meta-Llama-3.1-70B', token=HUGGING_FACE_API_TOKEN)

# Custom Dataset class
class FraudDataset(Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)

# Convert tabular data into text format for LLaMA
def convert_to_text(transaction):
    return f"Transaction Amount: {transaction['Transaction Amount']}, Time: {transaction['Transaction Time']}, Location: {transaction['Location']}, Product Category: {transaction['Product Category']}, Frequency: {transaction['Transaction Frequency']}, Account Age: {transaction['Account Age']}"

train_texts = [convert_to_text(X_train.iloc[i]) for i in range(len(X_train))]
test_texts = [convert_to_text(X_test.iloc[i]) for i in range(len(X_test))]

# Tokenize the data
train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=512)
test_encodings = tokenizer(test_texts, truncation=True, padding=True, max_length=512)

# Create datasets and dataloaders
train_dataset = FraudDataset(train_encodings, y_train)
test_dataset = FraudDataset(test_encodings, y_test)

# Reduced batch size to 1
train_loader = DataLoader(train_dataset, batch_size=1, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=1)

# Fine-tuning with mixed precision
optimizer = torch.optim.AdamW(model.parameters(), lr=5e-5)
scaler = torch.cuda.amp.GradScaler()  # Use AMP for mixed precision

for epoch in range(3):  # Adjust number of epochs as needed
    model.train()
    for batch in train_loader:
        optimizer.zero_grad()
        with torch.cuda.amp.autocast():  # Enable mixed precision
            input_ids = batch['input_ids'].to("cuda" if torch.cuda.is_available() else "cpu")
            attention_mask = batch['attention_mask'].to("cuda" if torch.cuda.is_available() else "cpu")
            labels = batch['labels'].to("cuda" if torch.cuda.is_available() else "cpu")

            outputs = model(input_ids, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss

        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

    print(f'Epoch {epoch + 1} loss: {loss.item()}')

# Evaluation
model.eval()
predictions, actuals = [], []
with torch.no_grad():
    for batch in test_loader:
        input_ids = batch['input_ids'].to("cuda" if torch.cuda.is_available() else "cpu")
        attention_mask = batch['attention_mask'].to("cuda" if torch.cuda.is_available() else "cpu")
        labels = batch['labels'].cpu().numpy()
        outputs = model(input_ids, attention_mask=attention_mask)
        preds = outputs.logits.cpu().numpy()  # Convert logits to predictions
        predictions.extend(preds)
        actuals.extend(labels)

# Print confirmation that evaluation is complete
print("Model evaluation complete!")

