const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Helper to get internal User ID from string employeeId
 * @param {string} employeeIdStr 
 * @returns {Promise<number>}
 */
const getUserId = async (employeeIdStr) => {
  // First try to find by employeeId (string)
  let user = await prisma.user.findUnique({
    where: { employeeId: employeeIdStr },
    select: { id: true },
  });

  // If not found, and input looks like a number, try finding by internal id
  if (!user && !isNaN(parseInt(employeeIdStr))) {
    user = await prisma.user.findUnique({
      where: { id: parseInt(employeeIdStr) },
      select: { id: true },
    });
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
  return await prisma.attendanceRecord.findMany({
    orderBy: {
      date: "desc",
    },
    include: {
      sessions: true,
      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
        },
      },
    },
  });
};

/**
 * Get attendance records for a specific employee
 * @param {string} employeeId
 * @returns {Promise<Array>}
 */
const getAttendanceForEmployee = async (employeeId) => {
  const userId = await getUserId(employeeId);
  return await prisma.attendanceRecord.findMany({
    where: {
      employeeId: userId,
    },
    orderBy: {
      date: "desc",
    },
    include: {
      sessions: true,
    },
  });
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
  const checkInTime = customTime ? new Date(customTime) : new Date();
  
  // Normalize date for the record (midnight)
  // If recordDateStr is provided (from client), use it as UTC midnight.
  // Otherwise derive from checkInTime and normalize to local midnight.
  let recordDate;
  if (recordDateStr) {
    recordDate = new Date(recordDateStr);
    // Do NOT call setHours here, as new Date("YYYY-MM-DD") is already UTC midnight
    // and setHours would shift it to local midnight (potentially previous day).
  } else {
    recordDate = new Date(checkInTime);
    recordDate.setHours(0, 0, 0, 0);
  }

  // Find or create attendance record for the day of check-in
  let record = await prisma.attendanceRecord.findUnique({
    where: {
      unique_attendance_per_day: {
        employeeId: userId,
        date: recordDate,
      },
    },
  });

  if (!record) {
    record = await prisma.attendanceRecord.create({
      data: {
        employeeId: userId,
        date: recordDate,
        status: "Present",
      },
    });
  }

  // Create a new session
  const session = await prisma.attendanceSession.create({
    data: {
      attendanceRecordId: record.id,
      checkIn: checkInTime,
      location,
      type: "WORK",
    },
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
  const openSession = await prisma.attendanceSession.findFirst({
    where: {
      attendanceRecord: {
        employeeId: userId,
      },
      checkOut: null,
      type: "WORK",
    },
    include: {
      attendanceRecord: {
        include: { sessions: true }
      }
    },
    orderBy: {
      checkIn: 'desc'
    }
  });

  if (!openSession) {
    throw new Error("No open session found to clock out from.");
  }

  const record = openSession.attendanceRecord;

  // Update session with checkOut time
  const checkOutTime = customTime ? new Date(customTime) : new Date();
  await prisma.attendanceSession.update({
    where: { id: openSession.id },
    data: { checkOut: checkOutTime },
  });

  // Calculate break hours if break times provided
  let breakHours = 0;
  let breakStartDateTime = null;
  let breakEndDateTime = null;

  if (breakStart && breakEnd) {
    // Parse break times (format: "HH:MM")
    const [startHour, startMin] = breakStart.split(':').map(Number);
    const [endHour, endMin] = breakEnd.split(':').map(Number);
    
    // Create DateTime objects for break times on the RECORD's date
    breakStartDateTime = new Date(record.date);
    breakStartDateTime.setHours(startHour, startMin, 0, 0);
    
    breakEndDateTime = new Date(record.date);
    breakEndDateTime.setHours(endHour, endMin, 0, 0);
    
    // Calculate break duration in hours
    const breakMilliseconds = breakEndDateTime - breakStartDateTime;
    breakHours = breakMilliseconds / (1000 * 60 * 60);
  }

  // Recalculate total hours
  const updatedRecord = await prisma.attendanceRecord.findUnique({
    where: { id: record.id },
    include: { sessions: true },
  });

  let totalMilliseconds = 0;
  updatedRecord.sessions.forEach((session) => {
    if (session.checkIn && session.checkOut && session.type === "WORK") {
      const diff = session.checkOut - session.checkIn;
      if (diff > 0) {
        totalMilliseconds += diff;
      }
    }
  });

  const totalHours = totalMilliseconds / (1000 * 60 * 60);

  // Update record with total hours and break information
  return await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { 
      totalHours,
      breakStart: breakStartDateTime,
      breakEnd: breakEndDateTime,
      breakHours: breakHours > 0 ? breakHours : null,
    },
    include: { sessions: true },
  });
};

/**
 * Get Attendance Stats (Today, Week, Month)
 * @param {string} employeeId
 * @returns {Promise<Object>}
 */
