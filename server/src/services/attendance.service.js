const attendanceRepository = require("../repositories/attendance.repository");
const dateUtil = require("../utils/date.util");

/**
 * Helper to get internal User ID from string employeeId
 * @param {string} employeeIdStr 
 * @returns {Promise<string>}
 */
const getUserId = async (employeeIdStr) => {
  // First try to find by employeeId (string)
  let user = await attendanceRepository.findUserByEmployeeId(employeeIdStr);

  // If not found, try finding by internal id (UUID string)
  if (!user) {
    user = await attendanceRepository.findUserById(employeeIdStr);
  }

  if (!user) {
    throw new Error(`User with employeeId ${employeeIdStr} not found`);
  }
  return user.id;
};

/**
 * Get all attendance records
 * @returns {Promise<Array>}
 */
const getAllAttendance = async () => {
  return await attendanceRepository.findAllAttendance();
};

/**
 * Get attendance records for a specific employee
 * @param {string} employeeId
 * @returns {Promise<Array>}
 */
const getAttendanceForEmployee = async (employeeId) => {
  const userId = await getUserId(employeeId);
  return await attendanceRepository.findAttendanceByUserId(userId);
};

/**
 * Clock In
 * @param {string} employeeId
 * @param {string} location
 * @param {string} customTime - Optional ISO string for custom check-in time
 * @returns {Promise<Object>}
 */
const clockIn = async (employeeId, location = "Office", customTime = null, recordDateStr = null) => {
  const userId = await getUserId(employeeId);
  
  // Use custom time if provided, otherwise use current server time
  const checkInTime = customTime ? new Date(customTime) : dateUtil.getNow();
  
  // Normalize date for the record (midnight in target timezone)
  let recordDate;
  if (recordDateStr) {
    recordDate = new Date(recordDateStr);
  } else {
    recordDate = dateUtil.getStartOfDay(checkInTime);
  }

  // Find or create attendance record for the day of check-in
  let record = await attendanceRepository.findAttendanceRecord(userId, recordDate);

  if (!record) {
    record = await attendanceRepository.createAttendanceRecord({
      employeeId: userId,
      date: recordDate,
      status: "Present",
    });
  }

  // Create a new session
  const session = await attendanceRepository.createSession({
    attendanceRecordId: record.id,
    checkIn: checkInTime,
    location,
    type: "WORK",
  });

  return { record, session };
};

/**
 * Clock Out
 * @param {string} employeeId
 * @param {string} customTime - Optional custom clock out time
 * @param {string} breakStart - Optional break start time (HH:MM format)
 * @param {string} breakEnd - Optional break end time (HH:MM format)
 * @returns {Promise<Object>}
 */
const clockOut = async (employeeId, customTime = null, breakStart = null, breakEnd = null, recordDateStr = null) => {
  const userId = await getUserId(employeeId);

  // Find the most recent open WORK session for this employee
  // We ignore recordDateStr for finding the session to handle overnight shifts 
  // or date mismatches robustly.
  const openSession = await attendanceRepository.findOpenSession(userId, "WORK");

  if (!openSession) {
    throw new Error("No open session found to clock out from.");
  }

  const record = openSession.attendanceRecord;

  // Update session with checkOut time
  const checkOutTime = customTime ? new Date(customTime) : dateUtil.getNow();
  await attendanceRepository.updateSession(openSession.id, { checkOut: checkOutTime });

  // If break times provided, create a BREAK session
  let breakHours = 0;

  if (breakStart && breakEnd) {
    // Parse break times (format: "HH:MM")
    const [startHour, startMin] = breakStart.split(':').map(Number);
    const [endHour, endMin] = breakEnd.split(':').map(Number);
    
    // Create DateTime objects for break times on the RECORD's date
    // We need to be careful with timezone here. record.date is the "Day".
    // We should construct the break times relative to that day in the target timezone.
    // For now, assuming record.date is correct "Day" object.
    const breakStartDateTime = new Date(record.date);
    breakStartDateTime.setHours(startHour, startMin, 0, 0);
    
    const breakEndDateTime = new Date(record.date);
    breakEndDateTime.setHours(endHour, endMin, 0, 0);
    
    // Create the BREAK session
    await attendanceRepository.createSession({
      attendanceRecordId: record.id,
      checkIn: breakStartDateTime,
      checkOut: breakEndDateTime,
      type: "BREAK",
      location: "Manual Break",
    });
    
    const breakMilliseconds = breakEndDateTime - breakStartDateTime;
    breakHours = breakMilliseconds / (1000 * 60 * 60);
  }

  // Recalculate total hours from ALL sessions
  const updatedRecord = await attendanceRepository.findAttendanceRecordById(record.id);

  let totalMilliseconds = 0;
  let totalBreakMilliseconds = 0;

  updatedRecord.sessions.forEach((session) => {
    if (session.checkIn && session.checkOut) {
      const diff = session.checkOut - session.checkIn;
      if (diff > 0) {
        if (session.type === "WORK") {
          totalMilliseconds += diff;
        } else if (session.type === "BREAK") {
          totalBreakMilliseconds += diff;
        }
      }
    }
  });

  const totalHours = totalMilliseconds / (1000 * 60 * 60);
  const totalBreakHours = totalBreakMilliseconds / (1000 * 60 * 60);

  // Update record with total hours
  return await attendanceRepository.updateAttendanceRecord(record.id, {
    totalHours,
    breakHours: totalBreakHours > 0 ? totalBreakHours : null,
    breakStart: null,
    breakEnd: null,
  });
};

