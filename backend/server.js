const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sanitize: mongoSanitize } = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const { requestLogger, logSecurityEvent } = require('./middleware/auditLogger');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes  = require('./routes/authRoutes');
const cardRoutes  = require('./routes/cardRoutes');
const llmRoutes   = require('./routes/llmRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize express app
const app = express();
app.disable('etag'); // Prevent ETag generation — avoids timing/info leakage on API responses

// Database connection status
let dbConnected = false;

// Connect to database
connectDB().then(connected => {
  dbConnected = connected;
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Prevent sensitive API responses from being cached by browsers or proxies
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
});

// Permissions-Policy — restrict access to sensitive browser APIs
// Helmet does not set this header automatically; we add it explicitly.
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), interest-cohort=()'
  );
  next();
});

// Sanitize request body and params to prevent NoSQL injection ($gt, $where, etc.)
// Uses sanitize() directly to avoid Express 5 read-only req.query conflict
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize(req.body);
  if (req.params) req.params = mongoSanitize(req.params);
  next();
});


// Rate limiting (disabled during tests; skipped for localhost in development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10000 : 100,
  skip: (req) => process.env.NODE_ENV === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
  message: { error: 'Too many requests, please try again later.' },
  handler: (req, res, next, options) => {
    logSecurityEvent('rate_limit_hit', req, { limit: options.max });
    res.status(options.statusCode).json(options.message);
  }
});
app.use(limiter);

// HTTP Parameter Pollution protection
app.use(hpp());

// Body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Audit request logging
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Secure Datacard API is running',
    database: dbConnected ? 'connected' : 'not connected',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/generate', llmRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  logSecurityEvent('route_not_found', req);
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Only start listening when run directly (not when required by tests)
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = { app };
