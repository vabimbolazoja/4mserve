// server/server.js
import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
connectDB();

// Security + Middleware
app.use(helmet());
app.use(express.json());
app.use(mongoSanitize());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

// Routes
app.use('/api', authRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error' });
});

// Server Listen Logic with Error Handling
const PORT = process.env.PORT || 7002;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// 👇 Prevent crash loop on port conflict
server.on('error', (err) => {
  console.log(err)
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Kill the process or change the port.`);
    process.exit(1);
  } else {
    throw err;
  }
});
