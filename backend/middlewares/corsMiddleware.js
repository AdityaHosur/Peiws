const cors = require('cors');

// Configure CORS
const corsMiddleware = cors({
  origin: 'http://localhost:3000', // Allow requests from the frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Allowed HTTP methods
  credentials: true, // Allow cookies and credentials
});

module.exports = corsMiddleware;