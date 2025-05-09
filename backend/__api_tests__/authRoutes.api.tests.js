const request = require('supertest');
const http = require('http');
const mongoose = require('mongoose');
const User = require('../models/User');
const app = require('../app');

let server;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
});

afterAll(async () => {
  await mongoose.connection.close();
  await server.close();
});

beforeEach(async () => {
  // Clean up the users collection before each test
  await User.deleteMany({});
});

describe('Auth API Tests', () => {
  describe('POST /auth/register', () => {
    it('should return 400 if the user already exists', async () => {
      // First, create a user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      // Try to register the same user again
      const res = await request(server)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists');
    });

    it('should successfully register a new user', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully');
    });
  });
});