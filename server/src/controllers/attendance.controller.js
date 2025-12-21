const attendanceService = require("../services/attendance.service");
const prisma = require("../config/prisma");

// Helper function for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Get all attendance records.
 * Route: GET /api/attendance
 */
const getAllAttendance = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, startDate, endDate, status, officeId } = req.query;

  const { role } = req.user;

  // Tenant Isolation
  // Tenant Isolation
  let legalEntityId = undefined;
  if (role !== 'SUPER_ADMIN') {
      legalEntityId = req.user.employee?.legalEntityId || req.user.legalEntityId;

      if (!legalEntityId) {
           const userOfficeId = req.user.employee?.officeId || req.user.officeId;
           if (userOfficeId) {
               const office = await prisma.office.findUnique({
                    where: { id: userOfficeId },
                    select: { legalEntityId: true }
               });
               if (office) legalEntityId = office.legalEntityId;
           }
      }

      if (!legalEntityId) {
          return res.status(200).json({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 }, aggregates: {} });
      }
  }

  // Strict Data Isolation: Employees and HR are bound to their assigned office
  if (role === 'EMPLOYEE' || role === 'HR') {
      const userOfficeId = req.user.employee?.officeId;
      if (userOfficeId) {
          officeId = userOfficeId;
      } else {
          // Return empty paginated structure if no office assigned
          return res.status(200).json({ 
              data: [], 
              meta: { total: 0, page: 1, limit: 10, totalPages: 0 } 
          });
      }
  }

  const attendance = await attendanceService.getAllAttendance(page, limit, startDate, endDate, status, officeId, legalEntityId);
  res.status(200).json(attendance);
});

/**
 * Get attendance for an employee.
 * Route: GET /api/attendance/employee/:employeeId
 */
const getAttendanceForEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { startDate, endDate, status, page = 1, limit = 10 } = req.query;
  const attendance = await attendanceService.getAttendanceForEmployee(employeeId, startDate, endDate, status, page, limit);
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
  const { employeeId, customTime, breakStart, breakEnd } = req.body;
  const result = await attendanceService.clockOut(employeeId, customTime, breakStart, breakEnd);
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
  const { date } = req.query;
  const result = await attendanceService.getTodayAttendance(employeeId, date);
  res.status(200).json(result);
});

/**
 * Route: POST /api/attendance/break/start
 */
const startBreak = asyncHandler(async (req, res) => {
  const { employeeId, customTime } = req.body;
  const result = await attendanceService.startBreak(employeeId, customTime);
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

/**
 * Route: POST /api/attendance/fix-missing-clock-out
 */
const fixMissingClockOut = asyncHandler(async (req, res) => {
  const { recordId, clockOutTime, breakStartTime, breakEndTime } = req.body;
  const result = await attendanceService.fixMissingClockOut(recordId, clockOutTime, breakStartTime, breakEndTime);
  res.status(200).json(result);
});

/**
 * Get Attendance By ID
 * Route: GET /api/attendance/:id
 */
const getAttendanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const record = await attendanceService.getAttendanceById(id);
  res.status(200).json(record);
});

/**
 * Get Team Stats
 * Route: GET /api/attendance/team-stats
 */
const getTeamStats = asyncHandler(async (req, res) => {
  const { officeId } = req.query;
  const { role } = req.user;
  
  let legalEntityId = undefined;
  if (role !== 'SUPER_ADMIN') {
      legalEntityId = req.user.employee?.legalEntityId || req.user.legalEntityId;
      if (!legalEntityId) {
           // Return empty stats if no legal entity
           return res.status(200).json({ hoursToday: "0h 0m", hoursThisWeek: "0h 0m", hoursThisMonth: "0h 0m" });
      }
  }

  const result = await attendanceService.getTeamStats(officeId, legalEntityId);
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
  fixMissingClockOut,
  getAttendanceById,
  getTeamStats,
};
