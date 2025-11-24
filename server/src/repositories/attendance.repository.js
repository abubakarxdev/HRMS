const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const findUserByEmployeeId = async (employeeId) => {
  return await prisma.user.findUnique({
    where: { employeeId },
    select: { id: true },
  });
};

const findUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
};

const findAllAttendance = async () => {
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

const findAttendanceByUserId = async (userId) => {
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

const findAttendanceRecord = async (userId, date) => {
  return await prisma.attendanceRecord.findUnique({
    where: {
      unique_attendance_per_day: {
        employeeId: userId,
        date: date,
      },
    },
    include: {
      sessions: true,
    },
  });
};

const createAttendanceRecord = async (data) => {
  return await prisma.attendanceRecord.create({
    data,
  });
};

const createSession = async (data) => {
  return await prisma.attendanceSession.create({
    data,
  });
};

const findOpenSession = async (userId, type = "WORK") => {
  return await prisma.attendanceSession.findFirst({
    where: {
      attendanceRecord: {
        employeeId: userId,
      },
      checkOut: null,
      type: type,
    },
    include: {
      attendanceRecord: {
        include: { sessions: true },
      },
    },
    orderBy: {
      checkIn: "desc",
    },
  });
};

const updateSession = async (id, data) => {
  return await prisma.attendanceSession.update({
    where: { id },
    data,
  });
};

const findAttendanceRecordById = async (id) => {
  return await prisma.attendanceRecord.findUnique({
    where: { id },
    include: { sessions: true },
  });
};

const updateAttendanceRecord = async (id, data) => {
  return await prisma.attendanceRecord.update({
    where: { id },
    data,
    include: { sessions: true },
  });
};

const updateManySessions = async (criteria, data) => {
  return await prisma.attendanceSession.updateMany({
    where: criteria,
    data,
  });
};

const findAttendanceRecordsByDateRange = async (userId, startDate, endDate) => {
  const whereClause = {
    employeeId: userId,
  };

  if (startDate && endDate) {
    whereClause.date = {
      gte: startDate,
      lte: endDate,
    };
  } else if (startDate) {
    whereClause.date = {
      gte: startDate,
    };
  }

  return await prisma.attendanceRecord.findMany({
    where: whereClause,
  });
};

module.exports = {
  findUserByEmployeeId,
  findUserById,
  findAllAttendance,
  findAttendanceByUserId,
  findAttendanceRecord,
  createAttendanceRecord,
  createSession,
  findOpenSession,
  updateSession,
  findAttendanceRecordById,
  updateAttendanceRecord,
  updateManySessions,
  findAttendanceRecordsByDateRange,
};
