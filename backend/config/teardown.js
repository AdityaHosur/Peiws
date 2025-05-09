const mongoose = require('mongoose');

module.exports = async () => {
  await mongoose.connection.close(); // Close the MongoDB connection
};