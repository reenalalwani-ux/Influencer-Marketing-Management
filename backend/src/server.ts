import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { seedDatabase } from './seed/seedData';

// Import Routes
import authRoutes from './routes/authRoutes';
import rolesRoutes from './routes/rolesRoutes';
import employeeRoutes from './routes/employeeRoutes';
import brandRoutes from './routes/brandRoutes';
import employeeBrandRoutes from './routes/employeeBrandRoutes';
import taskRoutes from './routes/taskRoutes';
import postingRoutes from './routes/postingRoutes';
import verificationRoutes from './routes/verificationRoutes';
import performanceRoutes from './routes/performanceRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import reportRoutes from './routes/reportRoutes';
import settingsRoutes from './routes/settingsRoutes';
import dbRoutes from './routes/dbRoutes';
import targetRoutes from './routes/targetRoutes';
import influencerRoutes from './routes/influencerRoutes';
import contentCalendarRoutes from './routes/contentCalendarRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Root endpoint welcome message
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Influencer Marketing Operation Backend API is running live on Render!',
    healthCheck: '/api/v1/health',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    system: 'Influencer Marketing Operations & Employee Tracking System',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// API Routes (v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/employee-brands', employeeBrandRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/postings', postingRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/performance', performanceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/targets', targetRoutes);
app.use('/api/v1/influencers', influencerRoutes);
app.use('/api/v1/content-calendar', contentCalendarRoutes);
app.use('/api/v1/db', dbRoutes);

// Start server and initialize DB
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Influencer Management Backend API running on port ${PORT}`);
      console.log(`🌐 API Endpoint: http://localhost:${PORT}/api/v1`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error);
    process.exit(1);
  }
};

// Server started
startServer();
