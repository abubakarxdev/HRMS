const express = require("express");
const router = express.Router();
const leavesController = require("../controllers/leaves.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

// Employee Routes
router.get("/my-balances", protect, leavesController.getMyBalances);
router.get("/my-requests", protect, leavesController.getMyRequests);
router.post("/request", protect, leavesController.createRequest);

// Admin/HR Routes
router.get("/requests", protect, authorize("ADMIN", "HR"), leavesController.getAllRequests);
router.get("/balances/:employeeId", protect, authorize("ADMIN", "HR"), leavesController.getEmployeeBalances);
router.patch("/request/:id/status", protect, authorize("ADMIN", "HR"), leavesController.updateRequestStatus);
router.get("/request/:id", protect, authorize("ADMIN", "HR"), leavesController.getRequestById);

module.exports = router;
