const { register } = require('../controllers/authController');
const User = require('../models/User');

jest.mock('../models/User'); // Mock the User model

describe('Auth Controller - Register', () => {
  it('should return 400 if user already exists', async () => {
    const req = {
      body: { name: 'John Doe', email: 'john@example.com', password: 'password123' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    User.findOne.mockResolvedValue({ email: 'john@example.com' }); // Mock existing user

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
  });
});