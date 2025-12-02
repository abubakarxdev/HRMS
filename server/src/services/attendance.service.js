const attendanceRepository = require("../repositories/attendance.repository");
const dateUtil = require("../utils/date.util");

/**
 * Helper to get employee and timezone from employeeId
 * @param {string} employeeId 
 * @returns {Promise<{employeeId: string, timezone: string}>}
 */
const getEmployeeInfo = async (employeeId) => {
  try {
    const employee = await attendanceRepository.findUserByEmployeeId(employeeId);
    
    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }

    const timezone = employee.user?.timezone || dateUtil.DEFAULT_TIMEZONE;
    
    return {
      employeeId: employee.id,
      timezone
    };
  } catch (error) {
    throw new Error(`Error fetching employee info: ${error.message}`);
  }
};

/**
 * Calculate session duration excluding breaks
 * @param {Date} checkInTime 
 * @param {Date} checkOutTime 
 * @param {Array} breaks 
 * @returns {number} Duration in minutes
 */
const calculateSessionDuration = (checkInTime, checkOutTime, breaks = []) => {
  if (!checkInTime || !checkOutTime) return 0;
  
  const totalMinutes = dateUtil.calculateDurationMinutes(checkInTime, checkOutTime);
  
  // Subtract break durations
  const breakMinutes = breaks.reduce((sum, breakItem) => {
    return sum + (breakItem.durationMinutes || 0);
  }, 0);
  
  return Math.max(0, totalMinutes - breakMinutes);
};

/**
 * Update attendance record totals
 * @param {string} recordId 
 * @returns {Promise<Object>}
 */
const updateRecordTotals = async (recordId) => {
  try {
    const record = await attendanceRepository.findAttendanceRecordById(recordId);
    
    if (!record) {
      throw new Error("Attendance record not found");
    }

    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;

    // Calculate totals from all sessions
    record.sessions.forEach(session => {
      if (session.checkInTime && session.checkOutTime) {
        // Add session duration (already excludes breaks)
        totalWorkMinutes += session.durationMinutes || 0;
        
        // Add break durations
        session.breaks.forEach(breakItem => {
          totalBreakMinutes += breakItem.durationMinutes || 0;
        });
      }
    });

    // Update record
    return await attendanceRepository.updateAttendanceRecord(recordId, {
      totalWorkMinutes,
      totalBreakMinutes,
      status: totalWorkMinutes > 0 ? 'PRESENT' : 'ABSENT'
    });
  } catch (error) {
    throw new Error(`Error updating record totals: ${error.message}`);
  }
};

/**
 * Get all attendance records
 * @returns {Promise<Array>}
 */
const getAllAttendance = async () => {
  try {
    return await attendanceRepository.findAllAttendance();
  } catch (error) {
    throw new Error(`Error fetching all attendance: ${error.message}`);
  }
};

/**
 * Get attendance records for a specific employee
 * @param {string} employeeId
 * @returns {Promise<Array>}
 */
const getAttendanceForEmployee = async (employeeId) => {
  try {
    const { employeeId: empId } = await getEmployeeInfo(employeeId);
    return await attendanceRepository.findAttendanceByEmployeeId(empId);
  } catch (error) {
    throw new Error(`Error fetching employee attendance: ${error.message}`);
  }
};

/**
 * Clock In
 * @param {string} employeeId
 * @param {string} location
 * @param {string} customTime - Optional ISO string for custom check-in time
 * @returns {Promise<Object>}
 */
