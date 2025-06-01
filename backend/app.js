const express = require('express');
const dotenv = require('dotenv');
const corsMiddleware = require('./middlewares/corsMiddleware');
const authRoutes = require('./routes/authRoutes');
const orgRoutes=require('./routes/organizationRoutes');
const fileRoutes=require('./routes/fileRoutes');
const reviewRoutes=require('./routes/reviewRoutes');
const { connectToGridFS } = require('./config/gridfs');
const db=require('./config/database');
const prometheus = require('prom-client');

dotenv.config();

const app = express();

const collectDefaultMetrics = prometheus.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const totalRequests = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new prometheus.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections'
});

// Middleware
app.use(express.json());
app.use(corsMiddleware);
app.use((req, res, next) => {
  activeConnections.inc();
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
    totalRequests.inc({ 
      method: req.method, 
      route, 
      status_code: res.statusCode 
    });
    activeConnections.dec();
  });
  next();
});

// Database connection
db.then(() => {
   console.log('MongoDB connected');
  connectToGridFS();
}).catch((err) => console.error('MongoDB connection error:', err));
  
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

// Routes
app.use('/auth', authRoutes);
app.use('/organization', orgRoutes);
app.use('/file', fileRoutes);
app.use('/review', reviewRoutes);

module.exports = app