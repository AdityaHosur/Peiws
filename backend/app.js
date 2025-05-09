const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const db=require('./config/database');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Database connection
db.then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));
  
// Routes
app.use('/auth', authRoutes);


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));