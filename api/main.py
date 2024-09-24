# pylint: disable=E0401

from fastapi import FastAPI
from app.routers import transactions

app = FastAPI()

app.include_router(transactions.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Welcome to the Fraud Detection API"}
