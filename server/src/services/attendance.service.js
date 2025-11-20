const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Helper to get internal User ID from string employeeId
 * @param {string} employeeIdStr 
 * @returns {Promise<number>}
 */
const getUserId = async (employeeIdStr) => {
  const user = await prisma.user.findUnique({
    where: { employeeId: employeeIdStr },
    select: { id: true },
  });
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
const clockIn = async (employeeId, location = "Office", customTime = null) => {
  const userId = await getUserId(employeeId);
  
  // Use custom time if provided, otherwise use current server time
  const checkInTime = customTime ? new Date(customTime) : new Date();
  
  // Normalize date for the record (midnight)
  const recordDate = new Date(checkInTime);
  recordDate.setHours(0, 0, 0, 0);

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
 * @returns {Promise<Object>}
 */
const clockOut = async (employeeId, customTime) => {
  const userId = await getUserId(employeeId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find record for today (assuming clock out is for today's session)
  // TODO: Handle overnight shifts if needed
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

  // Find the last open session
  const openSession = record.sessions.find((s) => !s.checkOut);

  if (!openSession) {
    throw new Error("No open session found to clock out from.");
  }

  // Update session with checkOut time
  const checkOutTime = customTime ? new Date(customTime) : new Date();
  await prisma.attendanceSession.update({
    where: { id: openSession.id },
    data: { checkOut: checkOutTime },
  });

  // Recalculate total hours
  // Re-fetch sessions to include the one just updated
  const updatedRecord = await prisma.attendanceRecord.findUnique({
    where: { id: record.id },
    include: { sessions: true },
  });

  let totalMilliseconds = 0;
  updatedRecord.sessions.forEach((session) => {
    if (session.checkIn && session.checkOut && session.type === "WORK") {
      totalMilliseconds += session.checkOut - session.checkIn;
    }
  });

  const totalHours = totalMilliseconds / (1000 * 60 * 60);

  // Update record with total hours
  return await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { totalHours },
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
 * Get Today's Attendance Record
 * @param {string} employeeId
 * @returns {Promise<Object|null>}
 */
const getTodayAttendance = async (employeeId) => {
  const userId = await getUserId(employeeId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.attendanceRecord.findUnique({
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
};
