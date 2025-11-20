const express = require("express");
const router = express.Router();
const auditController = require("../controllers/audit.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// GET AUDIT LOGS FOR EMPLOYEE
router.get(
  "/:employeeId",
  authMiddleware.protect,
  // Add specific permission check if needed, for now assuming protected is enough or check if user can view this profile
  auditController.getAuditLogsForEmployee
);

module.exports = router;
