// api/[...all].js
const mongoose = require("mongoose");

let cachedDb = null;

// Simple connection function
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    // Simple connection options that work with all Mongoose versions
    const opts = {
      bufferCommands: false,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Get MongoDB URL from environment
    const mongoUrl = process.env.MONGODB_URL || process.env.DATABASE_URL;
    if (!mongoUrl) {
      throw new Error('MongoDB URL not found in environment variables');
    }

    console.log("Connecting to MongoDB...");
    const db = await mongoose.connect(mongoUrl, opts);
    cachedDb = db;
    console.log("Connected to MongoDB successfully");
    return db;
    
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    cachedDb = null;
    throw error;
  }
}

// Main handler function
export default async function handler(req, res) {
  try {
    console.log(`${req.method} ${req.url} - Starting request`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Connect to database first
    await connectToDatabase();
    
    // Try to import and use your app
    let app;
    try {
      app = require("../app");
    } catch (appError) {
      console.error("Failed to import app:", appError);
      return res.status(500).json({
        error: "App Import Error",
        message: appError.message
      });
    }
    
    // Use serverless-http to wrap the Express app
    const serverless = require("serverless-http");
    const handler = serverless(app);
    
    return await handler(req, res);
    
  } catch (error) {
    console.error("Handler error:", error);
    console.error("Error stack:", error.stack);
    
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}