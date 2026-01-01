const request = require('supertest');
const express = require('express');
const pixRoutes = require('./pixRoutes');

const app = express();
app.use(express.json());
app.use('/api/pix', pixRoutes);

describe('PIX Routes', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('POST /api/pix/keys', () => {
    test('should create a new PIX key with valid data', async () => {
      const newKey = {
        type: 'cpf',
        key: '12345678909',
        name: 'Test User',
        bank: 'Test Bank',
        account: '12345-6',
        agency: '0001'
      };

      const response = await request(app)
        .post('/api/pix/keys')
        .send(newKey)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.key).toBe(newKey.key);
      expect(response.body.name).toBe(newKey.name);
    });

    test('should return 400 for missing fields', async () => {
      const incompleteKey = {
        type: 'cpf',
        key: '12345678909'
      };

      await request(app)
        .post('/api/pix/keys')
        .send(incompleteKey)
        .expect(400);

      const incompleteKey2 = { type: 'cpf' };

      await request(app)
        .post('/api/pix/keys')
        .send(incompleteKey2)
        .expect(400);
    });

    test('should return 400 for invalid type', async () => {
      const invalidKey = {
        type: 'invalid',
        key: '12345678909',
        name: 'Test User',
        bank: 'Test Bank',
        account: '12345-6',
        agency: '0001'
      };

      await request(app)
        .post('/api/pix/keys')
        .send(invalidKey)
        .expect(400);
    });

    test('should return 400 for invalid CPF format', async () => {
      const invalidKey = {
        type: 'cpf',
        key: '12345678900',
        name: 'Test User',
        bank: 'Test Bank',
        account: '12345-6',
        agency: '0001'
      };

      await request(app)
        .post('/api/pix/keys')
        .send(invalidKey)
        .expect(400);
    });

    test('should return 409 for duplicate key', async () => {
      const duplicateKey = {
        type: 'cpf',
        key: '52998224725',
        name: 'Test User',
        bank: 'Test Bank',
        account: '12345-6',
        agency: '0001'
      };

      await request(app)
        .post('/api/pix/keys')
        .send(duplicateKey)
        .expect(409);
    });
  });

  describe('GET /api/pix/keys/:key', () => {
    test('should return a PIX key', async () => {
      const response = await request(app)
        .get('/api/pix/keys/52998224725')
        .expect(200);

      expect(response.body).toHaveProperty('key', '52998224725');
      expect(response.body).toHaveProperty('name');
    });

    test('should return 404 for non-existent key', async () => {
      await request(app)
        .get('/api/pix/keys/00000000000')
        .expect(404);
    });
  });

  describe('GET /api/pix/keys', () => {
    test('should return all PIX keys', async () => {
      const response = await request(app)
        .get('/api/pix/keys')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/pix/keys/:key', () => {
    test('should delete a PIX key', async () => {
      const response = await request(app)
        .delete('/api/pix/keys/52998224725')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'PIX key deleted successfully');

      const keyResponse = await request(app)
        .get('/api/pix/keys/52998224725')
        .expect(200);

      expect(keyResponse.body.active).toBe(false);
    });

    test('should return 404 for non-existent key', async () => {
      await request(app)
        .delete('/api/pix/keys/00000000000')
        .expect(404);
    });
  });
});
