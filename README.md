# HackMIT 2024 API - Fraud Detection and Transaction Management

## 🌟 Overview

This monorepo project, developed during HackMIT 2024, provides a robust backend infrastructure for managing user transactions and detecting potential fraud. It leverages a dual-stack approach, combining a Python-based FastAPI service for machine learning-driven fraud prediction with a TypeScript-based Express.js server for API routing and interaction with a Convex.dev backend as a service (BaaS) for data persistence. This setup ensures both high performance for ML inferences and efficient, scalable data management.

This repository is a fork of an original project, enhanced with custom modifications and extended functionalities, particularly in the fraud detection capabilities.

## ✨ Features

- **User Management**: API endpoints for creating, retrieving, updating, and deleting user records.
- **Transaction Management**: Comprehensive API for handling transaction creation, retrieval (all, by ID, by user), updates, and deletions.
- **Real-time Fraud Prediction**: Integrates multiple machine learning models (Logistic Regression, TensorFlow, LLaMA-based analysis) to assess transaction legitimacy.
- **Asynchronous Fraud Processing**: Transactions are initially stored temporarily, and fraud prediction runs in the background, updating the transaction status once completed.
- **Scalable Backend**: Utilizes Convex.dev for a reactive, serverless database and function platform, simplifying data synchronization and state management.
- **Dockerized Deployment**: Both the Python ML API and the TypeScript server are containerized for consistent and isolated deployment.
- **API Gateway/Orchestration**: The TypeScript Express server acts as an orchestrator, handling incoming requests, interacting with Convex, and delegating fraud prediction to the Python FastAPI service.
- **Comprehensive Error Handling & Rate Limiting**: Implements robust error handling and API rate limiting for security and stability.

## 🚀 Architecture

The project follows a microservices-inspired architecture:

1.  **TypeScript Express.js Server (Frontend-facing API)**:
    *   Handles all incoming HTTP requests for user and transaction management.
    *   Acts as an API gateway, routing requests to appropriate Convex.dev functions.
    *   Orchestrates the fraud detection workflow:
        *   Stores initial transaction data temporarily in Convex.
        *   Calls the Python FastAPI service for fraud prediction.
        *   Updates the transaction in Convex with fraud analysis results.
    *   Implements CORS, rate limiting, and centralized error handling.
    *   Deployed as a Node.js application.

2.  **Python FastAPI Service (ML-driven Fraud Prediction)**:
    *   Exposes a `/api/v1/predict_fraud` endpoint.
    *   Integrates three fraud detection mechanisms:
        *   **Logistic Regression**: A traditional statistical model for baseline prediction.
        *   **TensorFlow Model**: A neural network for more complex pattern recognition.
        *   **LLaMA Integration**: Leverages `transformers` library (using a GPT-2 model as a placeholder for LLaMA, demonstrating the capability) for natural language understanding of transaction details to provide explanations.
    *   The models are trained using mock data (e.g., `X_train.csv`, `y_train.csv`).
    *   Deployed as a Python FastAPI application, containerized with Docker.

3.  **Convex.dev (Backend as a Service)**:
    *   Provides a reactive, serverless database for `users`, `transactions`, and `tempTransactions`.
    *   Hosts server-side functions (mutations and queries) for data operations.
    *   Enables real-time data updates and synchronization.

```mermaid
graph TD
    A[Client Application] -->|HTTP Requests| B(TypeScript Express Server)
    B -->|User/Transaction Mutations/Queries| C(Convex.dev BaaS)
    B -->|Fraud Prediction Request| D(Python FastAPI ML Service)
    D -->|Prediction Results| B
    C -->|Store/Retrieve Data| E[Database (Convex)]
    D -->|Load/Train Models| F[ML Models (Logistic Regression, TensorFlow, LLaMA)]
    subgraph TypeScript Express Server
        B
    end
    subgraph Python FastAPI ML Service
        D
        F
    end
    subgraph Convex.dev
        C
        E
    end
