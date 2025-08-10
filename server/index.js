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
// 3️⃣ CORS setup (must come before routes)
app.use(cors({
  origin: "https://4mad.vercel.app", // your Vercel frontend
  credentials: true
}));

// 4️⃣ Handle preflight OPTIONS requests
app.options("*", cors({
  origin: "https://4mad.vercel.app",
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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



export default app; // <— This is key for Vercel
