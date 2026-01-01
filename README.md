# PIX Payment API

A dynamic API for simulating the Brazilian PIX instant payment system based on PIX keys.

## Installation

```bash
npm install
```

## Running the API

```bash
npm start
```

The API will run on `http://localhost:3000`

## API Endpoints

### PIX Keys

#### Register a new PIX key
```bash
POST /api/pix/keys
Content-Type: application/json

{
  "type": "cpf|email|phone|random",
  "key": "12345678900",
  "name": "User Name",
  "bank": "Bank Name",
  "account": "12345-6",
  "agency": "0001"
}
```

#### Get PIX key by value
```bash
GET /api/pix/keys/:key
```

#### Get all PIX keys
```bash
GET /api/pix/keys
```

#### Delete a PIX key
```bash
DELETE /api/pix/keys/:key
```

### Transactions

#### Create a transaction
```bash
POST /api/transactions
Content-Type: application/json

{
  "senderKey": "12345678900",
  "receiverKey": "joao.silva@email.com",
  "amount": 100.50,
  "description": "Payment for services"
}
```

#### Get transaction by ID
```bash
GET /api/transactions/:id
```

#### Get transactions by PIX key
```bash
GET /api/transactions/pix/:key
```

#### Get all transactions
```bash
GET /api/transactions
```

## Example Usage

### Create a PIX key
```bash
curl -X POST http://localhost:3000/api/pix/keys \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cpf",
    "key": "98765432100",
    "name": "Pedro Oliveira",
    "bank": "Itaú",
    "account": "54321-0",
    "agency": "1234"
  }'
```

### Create a transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "senderKey": "12345678900",
    "receiverKey": "98765432100",
    "amount": 50.00,
    "description": "Lunch"
  }'
```

### Query transactions for a PIX key
```bash
curl http://localhost:3000/api/transactions/pix/12345678900
```

## Features

- Dynamic PIX key registration (CPF, Email, Phone, Random)
- Instant transaction processing
- Transaction history by PIX key
- Mock data for testing
- RESTful API design