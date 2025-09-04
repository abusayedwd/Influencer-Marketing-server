const mongoose = require("mongoose");
const serverless = require("serverless-http");
const config = require("../src/config/config");
const logger = require("../src/config/logger");
const app = require("../src/app");

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    isConnected = true;
    logger.info("Connected to MongoDB Atlas");
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Default export for Vercel
export default async function handler(req, res) {
  try {
    console.log('Serverless function called:', req.url);
    
    // Connect to database
    await connectToDatabase();
    
    // Create serverless handler
    const serverlessHandler = serverless(app);
    
    // Call the handler
    return await serverlessHandler(req, res);
  } catch (error) {
    console.error('Serverless error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}