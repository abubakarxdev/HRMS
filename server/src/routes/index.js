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

// Mount leaves routes
router.use("/leaves", require("./leaves.routes"));

// Mount organization/tenant routes
router.use("/organizations", require("./organization.routes"));

// Mount office routes
router.use("/offices", require("./office.routes"));

// Mount user routes (Platform Admin)
router.use("/users", require("./user.routes"));

// Mount employee routes
router.use("/", employeeRoutes);

module.exports = router;
