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
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes.js';
import pipelineRoutes from './routes/pipeline.routes.js'
import path from "path";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
// Enable CORS for all origins (or specify origin)
dotenv.config();
const app = express();
const port = 3000;
// MongoDB URI and DB name
const MONGO_URI = 'mongodb+srv://devangioutdoor:vNQnXCHKYkc1QulR@cluster0.jhsmpz9.mongodb.net/?retryWrites=true&w=majority&tls=true&appName=Cluster0';
const DB_NAME = 'testdb';
// app.use('/uploads', express.static('uploads'));
app.get('/uploads/:filename', (req, res) => {
  const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filePath); // ✅ Force download
});
app.use(cors({
  origin: 'http://localhost:5173', // your Vite frontend URL
  credentials: true,              // if you’re using cookies or auth headers
}));
let db;
app.use(express.json()); // for parsing application/json
app.use('/api/spaces', spaceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pipeline',pipelineRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

export const createAdminIfNotExists = async () => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (!existingAdmin) {
    // const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
console.log( process.env.ADMIN_EMAIL);
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
      app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
      });
    } catch (err) {
      console.error(' Failed to connect MongoDB:', err.message);
    }
  }
  
  connectAndStart();
