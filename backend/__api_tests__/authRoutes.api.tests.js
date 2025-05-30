const request = require('supertest');
const http = require('http');
const mongoose = require('mongoose');
const User = require('../models/User');
const app = require('../app');
require('dotenv').config();

let server;

// Generate unique email to avoid conflicts with existing users
const generateUniqueEmail = (base) => {
  return `${base}-${Date.now()}@example.com`;
};

beforeAll(async () => {
  jest.setTimeout(30000);
  
  // Connect to database with proper options
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
});

afterAll(async () => {
  // Delete test users to clean up
  try {
    await User.deleteMany({ email: { $regex: /^(duplicate|new)-\d+@example\.com$/ } });
  } catch (err) {
    console.error('Error cleaning up test users:', err);
  }

  // Close the MongoDB connection - using disconnect() instead of connection.close()
  try {
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error disconnecting from MongoDB:', err);
  }
  
  // Force close the server
  try {
    server.close();
  } catch (err) {
    console.error('Error closing server:', err);
  }
  
  // Force close any remaining handles (this is the key addition)
  if (global.gc) {
    global.gc();
  }
  
  // Reset timeout
  jest.setTimeout(5000);
});

describe('Auth API Tests', () => {
  describe('POST /auth/register', () => {
    it('should return 400 if the user already exists', async () => {
      // Use unique email for test
      const email = generateUniqueEmail('duplicate');
      
      // First, create a user
      await User.create({
        name: 'Test User',
        email: email,
        password: 'password123'
      });

      // Try to register the same user again
      // CHANGE: Fixed route path - removed 'api/' prefix if it's not in your actual routes
      const res = await request(server)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: email,
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists');
    });

    it('should successfully register a new user', async () => {
      // Use unique email for test
      const email = generateUniqueEmail('new');
      
      // CHANGE: Fixed route path - removed 'api/' prefix if it's not in your actual routes
      const res = await request(server)
        .post('/auth/register')
        .send({
          name: 'New User',
          email: email,
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully');
    });
  });
});