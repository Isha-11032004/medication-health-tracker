import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
import cors from 'cors';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startScheduler } from './utils/scheduler.js';

import authRoutes from './routes/authRoutes.js';
import medicationRoutes from './routes/medicationRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import caregiverRoutes from './routes/caregiverRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/health-logs', healthRoutes);
app.use('/api/caregivers', caregiverRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reminders', reminderRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

app.use(errorHandler);

const start = async () => {
  await connectDB();
  startScheduler();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
