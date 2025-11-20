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

// Basic Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .send({ message: "Something went wrong!", error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
