import express from 'express';
import { MongoClient } from 'mongodb';
import spaceRoutes from './routes/space.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import proposalRoutes from './routes/proposal.routes.js';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js'
import User from './models/user.model.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes.js';
import pipelineRoutes from './routes/pipeline.routes.js'
import path from "path";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import debugRoutes from './routes/debug.routes.js'
import Campaign from './models/campaign.model.js';
import { authenticate } from './middleware/authenticate.middleware.js';
import campaignRoutes from './routes/campaign.routes.js'
import notificationRoutes from './routes/notification.routes.js';
import { startCampaignReminderJob } from './cron/campaignReminderJob.js';
import { startSpaceReminderJob } from './cron/spaceReminderJob.js';
import { startAvailabilityUpdaterJob } from './cron/availabilityUpdater.js'; // <-- Updated pat
import revenueRoutes from './routes/revenue.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import reportRoutes from './routes/reports.routes.js'; 
// import { requestMetrics } from './metrics.js';
dotenv.config();
const app = express();
const port = 3000;
// MongoDB URI and DB name
const MONGO_URI ='mongodb+srv://UserSukumar:ioadjnJ41516568@cluster0.vqpaxl6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0' ;
const DB_NAME = 'test';
// app.use('/uploads', express.static('uploads'));
app.get('/uploads/:filename', (req, res) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filePath); // ✅ Force download
});

const allowedOrigins = ['http://localhost:5173', 'https://devangi.digitalooh.io','http://dooh-frontend.s3-website.ap-south-1.amazonaws.com', 'http://localhost:4173', 'http://localhost:5174', 'https://new-devangi-outdoor-1.onrender.com', 'https://new-devangi-outdoor.onrender.com', 'https://new-devangi-outdoor-1.onrender.com','http://devangi.digitalooh.io','http://test.digitalooh.io.s3-website.ap-south-1.amazonaws.com'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
// app.options('*', cors());
// app.options('*', (req, res) => {
//   console.log('✅ OPTIONS reached the Lambda');
//   res.sendStatus(200);
// });




let db;
app.use(express.json()); // for parsing application/json
// app.use(requestMetrics());
app.use('/api/spaces', spaceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes); // ✅ 2. USE YOUR NEW REPORTS ROUTE

app.use((req, res, next) => {
  res.status(404).send({ message: 'Route not found' });
});

// Error handling middleware (500 handler for unexpected errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Internal Server Error' });
});
export const createAdminIfNotExists = async () => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (!existingAdmin) {
    // const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    console.log(process.env.ADMIN_EMAIL);
    const adminUser = new User({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      phone: process.env.ADMIN_PHONE,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
    });

    await adminUser.save();
    console.log('✅ Admin account created successfully');
  } else {
    console.log('ℹ️ Admin account already exists');
  }
};
// Function to connect to MongoDB

// Define route after DB is connected
function setupRoutes() {
  app.get('/', async (req, res) => {
    try {
      const collection = db.collection('demo');
      const data = await collection.find({}).toArray();
      res.json({ message: 'Hello from Express + MongoDB!', data });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching data' });
    }
  });
}



// Main function to connect DB and start server
async function connectAndStart() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
    await createAdminIfNotExists();
    // startCampaignReminderJob();
    // startSpaceReminderJob();
    // startAvailabilityUpdaterJob();
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error(' Failed to connect MongoDB:', err.message);
  }
}

connectAndStart();