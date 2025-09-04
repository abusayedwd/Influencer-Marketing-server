const mongoose = require("mongoose");
const config = require("./config/config");
const logger = require("./config/logger");
const app = require("./app");
const socketIo = require("socket.io");
const socketIO = require("./utils/socketIO");

let server;

// Only run in local development (not on Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  console.log('Starting local development server...');
  
  const myIp = process.env.BACKEND_IP || 'localhost';
  
  // Connect to MongoDB for local development
  mongoose.connect(config.mongoose.url, config.mongoose.options)
    .then(() => {
      logger.info("Connected to MongoDB Atlas (Local Development)");
      
      // Start the Express server
      server = app.listen(config.port, myIp, () => {
        logger.info(`🚀 Server running at http://${myIp}:${config.port}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
      
      // Initialize Socket.IO for real-time features (local only)
      const io = socketIo(server, {
        cors: { 
          origin: "*",
          methods: ["GET", "POST"]
        }
      });
      
      socketIO(io);
      global.io = io;
      logger.info("Socket.IO initialized");
      
    })
    .catch((error) => {
      logger.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    });

  // Graceful shutdown handlers
  const exitHandler = () => {
    logger.info('Shutting down server...');
    if (server) {
      server.close(() => {
        logger.info("Server closed");
        mongoose.connection.close(false, () => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        });
      });
    } else {
      process.exit(0);
    }
  };

  const unexpectedErrorHandler = (error) => {
    logger.error('Unexpected error:', error);
    exitHandler();
  };

  // Process event handlers
  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received");
    exitHandler();
  });
  process.on("SIGINT", () => {
    logger.info("SIGINT received");
    exitHandler();
  });
} else {
  console.log('Serverless environment detected - skipping local server startup');
}

// Export app for testing and serverless
module.exports = app;