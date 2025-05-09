const request = require('supertest');
const app = require('../app'); // Import your Express app

describe('Auth API Tests', () => {
  describe('POST /auth/register', () => {
    it('should return 400 if the user already exists', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should return 200 and a token if login is successful', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });
});