const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const adminRouter = require('./routes/admin');
const tryonRouter = require('./routes/tryon');

const app = express();

// CORS — allow frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL    || 'http://localhost:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Raw body needed for Razorpay webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON body parsing for all other routes
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'lymlyn-backend', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/tryon', tryonRouter);
app.use('/api/auth', require('./routes/auth'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('=== SERVER ERROR ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('===================');
  res.status(500).json({
    error: 'Internal server error',
    message: err.message  // show in dev, remove in production
  });
});

module.exports = app;
