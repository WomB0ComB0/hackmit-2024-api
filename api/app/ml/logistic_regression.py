from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

MODEL_PATH = "fraud_detection_model.joblib"

class FraudDetectionModel:
    def __init__(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
        else:
            self.model = LogisticRegression()

    def train(self, X, y):
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        self.model.fit(X_train, y_train)
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Model accuracy: {accuracy}")
        joblib.dump(self.model, MODEL_PATH)

    def predict(self, features):
        return self.model.predict([features])[0]

fraud_model = FraudDetectionModel()

def train_model(X, y):
    fraud_model.train(X, y)

def predict_fraud(features):
    return fraud_model.predict(features)
