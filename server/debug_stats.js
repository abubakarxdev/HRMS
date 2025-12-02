const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dateUtil = require('./src/utils/date.util');

// Mock repository functions to use real Prisma
const attendanceRepository = {
  findUserByEmployeeId: async (id) => {
    return prisma.employee.findUnique({
      where: { id },
      include: { user: true }
    });
  },
  findAttendanceRecordsByDateRange: async (employeeId, startDate, endDate) => {
    const where = {
      employeeId,
      date: {
        gte: startDate,
      },
    };
    if (endDate) {
      where.date.lte = endDate;
    }
    return prisma.attendanceRecord.findMany({
      where,
      include: { sessions: { include: { breaks: true } } },
    });
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

async function main() {
  // Get first employee
  const employee = await prisma.employee.findFirst({
    include: { user: true }
  });

  if (!employee) {
    console.log("No employee found");
    return;
  }

  console.log(`Debugging stats for: ${employee.firstName} ${employee.lastName} (${employee.id})`);
  console.log(`Timezone: ${employee.user?.timezone}`);

  const timezone = employee.user?.timezone || dateUtil.DEFAULT_TIMEZONE;
  const now = new Date(); // Use server time
  console.log(`Server Now: ${now.toISOString()}`);

  // Week (Start from Monday)
  const startOfWeek = dateUtil.getStartOfWeek(now, timezone);
  console.log(`Start of Week (${timezone}): ${startOfWeek.toISOString()}`);

  const weekRecords = await attendanceRepository.findAttendanceRecordsByDateRange(
    employee.id, 
    startOfWeek
  );

  console.log(`Found ${weekRecords.length} records for this week.`);

  let totalMinutes = 0;
  weekRecords.forEach(r => {
    const mins = calculateRecordMinutes(r, now);
    console.log(`- Record ${r.id} (${r.date.toISOString()}): ${mins} mins (${dateUtil.formatDuration(mins)})`);
    totalMinutes += mins;
  });

  console.log(`Total Week Minutes: ${totalMinutes}`);
  console.log(`Total Week Hours: ${dateUtil.formatDuration(totalMinutes)}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
