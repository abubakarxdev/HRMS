const prisma = require("../config/prisma");

/**
 * Find user by employee ID
 */
const findUserByEmployeeId = async (employeeId) => {
  try {
    return await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { 
        id: true,
        user: {
          select: {
            id: true,
            timezone: true
          }
        }
      },
    });
  } catch (error) {
    throw new Error(`Error finding user by employee ID: ${error.message}`);
  }
};

/**
 * Find user by ID
 */
const findUserById = async (id) => {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true,
        timezone: true,
        employeeId: true
      },
    });
  } catch (error) {
    throw new Error(`Error finding user by ID: ${error.message}`);
  }
};

/**
 * Find all attendance records with sessions and breaks, supporting filtering and pagination
 */
const findAllAttendance = async ({ startDate, endDate, status, officeId, skip, take } = {}) => {
  try {
    const where = {};
    if (status && status !== 'all') where.status = status;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    if (officeId) {
      where.employee = {
        officeId: officeId
      };
    }

    return await prisma.attendanceRecord.findMany({
      where,
      orderBy: {
        date: "desc",
      },
      skip,
      take,
      include: {
        sessions: {
          include: {
            breaks: true
          }
        },
        employee: {
          select: {
            id: true,
            employeeIdNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  } catch (error) {
    throw new Error(`Error finding all attendance: ${error.message}`);
  }
};

/**
 * Count all attendance records matching filters
 */
const countAllAttendance = async ({ startDate, endDate, status, officeId } = {}) => {
  try {
    const where = {};
    if (status && status !== 'all') where.status = status;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    if (officeId) {
      where.employee = {
        officeId: officeId
      };
    }

    return await prisma.attendanceRecord.count({ where });
  } catch (error) {
    throw new Error(`Error counting all attendance: ${error.message}`);
  }
};

/**
 * Find attendance records by date range with pagination and status filter
 */
const findAttendanceRecordsByDateRange = async (employeeId, startDate, endDate, status, skip, take) => {
  try {
    const whereClause = {
      employeeId: employeeId,
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      whereClause.date = {
        gte: startDate,
      };
    } else if (endDate) {
      whereClause.date = {
        lte: endDate,
      };
    }

    return await prisma.attendanceRecord.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
      skip,
      take,
      include: {
        sessions: {
          include: {
            breaks: true
          }
        },
        employee: {
          select: {
            id: true,
            employeeIdNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      }
    });
  } catch (error) {
    throw new Error(`Error finding attendance records by date range: ${error.message}`);
  }
};

/**
 * Count attendance records by date range and status
 */
const countAttendanceRecordsByDateRange = async (employeeId, startDate, endDate, status) => {
  try {
    const whereClause = {
      employeeId: employeeId,
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      whereClause.date = {
        gte: startDate,
      };
    } else if (endDate) {
      whereClause.date = {
        lte: endDate,
      };
    }

    return await prisma.attendanceRecord.count({
      where: whereClause,
    });
  } catch (error) {
    throw new Error(`Error counting attendance records: ${error.message}`);
  }
};

/**
 * Find attendance by employee ID
 */
const findAttendanceByEmployeeId = async (employeeId) => {
  try {
    return await prisma.attendanceRecord.findMany({
      where: {
        employeeId: employeeId,
      },
      orderBy: {
        date: "desc",
      },
      include: {
        sessions: {
          include: {
            breaks: true
          }
        },
      },
    });
  } catch (error) {
    throw new Error(`Error finding attendance by employee ID: ${error.message}`);
  }
};

/**
 * Find attendance record for a specific date
 */
const findAttendanceRecord = async (employeeId, date) => {
  try {
    // Ensure we cover the entire day (24 hours from the start time)
    const startOfDay = new Date(date);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    return await prisma.attendanceRecord.findFirst({
      where: {
        employeeId: employeeId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        sessions: {
          include: {
            breaks: true
          },
          orderBy: {
            checkInTime: 'asc'
          }
        },
      },
    });
  } catch (error) {
    throw new Error(`Error finding attendance record: ${error.message}`);
  }
};

/**
 * Create attendance record
 */
const createAttendanceRecord = async (data) => {
  try {
    return await prisma.attendanceRecord.create({
      data,
      include: {
        sessions: {
          include: {
            breaks: true
          }
        }
      }
    });
  } catch (error) {
    throw new Error(`Error creating attendance record: ${error.message}`);
  }
};

/**
 * Create session
 */
const createSession = async (data) => {
  try {
    return await prisma.session.create({
      data,
      include: {
        breaks: true
      }
    });
  } catch (error) {
    throw new Error(`Error creating session: ${error.message}`);
  }
};

/**
 * Create break
 */
const createBreak = async (data) => {
  try {
    return await prisma.break.create({
      data,
    });
  } catch (error) {
    throw new Error(`Error creating break: ${error.message}`);
  }
};

/**
 * Find open session (session without checkOutTime)
 */
const findOpenSession = async (employeeId) => {
  try {
    return await prisma.session.findFirst({
      where: {
        attendanceRecord: {
          employeeId: employeeId,
        },
        checkOutTime: null,
        status: 'ACTIVE'
      },
      include: {
        attendanceRecord: {
          include: { 
            sessions: {
              include: {
                breaks: true
              }
            }
          },
        },
        breaks: true
      },
      orderBy: {
        checkInTime: "desc",
      },
    });
  } catch (error) {
    throw new Error(`Error finding open session: ${error.message}`);
  }
};

/**
 * Update session
 */
const updateSession = async (id, data) => {
  try {
    return await prisma.session.update({
      where: { id },
      data,
      include: {
        breaks: true
      }
    });
  } catch (error) {
    throw new Error(`Error updating session: ${error.message}`);
  }
};

/**
 * Update break
 */
const updateBreak = async (id, data) => {
  try {
    return await prisma.break.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw new Error(`Error updating break: ${error.message}`);
  }
};

/**
 * Find attendance record by ID
 */
const findAttendanceRecordById = async (id) => {
  try {
    return await prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        sessions: {
          include: {
            breaks: true
          },
          orderBy: {
            checkInTime: 'asc'
          }
        },
        employee: {
          select: {
            id: true,
            employeeIdNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  } catch (error) {
    throw new Error(`Error finding attendance record by ID: ${error.message}`);
  }
};

/**
 * Update attendance record
 */
const updateAttendanceRecord = async (id, data) => {
  try {
    return await prisma.attendanceRecord.update({
      where: { id },
      data,
      include: { 
        sessions: {
          include: {
            breaks: true
          }
        }
      },
    });
  } catch (error) {
    throw new Error(`Error updating attendance record: ${error.message}`);
  }
};



/**
 * Find active break in a session
 */
const findActiveBreak = async (sessionId) => {
  try {
    return await prisma.break.findFirst({
      where: {
        sessionId: sessionId,
        endTime: null
      },
      orderBy: {
        startTime: 'desc'
      }
    });
  } catch (error) {
    throw new Error(`Error finding active break: ${error.message}`);
  }
};

/**
 * Get aggregate stats for attendance records matching filters
 */
const getAggregateStats = async ({ employeeId, startDate, endDate, status, officeId } = {}) => {
  try {
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (status && status !== 'all') where.status = status;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    if (officeId) {
      where.employee = {
        officeId: officeId
      };
    }

    const aggregations = await prisma.attendanceRecord.aggregate({
      where,
      _sum: {
        totalWorkMinutes: true,
      },
      _count: {
        _all: true,
      },
    });

    // Aggregation for status counts
    const statusAggregations = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: where,
      _count: {
        _all: true
      }
    });

    const statusCounts = statusAggregations.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {});

    return {
      totalWorkMinutes: aggregations._sum.totalWorkMinutes || 0,
      totalRecordCount: aggregations._count._all,
      totalPresent: (statusCounts['PRESENT'] || 0) + (statusCounts['HALF_DAY'] || 0),
      totalOnLeave: statusCounts['ON_LEAVE'] || 0,
      totalAbsent: statusCounts['ABSENT'] || 0,
      totalLate: statusCounts['LATE'] || 0, // Assuming LATE status exists or will be used
      totalDaysPresent: (statusCounts['PRESENT'] || 0) + (statusCounts['HALF_DAY'] || 0)
    };
  } catch (error) {
    throw new Error(`Error getting aggregate stats: ${error.message}`);
  }
};

module.exports = {
  findUserByEmployeeId,
  findUserById,
  findAllAttendance,
  findAttendanceByEmployeeId,
  findAttendanceRecord,
  createAttendanceRecord,
  createSession,
  createBreak,
  findOpenSession,
  updateSession,
  updateBreak,
  findAttendanceRecordById,
  updateAttendanceRecord,
  findAttendanceRecordsByDateRange,
  findActiveBreak,
  countAllAttendance,
  countAttendanceRecordsByDateRange,
  getAggregateStats,
};