const clockIn = async (employeeId, location = "Office", customTime = null) => {
  try {
    const { employeeId: empId, timezone } = await getEmployeeInfo(employeeId);
    
    // Use custom time if provided, otherwise use current server time
    const checkInTime = customTime ? new Date(customTime) : dateUtil.getNow();
    
    // Get the "Day" in the employee's timezone
    const recordDate = dateUtil.getStartOfDay(checkInTime, timezone);

    // Find or create attendance record for the day
    let record = await attendanceRepository.findAttendanceRecord(empId, recordDate);

    if (!record) {
      record = await attendanceRepository.createAttendanceRecord({
        employeeId: empId,
        date: recordDate,
        status: "PRESENT",
      });
    }

    // Check for open sessions
    const openSession = await attendanceRepository.findOpenSession(empId);
    if (openSession) {
      throw new Error("You already have an active session. Please clock out first.");
    }

    // Validate: new check-in must be after previous checkout
    if (record.sessions && record.sessions.length > 0) {
      const completedSessions = record.sessions.filter(s => s.checkInTime && s.checkOutTime);
      
      if (completedSessions.length > 0) {
        const lastCheckOut = completedSessions.reduce((latest, session) => {
          const sessionCheckOut = new Date(session.checkOutTime);
          return sessionCheckOut > latest ? sessionCheckOut : latest;
        }, new Date(0));
        
        if (checkInTime <= lastCheckOut) {
          throw new Error(
            `Invalid check-in time. New check-in must be after the previous checkout time.`
          );
        }
      }
    }

    // Create a new session
    const session = await attendanceRepository.createSession({
      attendanceRecordId: record.id,
      checkInTime: checkInTime,
      location,
      status: 'ACTIVE'
    });

    return { record, session };
  } catch (error) {
    throw new Error(`Clock in failed: ${error.message}`);
  }
};

/**
 * Clock Out
 * @param {string} employeeId
 * @param {string} customTime - Optional custom clock out time
 * @returns {Promise<Object>}
 */
/**
 * Clock Out
 * @param {string} employeeId
 * @param {string} customTime - Optional custom clock out time
 * @param {string} breakStart - Optional break start time (HH:mm)
 * @param {string} breakEnd - Optional break end time (HH:mm)
 * @returns {Promise<Object>}
 */
const clockOut = async (employeeId, customTime = null, breakStart = null, breakEnd = null) => {
  try {
    const { employeeId: empId, timezone } = await getEmployeeInfo(employeeId);

    // Find the most recent open session
    const openSession = await attendanceRepository.findOpenSession(empId);

    if (!openSession) {
      throw new Error("No open session found to clock out from.");
    }

    const checkOutTime = customTime ? new Date(customTime) : dateUtil.getNow();
    
    // Validate checkout time is after checkin
    if (checkOutTime <= new Date(openSession.checkInTime)) {
      throw new Error("Clock out time must be after clock in time.");
    }

    // Handle Break Creation if times are provided
    if (breakStart && breakEnd) {
      // Parse HH:mm to Date objects relative to the session date in the user's timezone
      // We assume the break happened on the same day as the session check-in
      // or the check-out day.
      
      // Use the check-out time as the base date, but ensure we respect the timezone
      const baseDate = dateUtil.dayjs(checkOutTime).tz(timezone);
      const [startHour, startMin] = breakStart.split(':').map(Number);
      const [endHour, endMin] = breakEnd.split(':').map(Number);
      
      const breakStartTime = baseDate.hour(startHour).minute(startMin).second(0).millisecond(0);
      const breakEndTime = baseDate.hour(endHour).minute(endMin).second(0).millisecond(0);
      
      const checkInTimeDate = dateUtil.dayjs(openSession.checkInTime).tz(timezone);
      const checkOutTimeDate = dateUtil.dayjs(checkOutTime).tz(timezone);

      // Validations
      if (breakStartTime.isBefore(checkInTimeDate)) {
         throw new Error("Break start time must be after clock in time.");
      }
      
      if (breakEndTime.isBefore(breakStartTime) || breakEndTime.isSame(breakStartTime)) {
        throw new Error("Break end time must be after break start time.");
      }
      
      if (checkOutTimeDate.isBefore(breakEndTime) || checkOutTimeDate.isSame(breakEndTime)) {
        throw new Error("Clock out time must be after break end time.");
      }

      // Create the break
      await attendanceRepository.createBreak({
        sessionId: openSession.id,
        startTime: breakStartTime,
        endTime: breakEndTime,
        durationMinutes: dateUtil.calculateDurationMinutes(breakStartTime, breakEndTime)
      });
      
      // Add to session object for duration calculation below
      if (!openSession.breaks) openSession.breaks = [];
      openSession.breaks.push({
        startTime: breakStartTime,
        endTime: breakEndTime,
        durationMinutes: dateUtil.calculateDurationMinutes(breakStartTime, breakEndTime)
      });
    }

    // Calculate session duration (excluding breaks)
    const durationMinutes = calculateSessionDuration(
      openSession.checkInTime,
      checkOutTime,
      openSession.breaks || []
    );

    // Update session
    await attendanceRepository.updateSession(openSession.id, { 
      checkOutTime: checkOutTime,
      durationMinutes,
      status: 'COMPLETED'
    });

    // Update attendance record totals
    const updatedRecord = await updateRecordTotals(openSession.attendanceRecord.id);

    return updatedRecord;
  } catch (error) {
    throw new Error(`Clock out failed: ${error.message}`);
  }
};