const getAttendanceStats = async (employeeId) => {
  const userId = await getUserId(employeeId);
  const now = new Date();
  
  // Today
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const todayRecord = await prisma.attendanceRecord.findUnique({
    where: {
      unique_attendance_per_day: {
        employeeId: userId,
        date: today,
      },
    },
  });

  // Week (Start from Monday)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekRecords = await prisma.attendanceRecord.findMany({
    where: {
      employeeId: userId,
      date: {
        gte: startOfWeek,
      },
    },
  });

  // Month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRecords = await prisma.attendanceRecord.findMany({
    where: {
      employeeId: userId,
      date: {
        gte: startOfMonth,
      },
    },
  });

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      unique_attendance_per_day: {
        employeeId: userId,
        date: today,
      },
    },
    include: {
      sessions: true,
    },
  });

  if (!record) {
    throw new Error("No attendance record found for today. Please clock in first.");
  }

  // Find open session (should be WORK)
  const openSession = record.sessions.find((s) => !s.checkOut);
  if (openSession) {
    // End current work session
    const endTime = customTime ? new Date(customTime) : new Date();
    await prisma.attendanceSession.update({
      where: { id: openSession.id },
      data: { checkOut: endTime },
    });
  }

  // Start BREAK session
  const breakStartTime = customTime ? new Date(customTime) : new Date();
  const session = await prisma.attendanceSession.create({
    data: {
      attendanceRecordId: record.id,
      checkIn: breakStartTime,
      type: "BREAK",
      location: "Break", // Placeholder
    },
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      unique_attendance_per_day: {
        employeeId: userId,
        date: today,
      },
    },
    include: {
      sessions: true,
    },
  });

  if (!record) {
    throw new Error("No attendance record found for today.");
  }

  // Find open session (should be BREAK)
  const openSession = record.sessions.find((s) => !s.checkOut && s.type === "BREAK");
  if (!openSession) {
    throw new Error("No open break session found.");
  }

  // End BREAK session
  await prisma.attendanceSession.update({
    where: { id: openSession.id },
    data: { checkOut: new Date() },
  });

  // Start WORK session (Resume work)
  const session = await prisma.attendanceSession.create({
    data: {
      attendanceRecordId: record.id,
      checkIn: new Date(),
      type: "WORK",
      location: "Office", // Default back to Office, or could store previous location
    },
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
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: parseInt(recordId) },
    include: { sessions: true },
  });

  if (!record) {
    throw new Error("Attendance record not found");
  }

  const openSessions = record.sessions.filter((s) => !s.checkOut);
  if (openSessions.length === 0) {
    throw new Error("No open session found for this record");
  }

  // Update all open sessions with checkOut time
  const checkOutDate = new Date(clockOutTime);
  
  await prisma.attendanceSession.updateMany({
    where: { 
      attendanceRecordId: record.id,
      checkOut: null 
    },
    data: { checkOut: checkOutDate },
  });

  // Calculate break hours
  let breakHours = 0;
  let breakStartDateTime = null;
  let breakEndDateTime = null;

  if (breakStart && breakEnd) {
    const [startHour, startMin] = breakStart.split(':').map(Number);
    const [endHour, endMin] = breakEnd.split(':').map(Number);
    
    // Use RECORD DATE for break times
    breakStartDateTime = new Date(record.date);
    breakStartDateTime.setHours(startHour, startMin, 0, 0);
    
    breakEndDateTime = new Date(record.date);
    breakEndDateTime.setHours(endHour, endMin, 0, 0);
    
    const breakMilliseconds = breakEndDateTime - breakStartDateTime;
    breakHours = breakMilliseconds / (1000 * 60 * 60);
  }

  // Recalculate total hours
  const updatedRecord = await prisma.attendanceRecord.findUnique({
    where: { id: record.id },
    include: { sessions: true },
  });

  let totalMilliseconds = 0;
  updatedRecord.sessions.forEach((session) => {
    if (session.checkIn && session.checkOut && session.type === "WORK") {
      const diff = session.checkOut - session.checkIn;
      if (diff > 0) {
        totalMilliseconds += diff;
      }
    }
  });

  const totalHours = totalMilliseconds / (1000 * 60 * 60);

  return await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { 
      totalHours,
      breakStart: breakStartDateTime,
      breakEnd: breakEndDateTime,
      breakHours: breakHours > 0 ? breakHours : null,
    },
    include: { sessions: true },
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
    // Do NOT call setHours here for the same reason as clockIn
  } else {
    queryDate = new Date();
    queryDate.setHours(0, 0, 0, 0);
  }

  return await prisma.attendanceRecord.findUnique({
    where: {
      unique_attendance_per_day: {
        employeeId: userId,
        date: queryDate,
      },
    },
    include: {
      sessions: true,
    },
  });
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
