import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { initSocket } from './socket';

// Routes
import authRoutes from './routes/auth';
import timeLogRoutes from './routes/timeLogs';
import trainsRouter from './routes/trains';
import { seedTrainsAndStations } from './controllers/trains';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://yashashyashash1_db_user:yashash87920@traintrack1111.hi2fxur.mongodb.net/train_tracker?retryWrites=true&w=majority&appName=traintrack1111';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/timelogs', timeLogRoutes);
app.use('/api', trainsRouter);

// Basic Route
app.get('/', (req, res) => {
    res.send('Time Tracker API is running');
});

// Database and Server Start
console.log('Attempting to connect to MongoDB with URI:', MONGO_URI);
console.log('Target server port is:', PORT);
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Seed train and station data if empty
    seedTrainsAndStations();
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
