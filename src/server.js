const { app, connectToDatabase } = require("./src/index");
const config = require("./src/config/config");
const logger = require("./src/config/logger");

async function start() {
  await connectToDatabase();

  const server = app.listen(config.port, () => {
    logger.info(`Listening on http://localhost:${config.port}`);
  });

  // Only local Socket.IO
  const socketIo = require("socket.io");
  const socketIO = require("./src/utils/socketIO");
  const io = socketIo(server, { cors: { origin: "*" } });
  socketIO(io);
  global.io = io;
}

start();