/**
 * Get Attendance Stats (Today, Week, Month)
 * @param {string} employeeId
 * @returns {Promise<Object>}
 */
const getAttendanceStats = async (employeeId) => {
  const userId = await getUserId(employeeId);
  const now = dateUtil.getNow();
  
  // Today
  const today = dateUtil.getStartOfDay(now);
  
  const todayRecord = await attendanceRepository.findAttendanceRecord(userId, today);

  // Week (Start from Monday)
  const startOfWeek = dateUtil.getStartOfDay(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  startOfWeek.setDate(diff);
  // Note: getStartOfDay already set hours to 0, but setDate might preserve time if we didn't use it.
  // Actually startOfWeek was created via getStartOfDay so it's 00:00.

  const weekRecords = await attendanceRepository.findAttendanceRecordsByDateRange(userId, startOfWeek);

  // Month
  const startOfMonth = dateUtil.getStartOfDay(now);
  startOfMonth.setDate(1);
  const monthRecords = await attendanceRepository.findAttendanceRecordsByDateRange(userId, startOfMonth);

  const sumHours = (records) => records.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);

  return {
    hoursToday: todayRecord ? (todayRecord.totalHours || 0) : 0,
    hoursThisWeek: sumHours(weekRecords),
    hoursThisMonth: sumHours(monthRecords),
  };
};

/**
 * Start Break
 * @param {string} employeeId
 * @param {string} breakType - "DEFAULT", "NO_BREAK", or "CUSTOM"
 * @param {string} customTime - Optional custom break start time
 * @returns {Promise<Object>}
 */
const startBreak = async (employeeId, breakType = "DEFAULT", customTime) => {
  const userId = await getUserId(employeeId);
  const today = dateUtil.getStartOfDay();

  const record = await attendanceRepository.findAttendanceRecord(userId, today);

  if (!record) {
    throw new Error("No attendance record found for today. Please clock in first.");
  }

  // Find open session (should be WORK)
  const openSession = record.sessions.find((s) => !s.checkOut);
  if (openSession) {
    // End current work session
    const endTime = customTime ? new Date(customTime) : dateUtil.getNow();
    await attendanceRepository.updateSession(openSession.id, { checkOut: endTime });
  }

  // Start BREAK session
  const breakStartTime = customTime ? new Date(customTime) : dateUtil.getNow();
  const session = await attendanceRepository.createSession({
    attendanceRecordId: record.id,
    checkIn: breakStartTime,
    type: "BREAK",
    location: "Break", // Placeholder
  });

  return { record, session };
};

/**
 * End Break
 * @param {string} employeeId
 * @returns {Promise<Object>}
 */
