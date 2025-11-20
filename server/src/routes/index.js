const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const employeeRoutes = require("./employee.routes");

// Mount auth routes
router.use("/auth", authRoutes);

// Mount employee routes
router.use("/", employeeRoutes);

module.exports = router;
