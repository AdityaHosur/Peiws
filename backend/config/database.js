const mongoose = require('mongoose');
const dotenv = require('dotenv');
const prometheus = require('prom-client');

dotenv.config();

// Connect to MongoDB
const db=mongoose.connect(process.env.MONGO_URI)
const mongodbConnectionsTotal = new prometheus.Gauge({
  name: 'mongodb_connections_total',
  help: 'Total number of MongoDB connections'
});

const mongodbConnectionsActive = new prometheus.Gauge({
  name: 'mongodb_connections_active',
  help: 'Number of active MongoDB connections'
});

setInterval(() => {
  if (mongoose.connection.readyState === 1) { 
    const stats = mongoose.connection.db.admin().serverStatus();
    if (stats && stats.connections) {
      mongodbConnectionsTotal.set(stats.connections.totalCreated || 0);
      mongodbConnectionsActive.set(stats.connections.current || 0);
    }
  }
}, 15000);

module.exports = db;