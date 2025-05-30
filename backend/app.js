const express = require('express');
const dotenv = require('dotenv');
const corsMiddleware = require('./middlewares/corsMiddleware');
const authRoutes = require('./routes/authRoutes');
const orgRoutes=require('./routes/organizationRoutes');
const fileRoutes=require('./routes/fileRoutes');
const reviewRoutes=require('./routes/reviewRoutes');
const { connectToGridFS } = require('./config/gridfs');
const db=require('./config/database');


dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(corsMiddleware)

// Database connection
db.then(() => {
   console.log('MongoDB connected');
  connectToGridFS();
}).catch((err) => console.error('MongoDB connection error:', err));
  
// Routes
app.use('/auth', authRoutes);
app.use('/organization', orgRoutes);
app.use('/file', fileRoutes);
app.use('/review', reviewRoutes);

module.exports = app