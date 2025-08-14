 

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
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// } else {
//   // === Local development mode ===
//   const myIp = process.env.BACKEND_IP;

//   mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
//     logger.info("Connected to MongoDB Atlas");

//     server = app.listen(config.port, myIp, () => {
//       logger.info(`Listening on https://${myIp}:${config.port}`);
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

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // === Vercel serverless mode ===
  const serverless = require("serverless-http");
  
  // Use cached connection to avoid timeout
  let cachedDb = null;

  async function connectToDatabase() {
    if (cachedDb) {
      return cachedDb;
    }

    try {
      // Set shorter timeout for serverless
      const connection = await mongoose.connect(config.mongoose.url, {
        ...config.mongoose.options,
        maxPoolSize: 1, // Limit connection pool for serverless
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        socketTimeoutMS: 5000,
        bufferMaxEntries: 0 // Disable mongoose buffering
      });
      
      cachedDb = connection;
      logger.info("Connected to MongoDB Atlas (Serverless)");
      return cachedDb;
    } catch (error) {
      logger.error("Database connection failed:", error);
      throw error;
    }
  }

  // Export the serverless handler
  module.exports = async (req, res) => {
    try {
      // Add timeout handling
      const timeoutId = setTimeout(() => {
        if (!res.headersSent) {
          res.status(504).json({ error: 'Function timeout' });
        }
      }, 25000); // 25 second timeout (Vercel limit is 30s)

      await connectToDatabase();
      const handler = serverless(app);
      const result = await handler(req, res);
      
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      logger.error('Serverless handler error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: error.message 
        });
      }
    }
  };

} else {
  // === Local development mode ===
  const myIp = process.env.BACKEND_IP;

  mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info("Connected to MongoDB Atlas");

    server = app.listen(config.port, myIp, () => {
      logger.info(`Listening on https://${myIp}:${config.port}`);
    });

    // Socket.IO for local dev
    const socketIo = require("socket.io");
    const socketIO = require("./utils/socketIO");
    const io = socketIo(server, {
      cors: { origin: "*" },
    });
    socketIO(io);
    global.io = io;
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