const endBreak = async (employeeId) => {
  const userId = await getUserId(employeeId);
  const today = dateUtil.getStartOfDay();

  const record = await attendanceRepository.findAttendanceRecord(userId, today);

  if (!record) {
    throw new Error("No attendance record found for today.");
  }

  // Find open session (should be BREAK)
  const openSession = record.sessions.find((s) => !s.checkOut && s.type === "BREAK");
  if (!openSession) {
    throw new Error("No open break session found.");
  }

  // End BREAK session
  await attendanceRepository.updateSession(openSession.id, { checkOut: dateUtil.getNow() });

  // Start WORK session (Resume work)
  const session = await attendanceRepository.createSession({
    attendanceRecordId: record.id,
    checkIn: dateUtil.getNow(),
    type: "WORK",
    location: "Office", // Default back to Office, or could store previous location
  });

  return { record, session };
};

/**
 * Fix Missing Clock Out
 * @param {string} recordId
 * @param {string} clockOutTime - ISO string
 * @param {string} breakStart - HH:MM
 * @param {string} breakEnd - HH:MM
 * @returns {Promise<Object>}
 */
const fixMissingClockOut = async (recordId, clockOutTime, breakStart, breakEnd) => {
  const record = await attendanceRepository.findAttendanceRecordById(recordId);

  if (!record) {
    throw new Error("Attendance record not found");
  }

  const openSessions = record.sessions.filter((s) => !s.checkOut);
  if (openSessions.length === 0) {
    throw new Error("No open session found for this record");
  }

  // Update all open sessions with checkOut time
  const checkOutDate = new Date(clockOutTime);
  
  await attendanceRepository.updateManySessions(
    { 
      attendanceRecordId: record.id,
      checkOut: null 
    },
    { checkOut: checkOutDate }
  );

  // Calculate break hours
  let breakHours = 0;

  if (breakStart && breakEnd) {
    const [startHour, startMin] = breakStart.split(':').map(Number);
    const [endHour, endMin] = breakEnd.split(':').map(Number);
    
    // Use RECORD DATE for break times
    const breakStartDateTime = new Date(record.date);
    breakStartDateTime.setHours(startHour, startMin, 0, 0);
    
    const breakEndDateTime = new Date(record.date);
    breakEndDateTime.setHours(endHour, endMin, 0, 0);
    
    // Create the BREAK session
    await attendanceRepository.createSession({
      attendanceRecordId: record.id,
      checkIn: breakStartDateTime,
      checkOut: breakEndDateTime,
      type: "BREAK",
      location: "Manual Break (Fix)",
    });

    const breakMilliseconds = breakEndDateTime - breakStartDateTime;
    breakHours = breakMilliseconds / (1000 * 60 * 60);
  }

  // Recalculate total hours
  const updatedRecord = await attendanceRepository.findAttendanceRecordById(record.id);

  let totalMilliseconds = 0;
  let totalBreakMilliseconds = 0;

  updatedRecord.sessions.forEach((session) => {
    if (session.checkIn && session.checkOut) {
      const diff = session.checkOut - session.checkIn;
      if (diff > 0) {
        if (session.type === "WORK") {
          totalMilliseconds += diff;
        } else if (session.type === "BREAK") {
          totalBreakMilliseconds += diff;
        }
      }
    }
  });

  const totalHours = totalMilliseconds / (1000 * 60 * 60);
  const totalBreakHours = totalBreakMilliseconds / (1000 * 60 * 60);

  return await attendanceRepository.updateAttendanceRecord(record.id, {
    totalHours,
    breakHours: totalBreakHours > 0 ? totalBreakHours : null,
    breakStart: null,
    breakEnd: null,
  });
};

/**
 * Get Today's Attendance Record
 * @param {string} employeeId
 * @returns {Promise<Object|null>}
 */
const getTodayAttendance = async (employeeId, date = null) => {
  const userId = await getUserId(employeeId);
  
  let queryDate;
  if (date) {
    queryDate = new Date(date);
  } else {
    queryDate = dateUtil.getStartOfDay();
  }

  return await attendanceRepository.findAttendanceRecord(userId, queryDate);
};

module.exports = {
  getAllAttendance,
  getAttendanceForEmployee,
  clockIn,
  clockOut,
  getAttendanceStats,
  getTodayAttendance,
  startBreak,
  endBreak,
  fixMissingClockOut,
};
