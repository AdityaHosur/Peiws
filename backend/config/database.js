const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
const db=mongoose.connect(process.env.MONGO_URI)

module.exports = db;