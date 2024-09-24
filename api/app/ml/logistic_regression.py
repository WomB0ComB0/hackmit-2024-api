from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os
import pandas as pd

MODEL_PATH = "app/ml/fraud_detection_model.joblib"


class FraudDetectionModel:
    def __init__(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
        else:
            self.model = LogisticRegression()
            self.train()

    def train(self):
        # Load your data from CSV files
        X = pd.read_csv('data/csv/X_train.csv')
        y = pd.read_csv('data/csv/y_train.csv').values.ravel()
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        self.model.fit(X_train, y_train)
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Logistic Regression Model accuracy: {accuracy}")
        joblib.dump(self.model, MODEL_PATH)

    def predict(self, features):
        return self.model.predict([features])[0]


fraud_model = FraudDetectionModel()


def predict_fraud(features):
    return fraud_model.predict(features)

# Train the model when this module is imported
if not os.path.exists(MODEL_PATH):
    fraud_model.train()
