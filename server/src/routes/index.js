const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const employeeRoutes = require("./employee.routes");
const auditRoutes = require("./audit.routes");
const attendanceRoutes = require("./attendance.routes");

// Mount auth routes
router.use("/auth", authRoutes);

// Mount audit routes
router.use("/audit-logs", auditRoutes);

// Mount attendance routes
router.use("/attendance", attendanceRoutes);

// Mount employee routes
router.use("/", employeeRoutes);

module.exports = router;
