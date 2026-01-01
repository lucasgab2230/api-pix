const request = require('supertest');
const express = require('express');
const transactionRoutes = require('./transactionRoutes');

const app = express();
app.use(express.json());
app.use('/api/transactions', transactionRoutes);

describe('Transaction Routes', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('POST /api/transactions', () => {
    test('should create a transaction with valid data', async () => {
      const transaction = {
        senderKey: '12345678900',
        receiverKey: '+5511999999999',
        amount: 100.50,
        description: 'Payment'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transaction)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.senderKey).toBe(transaction.senderKey);
      expect(response.body.receiverKey).toBe(transaction.receiverKey);
      expect(response.body.amount).toBe(transaction.amount);
      expect(response.body.status).toBe('completed');
    });

    test('should return 400 for missing required fields', async () => {
      const incompleteTransaction = {
        senderKey: '12345678900'
      };

      await request(app)
        .post('/api/transactions')
        .send(incompleteTransaction)
        .expect(400);

      const incompleteTransaction2 = {
        senderKey: '12345678900',
        receiverKey: '+5511999999999'
      };

      await request(app)
        .post('/api/transactions')
        .send(incompleteTransaction2)
        .expect(400);
    });

    test('should return 400 for amount less than or equal to 0', async () => {
      const transaction = {
        senderKey: '12345678900',
        receiverKey: '+5511999999999',
        amount: 0
      };

      await request(app)
        .post('/api/transactions')
        .send(transaction)
        .expect(400);

      const transaction2 = {
        senderKey: '12345678900',
        receiverKey: '+5511999999999',
        amount: -10
      };

      await request(app)
        .post('/api/transactions')
        .send(transaction2)
        .expect(400);
    });

    test('should return 400 for invalid sender key', async () => {
      const transaction = {
        senderKey: '00000000000',
        receiverKey: '+5511999999999',
        amount: 100
      };

      await request(app)
        .post('/api/transactions')
        .send(transaction)
        .expect(400);
    });

    test('should return 400 for invalid receiver key', async () => {
      const transaction = {
        senderKey: '12345678900',
        receiverKey: '00000000000',
        amount: 100
      };

      await request(app)
        .post('/api/transactions')
        .send(transaction)
        .expect(400);
    });

    test('should return 400 for same sender and receiver', async () => {
      const transaction = {
        senderKey: '12345678900',
        receiverKey: '12345678900',
        amount: 100
      };

      await request(app)
        .post('/api/transactions')
        .send(transaction)
        .expect(400);
    });

    test('should create transaction without description', async () => {
      const transaction = {
        senderKey: '12345678900',
        receiverKey: '+5511999999999',
        amount: 100
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transaction)
        .expect(201);

      expect(response.body).toHaveProperty('description', '');
    });
  });

  describe('GET /api/transactions/:id', () => {
    test('should return a transaction by id', async () => {
      const createResponse = await request(app)
        .post('/api/transactions')
        .send({
          senderKey: '12345678900',
          receiverKey: '+5511999999999',
          amount: 100
        });

      const response = await request(app)
        .get(`/api/transactions/${createResponse.body.id}`)
        .expect(200);

      expect(response.body.id).toBe(createResponse.body.id);
      expect(response.body).toHaveProperty('senderKey');
      expect(response.body).toHaveProperty('receiverKey');
    });

    test('should return 404 for non-existent transaction', async () => {
      await request(app)
        .get('/api/transactions/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /api/transactions/pix/:key', () => {
    test('should return transactions by PIX key', async () => {
      await request(app)
        .post('/api/transactions')
        .send({
          senderKey: '12345678900',
          receiverKey: '+5511999999999',
          amount: 100
        });

      await request(app)
        .post('/api/transactions')
        .send({
          senderKey: '12345678900',
          receiverKey: '+5511999999999',
          amount: 50
        });

      const response = await request(app)
        .get('/api/transactions/pix/12345678900')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/transactions', () => {
    test('should return all transactions', async () => {
      await request(app)
        .post('/api/transactions')
        .send({
          senderKey: '12345678900',
          receiverKey: '+5511999999999',
          amount: 100
        });

      const response = await request(app)
        .get('/api/transactions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