/**
 * Start Break
 * @param {string} employeeId
 * @param {string} customTime - Optional custom break start time
 * @returns {Promise<Object>}
 */
const startBreak = async (employeeId, customTime = null) => {
  try {
    const { employeeId: empId } = await getEmployeeInfo(employeeId);

    // Find open session
    const openSession = await attendanceRepository.findOpenSession(empId);

    if (!openSession) {
      throw new Error("No active session found. Please clock in first.");
    }

    // Check if there's already an active break
    const activeBreak = await attendanceRepository.findActiveBreak(openSession.id);
    if (activeBreak) {
      throw new Error("You already have an active break. Please end it first.");
    }

    const breakStartTime = customTime ? new Date(customTime) : dateUtil.getNow();

    // Create break
    const breakRecord = await attendanceRepository.createBreak({
      sessionId: openSession.id,
      startTime: breakStartTime,
    });

    return { session: openSession, break: breakRecord };
  } catch (error) {
    throw new Error(`Start break failed: ${error.message}`);
  }
};

/**
 * End Break
 * @param {string} employeeId
 * @param {string} customTime - Optional custom break end time
 * @returns {Promise<Object>}
 */
const endBreak = async (employeeId, customTime = null) => {
  try {
    const { employeeId: empId } = await getEmployeeInfo(employeeId);

    // Find open session
    const openSession = await attendanceRepository.findOpenSession(empId);

    if (!openSession) {
      throw new Error("No active session found.");
    }

    // Find active break
    const activeBreak = await attendanceRepository.findActiveBreak(openSession.id);
    if (!activeBreak) {
      throw new Error("No active break found to end.");
    }

    const breakEndTime = customTime ? new Date(customTime) : dateUtil.getNow();
    
    // Validate end time is after start time
    if (breakEndTime <= new Date(activeBreak.startTime)) {
      throw new Error("Break end time must be after break start time.");
    }

    // Calculate break duration
    const durationMinutes = dateUtil.calculateDurationMinutes(
      activeBreak.startTime,
      breakEndTime
    );

    // Update break
    const updatedBreak = await attendanceRepository.updateBreak(activeBreak.id, {
      endTime: breakEndTime,
      durationMinutes
    });

    return { session: openSession, break: updatedBreak };
  } catch (error) {
    throw new Error(`End break failed: ${error.message}`);
  }
};

const calculateRecordMinutes = (record, now) => {
  if (!record || !record.sessions) return 0;

  let totalMinutes = 0;

  record.sessions.forEach(session => {
    if (!session.checkInTime) return;

    // Determine session end time (CheckOut or Now)
    const sessionEndTime = session.checkOutTime ? new Date(session.checkOutTime) : now;
    const sessionStartTime = new Date(session.checkInTime);

    // Calculate gross duration
    const grossDuration = dateUtil.calculateDurationMinutes(sessionStartTime, sessionEndTime);

    // Calculate total break duration
    let totalBreakMinutes = 0;
    if (session.breaks && session.breaks.length > 0) {
      session.breaks.forEach(breakItem => {
        if (!breakItem.startTime) return;
        
        const breakStartTime = new Date(breakItem.startTime);
        // Break end is either stored endTime, or Now (if active), but capped at sessionEndTime
        let breakEndTime = breakItem.endTime ? new Date(breakItem.endTime) : now;
        
        // Safety check: break shouldn't extend beyond session (though for active session/break both are 'now')
        if (breakEndTime > sessionEndTime) breakEndTime = sessionEndTime;

        totalBreakMinutes += dateUtil.calculateDurationMinutes(breakStartTime, breakEndTime);
      });
    }

    // Net duration
    const netDuration = Math.max(0, grossDuration - totalBreakMinutes);
    totalMinutes += netDuration;
  });

  return Math.floor(totalMinutes);
};

