 

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
const config = require("./../src/config/config");
const logger = require("./../src/config/logger");
const app = require("./../src/app");
const socketIo = require("socket.io");
const socketIO = require("./../src/utils/socketIO");


let server;
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
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

if (process.env.VERCEL) {
  // === Vercel serverless mode ===
  const serverless = require("serverless-http");
  
  // Export for Vercel (this should be in api/index.js instead)
  const handler = async (req, res) => {
    try {
      console.log('Serverless function called:', req.url);
      await connectToDatabase();
      const serverlessHandler = serverless(app);
      return await serverlessHandler(req, res);
    } catch (error) {
      console.error('Serverless error:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: error.message 
      });
    }
  };
  
  // Export for both CommonJS and ES modules
  module.exports = handler;
  module.exports.default = handler;
  
} else {
  // === Local development mode ===
  const myIp = process.env.BACKEND_IP;
  mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info("Connected to MongoDB Atlas");
    server = app.listen(config.port, myIp, () => {
      logger.info(`Listening on https://${myIp}:${config.port}`);
    });
    // Socket.IO for local dev

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