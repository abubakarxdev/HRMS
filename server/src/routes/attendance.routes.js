const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// GET ALL ATTENDANCE
router.get(
  "/",
  authMiddleware.protect,
  attendanceController.getAllAttendance
);

// GET ATTENDANCE FOR EMPLOYEE
router.get(
  "/employee/:employeeId",
  authMiddleware.protect,
  attendanceController.getAttendanceForEmployee
);

// CLOCK IN
router.post(
  "/clock-in",
  authMiddleware.protect,
  attendanceController.clockIn
);

// CLOCK OUT
router.post(
  "/clock-out",
  authMiddleware.protect,
  attendanceController.clockOut
);

// GET STATS
router.get(
  "/stats/:employeeId",
  authMiddleware.protect,
  attendanceController.getStats
);

// GET TODAY'S ATTENDANCE
router.get(
  "/today/:employeeId",
  authMiddleware.protect,
  attendanceController.getTodayAttendance
);

// START BREAK
router.post(
  "/break/start",
  authMiddleware.protect,
  attendanceController.startBreak
);

// END BREAK
router.post(
  "/break/end",
  authMiddleware.protect,
  attendanceController.endBreak
);

module.exports = router;
