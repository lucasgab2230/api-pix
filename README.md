# PIX Payment API

A production-ready API for simulating the Brazilian PIX instant payment system with complete validation, balance management, and real-world features.

## Installation

```bash
npm install
```

## Running the API

```bash
npm start
```

The API will run on `http://localhost:3000`

## Features

- **PIX Key Validation**: Validates CPF, Email, Phone, and Random keys with Brazilian formatting
- **Balance Management**: Track and manage account balances with deposits and withdrawals
- **Transaction Processing**: Asynchronous transaction processing with status tracking
- **Security Limits**: Daily transaction limits, single transaction limits, and frequency limits
- **Real-time Processing**: Transaction status workflow (pending → completed/failed)
- **Account Statistics**: View transaction statistics for any PIX key

## Transaction Limits

- **Daily Limit**: R$ 50,000.00
- **Single Transaction Limit**: R$ 10,000.00
- **Frequency Limit**: 20 transactions per day

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
  "agency": "0001",
  "initialBalance": 1000.00
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

#### Get balance for a PIX key
```bash
GET /api/pix/keys/:key/balance
```

#### Get transaction statistics for a PIX key
```bash
GET /api/pix/keys/:key/stats
```

#### Deposit to a PIX key
```bash
POST /api/pix/keys/:key/deposit
Content-Type: application/json

{
  "amount": 500.00
}
```

#### Withdraw from a PIX key
```bash
POST /api/pix/keys/:key/withdraw
Content-Type: application/json

{
  "amount": 200.00
}
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

#### Cancel a pending transaction
```bash
DELETE /api/transactions/:id
```

## Example Usage

### Create a PIX key with initial balance
```bash
curl -X POST http://localhost:3000/api/pix/keys \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cpf",
    "key": "98765432100",
    "name": "Pedro Oliveira",
    "bank": "Itaú",
    "account": "54321-0",
    "agency": "1234",
    "initialBalance": 1000.00
  }'
```

### Check balance
```bash
curl http://localhost:3000/api/pix/keys/98765432100/balance
```

### Deposit funds
```bash
curl -X POST http://localhost:3000/api/pix/keys/98765432100/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": 500.00}'
```

### Create a transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "senderKey": "98765432100",
    "receiverKey": "12345678900",
    "amount": 50.00,
    "description": "Lunch"
  }'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "senderKey": "98765432100",
  "senderName": "Pedro Oliveira",
  "receiverKey": "12345678900",
  "receiverName": "João Silva",
  "amount": 50.00,
  "description": "Lunch",
  "status": "pending",
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-01T10:00:00.000Z"
}
```

### Cancel a pending transaction
```bash
curl -X DELETE http://localhost:3000/api/transactions/550e8400-e29b-41d4-a716-446655440000
```

### Get transaction statistics
```bash
curl http://localhost:3000/api/pix/keys/12345678900/stats
```

Response:
```json
{
  "totalTransactions": 15,
  "totalSent": 8,
  "totalReceived": 7,
  "totalSentAmount": 2500.00,
  "totalReceivedAmount": 1500.00
}
```

## Transaction Status Workflow

1. **pending** - Transaction created, awaiting processing
2. **completed** - Transaction processed successfully, balances updated
3. **failed** - Transaction failed due to error
4. **cancelled** - Transaction cancelled by user (only for pending transactions)

## Key Validation Rules

### CPF
- Must be a valid Brazilian CPF with correct checksum
- Format: 11 digits (e.g., 12345678900)

### Email
- Must be a valid email format
- Example: user@domain.com

### Phone
- Must follow Brazilian format with country code
- Format: +55 followed by 11 digits (e.g., +5511999999999)

### Random Key
- Must be a UUID v4 format
- Example: 550e8400-e29b-41d4-a716-446655440000

## Testing

```bash
npm test
```

## Linting

```bash
npm run lint
```

## Production Deployment Considerations

For production deployment, consider:
- Using a real database (PostgreSQL, MongoDB, etc.) instead of in-memory storage
- Implementing authentication and authorization (JWT, OAuth)
- Adding rate limiting at the API gateway level
- Implementing proper logging and monitoring
- Adding webhook support for transaction notifications
- Implementing proper encryption for sensitive data
- Using environment variables for configuration
- Setting up proper backup and recovery procedures
- Implementing proper API versioning