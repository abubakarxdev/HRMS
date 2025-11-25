require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./src/routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("HRIS Pro Backend is running.");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  // Only log stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  } else {
    // In production, just log the error message
    console.error(`Error: ${err.message}`);
  }
  
  // Determine status code based on error type
  // Validation errors should return 400, not 500
  const statusCode = err.statusCode || (err.message.includes('Invalid') || err.message.includes('must be') ? 400 : 500);
  
  res.status(statusCode).json({ 
    message: statusCode === 500 ? "Something went wrong!" : err.message,
    error: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