/**
 * Get Attendance Stats (Today, Week, Month)
 * @param {string} employeeId
 * @returns {Promise<Object>}
 */
const getAttendanceStats = async (employeeId) => {
  try {
    const { employeeId: empId, timezone } = await getEmployeeInfo(employeeId);
    const now = dateUtil.getNow();
    
    // Today - Fetch records from Yesterday and Today to handle sessions attached to wrong record
    // due to previous timezone bugs
    const todayStart = dateUtil.getStartOfDay(now, timezone);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const searchStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000); // Yesterday

    // Use repository instead of direct prisma call
    const recentRecords = await attendanceRepository.findAttendanceRecordsByDateRange(
      empId,
      searchStart,
      todayEnd
    );

    // Week (Start from Monday)
    const startOfWeek = dateUtil.getStartOfWeek(now, timezone);
    const weekRecords = await attendanceRepository.findAttendanceRecordsByDateRange(
      empId, 
      startOfWeek
    );

    // Month
    const startOfMonth = dateUtil.getStartOfMonth(now, timezone);
    const monthRecords = await attendanceRepository.findAttendanceRecordsByDateRange(
      empId, 
      startOfMonth
    );

    // Calculate minutes for today by filtering sessions from recent records
    let minutesToday = 0;
    recentRecords.forEach(record => {
      if (!record.sessions) return;
      
      record.sessions.forEach(session => {
        if (!session.checkInTime) return;
        
        const checkInTime = new Date(session.checkInTime);
        // Check if session belongs to Today
        if (checkInTime >= todayStart && checkInTime <= todayEnd) {
           // Calculate duration for this session
           const sessionEndTime = session.checkOutTime ? new Date(session.checkOutTime) : now;
           const grossDuration = dateUtil.calculateDurationMinutes(checkInTime, sessionEndTime);
           
           let totalBreakMinutes = 0;
           if (session.breaks && session.breaks.length > 0) {
             session.breaks.forEach(breakItem => {
               if (!breakItem.startTime) return;
               const breakStartTime = new Date(breakItem.startTime);
               let breakEndTime = breakItem.endTime ? new Date(breakItem.endTime) : now;
               if (breakEndTime > sessionEndTime) breakEndTime = sessionEndTime;
               totalBreakMinutes += dateUtil.calculateDurationMinutes(breakStartTime, breakEndTime);
             });
           }
           
           minutesToday += Math.max(0, grossDuration - totalBreakMinutes);
        }
      });
    });
    
    // Helper to calculate minutes for a specific range
    const calculateMinutesInRange = (records, startDate) => {
      let totalMinutes = 0;
      records.forEach(record => {
        if (!record.sessions) return;
        
        record.sessions.forEach(session => {
          if (!session.checkInTime) return;
          
          const checkInTime = new Date(session.checkInTime);
          
          // Only include sessions that actually started on or after the start date
          if (checkInTime >= startDate) {
             const sessionEndTime = session.checkOutTime ? new Date(session.checkOutTime) : now;
             const grossDuration = dateUtil.calculateDurationMinutes(checkInTime, sessionEndTime);
             
             let totalBreakMinutes = 0;
             if (session.breaks && session.breaks.length > 0) {
               session.breaks.forEach(breakItem => {
                 if (!breakItem.startTime) return;
                 const breakStartTime = new Date(breakItem.startTime);
                 let breakEndTime = breakItem.endTime ? new Date(breakItem.endTime) : now;
                 if (breakEndTime > sessionEndTime) breakEndTime = sessionEndTime;
                 totalBreakMinutes += dateUtil.calculateDurationMinutes(breakStartTime, breakEndTime);
               });
             }
             
             totalMinutes += Math.max(0, grossDuration - totalBreakMinutes);
          }
        });
      });
      return Math.floor(totalMinutes);
    };

    const minutesThisWeek = calculateMinutesInRange(weekRecords, startOfWeek);
    const minutesThisMonth = calculateMinutesInRange(monthRecords, startOfMonth);

    return {
      minutesToday,
      minutesThisWeek,
      minutesThisMonth,
      // Also provide formatted versions
      hoursToday: dateUtil.formatDuration(minutesToday),
      hoursThisWeek: dateUtil.formatDuration(minutesThisWeek),
      hoursThisMonth: dateUtil.formatDuration(minutesThisMonth),
    };
  } catch (error) {
    throw new Error(`Error fetching attendance stats: ${error.message}`);
  }
};

