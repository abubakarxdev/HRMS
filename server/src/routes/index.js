const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const employeeRoutes = require("./employee.routes");
const auditRoutes = require("./audit.routes");
const attendanceRoutes = require("./attendance.routes");
const leaveRoutes = require("./leaves.routes");
const organizationRoutes = require("./organization.routes");
const officeRoutes = require("./office.routes");
const superAdminRoutes = require("./super_admin.routes");
const contractRoutes = require("./contract.routes");
const notificationRoutes = require("./notification.routes");
const uploadRoutes = require("./upload.routes");


// Mount auth routes
router.use("/auth", authRoutes);

// Mount audit routes
router.use("/audit-logs", auditRoutes);

// Mount attendance routes
router.use("/attendance", attendanceRoutes);

// Mount leaves routes
router.use("/leaves",leaveRoutes);

// Mount organization/tenant routes
router.use("/organizations", organizationRoutes);

// Mount office routes
router.use("/offices", officeRoutes);

// Mount user routes (Platform Admin)
router.use("/users" , superAdminRoutes);

// Mount contract routes
router.use("/contracts", contractRoutes);

// Mount notification routes
router.use("/notifications", notificationRoutes);

// Mount upload routes
router.use("/upload", uploadRoutes);

// Mount holiday routes
const holidayRoutes = require("./holiday.routes");
router.use("/holidays", holidayRoutes);

// Mount leave policy routes
const leavePolicyRoutes = require("./leavePolicy.routes");
router.use("/leave-policies", leavePolicyRoutes);

// Mount employee routes
router.use("/", employeeRoutes);

module.exports = router;
