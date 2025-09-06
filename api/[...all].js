// api/[...all].js
const mongoose = require("mongoose");
const config = require("./../src/config/config");
const app = require("./../src/app");

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log("Using cached database connection");
    return cachedDb;
  }

  try {
    console.log("Creating new database connection...");
    
    // Disconnect any existing connection first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    const opts = {
      bufferCommands: false,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 30000,
      minPoolSize: 0,
      heartbeatFrequencyMS: 30000,
    };

    const db = await mongoose.connect(config.mongoose.url, opts);
    cachedDb = db;
    console.log("Connected to MongoDB Atlas successfully");
    return db;
    
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    cachedDb = null;
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    console.log(`${req.method} ${req.url} - Starting request`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Use serverless-http to handle the Express app
    const serverless = require("serverless-http");
    const handler = serverless(app);
    
    return await handler(req, res);
    
  } catch (error) {
    console.error("API Handler error:", error);
    
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}