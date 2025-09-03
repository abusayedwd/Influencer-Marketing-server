const { connectToDatabase } = require("../src/index");
const { app } = require("../src/app");

// Ensure this is the default export for Vercel
export default async function handler(req, res) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // If your app is an Express app, you can use it directly
    return app(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ 
      error: "Internal Server Error" 
    });
  }
}