# pylint: disable=E0401

import uvicorn
import os
from fastapi import FastAPI
from app.routers.transactions import router as transactions_router

app = FastAPI()

app.include_router(transactions_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Welcome to the Fraud Detection API"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
