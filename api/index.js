// const serverless = require("serverless-http");
// const { app, connectToDatabase } = require("../src/index");

// module.exports = async (req, res) => {
//   try {
//     await connectToDatabase();
//     const handler = serverless(app);
//     return handler(req, res);
//   } catch (err) {
//     console.error("Serverless error:", err);
//     res.status(500).json({ error: "Internal Server Errorree" });
//   }
// }; 
