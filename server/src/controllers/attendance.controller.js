const attendanceService = require("../services/attendance.service");

// Helper function for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Get all attendance records.
 * Route: GET /api/attendance
 */
const getAllAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.getAllAttendance();
  res.status(200).json(attendance);
});

/**
 * Get attendance for an employee.
 * Route: GET /api/attendance/employee/:employeeId
 */
const getAttendanceForEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const attendance = await attendanceService.getAttendanceForEmployee(employeeId);
  res.status(200).json(attendance);
});

/**
 * Clock In
 * Route: POST /api/attendance/clock-in
 */
const clockIn = asyncHandler(async (req, res) => {
  const { employeeId, location, customTime } = req.body;
  const result = await attendanceService.clockIn(employeeId, location, customTime);
  res.status(200).json(result);
});

/**
 * Clock Out
 * Route: POST /api/attendance/clock-out
 */
const clockOut = asyncHandler(async (req, res) => {
  const { employeeId, customTime } = req.body;
  const result = await attendanceService.clockOut(employeeId, customTime);
  res.status(200).json(result);
});

/**
 * Get Attendance Stats
 * Route: GET /api/attendance/stats/:employeeId
 */
const getStats = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const stats = await attendanceService.getAttendanceStats(employeeId);
  res.status(200).json(stats);
});

/**
 * Route: GET /api/attendance/today/:employeeId
 */
const getTodayAttendance = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const result = await attendanceService.getTodayAttendance(employeeId);
  res.status(200).json(result);
});

/**
 * Route: POST /api/attendance/break/start
 */
const startBreak = asyncHandler(async (req, res) => {
  const { employeeId, breakType, customTime } = req.body;
  const result = await attendanceService.startBreak(employeeId, breakType, customTime);
  res.status(200).json(result);
});

/**
 * Route: POST /api/attendance/break/end
 */
const endBreak = asyncHandler(async (req, res) => {
  const { employeeId } = req.body;
  const result = await attendanceService.endBreak(employeeId);
  res.status(200).json(result);
});

module.exports = {
  getAllAttendance,
  getAttendanceForEmployee,
  clockIn,
  clockOut,
  getStats,
  getTodayAttendance,
  startBreak,
  endBreak,
};
