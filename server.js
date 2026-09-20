import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

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

// Security HTTP Headers
app.use(helmet());

// CORS Setup
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
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

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[UniAssist AI Backend Running] Mode: ${process.env.NODE_ENV || 'development'} | Port: ${PORT}`);
});

export default app;
