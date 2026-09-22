import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, 'client', 'dist');

// Route Imports
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import academicToolsRoutes from './routes/academicToolsRoutes.js';
import careerRoutes from './routes/careerRoutes.js';
import servicesRoutes from './routes/servicesRoutes.js';
import engagementRoutes from './routes/engagementRoutes.js';
// New specialized route modules
import teacherRoutes from './routes/teacherRoutes.js';
import marksRoutes from './routes/marksRoutes.js';
import ragRoutes from './routes/ragRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Security HTTP Headers with SPA compatibility
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS Setup
const parseOrigins = () => {
  const envOrigins = [process.env.CLIENT_URL, process.env.FRONTEND_URL].filter(Boolean);
  const defaults = [];
  // To allow specific origins in development, set CLIENT_URL or FRONTEND_URL env variables.
  const list = [];
  envOrigins.forEach((item) => {
    if (item.includes(',')) {
      list.push(...item.split(',').map((o) => o.trim()));
    } else {
      list.push(item.trim());
    }
  });
  return [...new Set([...list, ...defaults])];
};

const allowedOriginList = parseOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, Render health checks)
      if (!origin) return callback(null, true);

      // Check explicit allowed origins
      if (allowedOriginList.includes(origin)) {
        return callback(null, true);
      }

      // Allow all Vercel deployments (*.vercel.app)
      if (/^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Allow all Render deployments (*.onrender.com)
      if (/^https:\/\/([a-zA-Z0-9_-]+\.)*onrender\.com$/.test(origin)) {
        return callback(null, true);
      }

      // Allow development origins
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  })
);

// Rate Limiting (Prevents DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', limiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'UniAssist AI Backend'
  });
});

// API Routes Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/faqs', faqRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/academic', academicToolsRoutes);
app.use('/api/v1/career', careerRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/engagement', engagementRoutes);
// Specialized academic modules
app.use('/api/v1/teacher', teacherRoutes);
app.use('/api/v1/marks', marksRoutes);
app.use('/api/v1/rag', ragRoutes);
app.use('/api/v1/voice', voiceRoutes);
// Serve static assets from the React build if present
app.use(express.static(distPath));

// Fallback to index.html for client-side SPA routing (excluding API routes)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.resolve(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});
// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[UniAssist AI Backend Running] Mode: ${process.env.NODE_ENV || 'development'} | Port: ${PORT}`);
});

export default app;
