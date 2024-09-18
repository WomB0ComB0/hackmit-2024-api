import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base

from app.db.database import get_db

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_create_transaction(test_db):
    response = client.post(
        "/api/v1/transactions/",
        json={
            "amount": 100.50,
            "product_category": "Electronics",
            "customer_location": "New York",
            "account_age_days": 365
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 100.50
    assert data["product_category"] == "Electronics"
    assert data["customer_location"] == "New York"
    assert data["account_age_days"] == 365
    assert "id" in data
    assert "is_fraudulent" in data
    assert "fraud_explanation" in data

def test_read_transactions(test_db):
    # First, create a transaction
    client.post(
        "/api/v1/transactions/",
        json={
            "amount": 100.50,
            "product_category": "Electronics",
            "customer_location": "New York",
            "account_age_days": 365
        }
    )

    response = client.get("/api/v1/transactions/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0

def test_read_transaction(test_db):
    # First, create a transaction
    create_response = client.post(
        "/api/v1/transactions/",
        json={
            "amount": 100.50,
            "product_category": "Electronics",
            "customer_location": "New York",
            "account_age_days": 365
        }
    )
    created_transaction = create_response.json()

    response = client.get(f"/api/v1/transactions/{created_transaction['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_transaction["id"]

def test_update_transaction(test_db):
    # First, create a transaction
    create_response = client.post(
        "/api/v1/transactions/",
        json={
            "amount": 100.50,
            "product_category": "Electronics",
            "customer_location": "New York",
            "account_age_days": 365
        }
    )
    created_transaction = create_response.json()

    response = client.put(
        f"/api/v1/transactions/{created_transaction['id']}",
        json={"is_fraudulent": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_fraudulent"] == True

def test_delete_transaction(test_db):
    # First, create a transaction
    create_response = client.post(
        "/api/v1/transactions/",
        json={
            "amount": 100.50,
            "product_category": "Electronics",
            "customer_location": "New York",
            "account_age_days": 365
        }
    )
    created_transaction = create_response.json()

    response = client.delete(f"/api/v1/transactions/{created_transaction['id']}")
    assert response.status_code == 200

    # Try to get the deleted transaction
    get_response = client.get(f"/api/v1/transactions/{created_transaction['id']}")
    assert get_response.status_code == 404