/**
 * Get Today's Attendance Record
 * @param {string} employeeId
 * @param {string} date - Optional date string
 * @returns {Promise<Object|null>}
 */
const getTodayAttendance = async (employeeId, date = null) => {
  try {
    const { employeeId: empId, timezone } = await getEmployeeInfo(employeeId);
    
    let queryDate;
    if (date) {
      queryDate = dateUtil.getStartOfDay(new Date(date), timezone);
    } else {
      queryDate = dateUtil.getStartOfDay(dateUtil.getNow(), timezone);
    }

    return await attendanceRepository.findAttendanceRecord(empId, queryDate);
  } catch (error) {
    throw new Error(`Error fetching today's attendance: ${error.message}`);
  }
};

/**
 * Get Attendance Record by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getAttendanceById = async (id) => {
  try {
    const record = await attendanceRepository.findAttendanceRecordById(id);
    if (!record) {
      throw new Error("Attendance record not found");
    }
    return record;
  } catch (error) {
    throw new Error(`Error fetching attendance by ID: ${error.message}`);
  }
};

/**
 * Fix Missing Clock Out (Admin/HR function)
 * @param {string} recordId
 * @param {string} clockOutTime - ISO string
 * @returns {Promise<Object>}
 */
const fixMissingClockOut = async (recordId, clockOutTime, breakStartTime, breakEndTime) => {
  try {
    const record = await attendanceRepository.findAttendanceRecordById(recordId);

    if (!record) {
      throw new Error("Attendance record not found");
    }

    const openSessions = record.sessions.filter(s => !s.checkOutTime);
    if (openSessions.length === 0) {
      throw new Error("No open session found for this record");
    }

    const checkOutDate = new Date(clockOutTime);

    // Update all open sessions
    for (const session of openSessions) {
      // Handle break creation if times provided
      if (breakStartTime && breakEndTime) {
         const bStart = new Date(breakStartTime);
         const bEnd = new Date(breakEndTime);
         
         // Validations
         if (bStart <= new Date(session.checkInTime)) throw new Error("Break start must be after check in");
         if (bEnd <= bStart) throw new Error("Break end must be after break start");
         if (checkOutDate <= bEnd) throw new Error("Check out must be after break end");

         await attendanceRepository.createBreak({
            sessionId: session.id,
            startTime: bStart,
            endTime: bEnd,
            durationMinutes: dateUtil.calculateDurationMinutes(bStart, bEnd)
         });
         
         // Add to session breaks for duration calculation
         if (!session.breaks) session.breaks = [];
         session.breaks.push({ 
             startTime: bStart, 
             endTime: bEnd, 
             durationMinutes: dateUtil.calculateDurationMinutes(bStart, bEnd) 
         });
      }

      const durationMinutes = calculateSessionDuration(
        session.checkInTime,
        checkOutDate,
        session.breaks || []
      );

      await attendanceRepository.updateSession(session.id, {
        checkOutTime: checkOutDate,
        durationMinutes,
        status: 'COMPLETED'
      });
    }

    // Update attendance record totals
    const updatedRecord = await updateRecordTotals(record.id);

    return updatedRecord;
  } catch (error) {
    throw new Error(`Fix missing clock out failed: ${error.message}`);
  }
};

module.exports = {
  getAllAttendance,
  getAttendanceForEmployee,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getAttendanceStats,
  getTodayAttendance,
  getAttendanceById,
  fixMissingClockOut,
};
