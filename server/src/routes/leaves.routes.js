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
router.patch("/request/:id/status", protect, authorize("ADMIN", "HR"), leavesController.updateRequestStatus);

module.exports = router;
