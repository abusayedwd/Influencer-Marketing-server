 

const mongoose = require("mongoose");
const config = require("./config/config");
const logger = require("./config/logger");
const app = require("./app");

let server;

if (process.env.VERCEL) {
  // === Vercel serverless mode ===
  const serverless = require("serverless-http");
  let isConnected = false;

  async function connectToDatabase() {
    if (isConnected) return;
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    isConnected = true;
    logger.info("Connected to MongoDB Atlas");
  }

module.exports = async (req, res) => {
  try {
    console.log('Serverless function called:', req.url);
    await connectToDatabase();
    const handler = serverless(app);
    return handler(req, res);
  } catch (error) {
    console.error('Serverless error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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

  

