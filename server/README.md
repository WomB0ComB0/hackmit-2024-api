# Health Check

```bash
curl https://hackmit-2024-server.vercel.app/health
```

# User Routes

## Create User

```bash
curl -X POST https://hackmit-2024-server.vercel.app/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

## Get User (replace USER_ID with an actual ID)

```bash
curl https://hackmit-2024-server.vercel.app/api/users/USER_ID
```

## Update User (replace USER_ID with an actual ID)

```bash
curl -X PUT https://hackmit-2024-server.vercel.app/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"name": "John Updated", "email": "john.updated@example.com"}'
```

## Delete User (replace USER_ID with an actual ID)

```bash
curl -X DELETE https://hackmit-2024-server.vercel.app/api/users/USER_ID
```

## Head User

```bash
curl -I -X HEAD https://hackmit-2024-server.vercel.app/api/users
```

## Options User

```bash
curl -X OPTIONS https://hackmit-2024-server.vercel.app/api/users
```

# Transaction Routes

## Create Transaction

```bash
curl -X POST https://hackmit-2024-server.vercel.app/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "amount": 100.50,
    "productCategory": "Electronics",
    "customerLocation": "New York",
    "accountAgeDays": 365,
    "transactionDate": "2023-09-15T12:00:00Z"
  }'
```

## Get Transaction (replace TRANSACTION_ID with an actual ID)

```bash
curl https://hackmit-2024-server.vercel.app/api/transactions/TRANSACTION_ID
```

## Update Transaction (replace TRANSACTION_ID with an actual ID)

```bash
curl -X PUT https://hackmit-2024-server.vercel.app/api/transactions/TRANSACTION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.75,
    "productCategory": "Clothing",
    "customerLocation": "Los Angeles",
    "accountAgeDays": 400,
    "transactionDate": "2023-09-16T14:30:00Z"
  }'
```

## Delete Transaction (replace TRANSACTION_ID with an actual ID)

```bash
curl -X DELETE https://hackmit-2024-server.vercel.app/api/transactions/TRANSACTION_ID
```

## Head Transaction

```bash
curl -I -X HEAD https://hackmit-2024-server.vercel.app/api/transactions
```

## Options Transaction

```bash
curl -X OPTIONS https://hackmit-2024-server.vercel.app/api/transactions
```
