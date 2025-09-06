 

// const mongoose = require("mongoose");
// const config = require("./config/config");
// const logger = require("./config/logger");
// const app = require("./app");

// let server;

// if (process.env.VERCEL) {
//   // === Vercel serverless mode ===
//   const serverless = require("serverless-http"); 
//   let isConnected = false;

//   async function connectToDatabase() {
//     if (isConnected) return;
//     await mongoose.connect(config.mongoose.url, config.mongoose.options);
//     isConnected = true;
//     logger.info("Connected to MongoDB Atlas");
//   }

// module.exports = async (req, res) => { 
//   try {
//     console.log('Serverless function called:', req.url); 
//     await connectToDatabase();
//     const handler = serverless(app);
//     return handler(req, res);
//   } catch (error) {
//     console.error('Serverless error:', error);
//     return res.status(500).json({ error: 'Internal Server Errorrr' });
//   }
// };

// } else {
//   // === Local development mode ===
//   const myIp = process.env.BACKEND_IP;

//   mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
//     logger.info("Connected to MongoDB Atlas");

//     server = app.listen(config.port, myIp, () => {
//       logger.info(`Listening on http://${myIp}:${config.port}`);
//     });

//     // Socket.IO for local dev
//     const socketIo = require("socket.io");
//     const socketIO = require("./utils/socketIO");
//     const io = socketIo(server, {
//       cors: { origin: "*" },
//     });
//     socketIO(io);
//     global.io = io;
//   });

//   const exitHandler = () => {
//     if (server) {
//       server.close(() => {
//         logger.info("Server closed");
//         process.exit(1);
//       });
//     } else {
//       process.exit(1);
//     }
//   };

//   const unexpectedErrorHandler = (error) => {
//     logger.error(error);
//     exitHandler();
//   };

//   process.on("uncaughtException", unexpectedErrorHandler);
//   process.on("unhandledRejection", unexpectedErrorHandler);

//   process.on("SIGTERM", () => {
//     logger.info("SIGTERM received");
//     if (server) {
//       server.close();
//     }
//   });
// }




const mongoose = require("mongoose");
const config = require("./config/config");
const logger = require("./config/logger");
const app = require("./app");

let server; 

if (process.env.VERCEL) {
  // === Vercel serverless mode ===
  const serverless = require("serverless-http");
  let cachedDb = null;

  async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
      console.log("Using cached database connection");
      return cachedDb;
    }

    try {
      console.log("Creating new database connection...");
      
      const opts = {
        bufferCommands: false,
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 1,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        maxIdleTimeMS: 30000,
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

  module.exports = async (req, res) => {
    try {
      console.log(`${req.method} ${req.url} - Starting request`);
      
      // Connect to database first
      await connectToDatabase();
      
      // Create and execute serverless handler
      const handler = serverless(app);
      return await handler(req, res);
      
    } catch (error) {
      console.error("Serverless error:", error);
      
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Internal Server Error",
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  };

} else {
  // === Local development mode ===
  const myIp = process.env.BACKEND_IP || '0.0.0.0';

  mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info("Connected to MongoDB Atlas");

    server = app.listen(config.port, myIp, () => {
      logger.info(`Listening on http://${myIp}:${config.port}`);
    });

    // Socket.IO for local dev
    try {
      const socketIo = require("socket.io");
      const socketIO = require("./utils/socketIO");
      const io = socketIo(server, {
        cors: { origin: "*" },
      });
      socketIO(io);
      global.io = io;
    } catch (error) {
      logger.warn("Socket.IO setup failed:", error.message);
    }
  }).catch((error) => {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  });

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        logger.info("Server closed");
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);

  process.on("SIGTERM", () => {
    logger.info("SIGTERM received");
    if (server) {
      server.close();
    }
  });
}