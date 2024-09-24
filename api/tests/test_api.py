from fastapi.testclient import TestClient
from main import app
from datetime import datetime

client = TestClient(app)

def test_predict_fraud():
    response = client.post("/api/v1/predict_fraud/", json={
        "amount": 100.50,
        "product_category": "Electronics",
        "customer_location": "New York",
        "account_age_days": 365,
        "transaction_date": datetime.now().isoformat()
    })
    assert response.status_code == 200
    data = response.json()
    assert "is_fraudulent" in data
    assert "fraud_explanation" in data
    assert isinstance(data["is_fraudulent"], bool)
    assert isinstance(data["fraud_explanation"], str)

def test_predict_fraud_high_amount():
    response = client.post(
        "/api/v1/predict_fraud/",
        json={
            "amount": 10000.00,
            "product_category": "Jewelry",
            "customer_location": "Online",
            "account_age_days": 5,
            "transaction_date": datetime.now().isoformat(),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_fraudulent"] == True
    assert "Potential fraud detected" in data["fraud_explanation"]

def test_predict_fraud_low_risk():
    response = client.post(
        "/api/v1/predict_fraud/",
        json={
            "amount": 50.00,
            "product_category": "Groceries",
            "customer_location": "Local Store",
            "account_age_days": 1000,
            "transaction_date": datetime.now().isoformat(),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_fraudulent"] == False
    assert "No fraudulent activity detected" in data["fraud_explanation"]
