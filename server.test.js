const request = require('supertest');
const server = require('./server');

describe('Server', () => {
  test('should load server without errors', () => {
    expect(server).toBeDefined();
    expect(typeof server).toBe('function');
  });

  test('should have CORS middleware configured', async () => {
    const response = await request(server)
      .get('/api/pix/keys')
      .expect('Content-Type', /json/);

    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  test('should not have X-Powered-By header', async () => {
    const response = await request(server)
      .get('/api/pix/keys');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  test('should register pix routes', async () => {
    const response = await request(server)
      .get('/api/pix/keys')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should register transaction routes', async () => {
    const response = await request(server)
      .get('/api/transactions')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should handle JSON body parsing', async () => {
    const response = await request(server)
      .post('/api/transactions')
      .send({
        senderKey: '12345678900',
        receiverKey: '+5511999999999',
        amount: 100
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
