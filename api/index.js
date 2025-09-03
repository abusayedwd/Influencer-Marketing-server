const { connectToDatabase } = require("../src/index");
const { app } = require("../src/app");

// Create the handler
const handler = async (req, res) => {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    // Handle the request with your app
    return app(req, res);
  } catch (error) {
    console.error("Serverless error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: error.message 
    });
  }
};

// Export for Vercel
module.exports = handler;