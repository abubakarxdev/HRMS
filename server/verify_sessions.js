const { PrismaClient } = require('@prisma/client');
const attendanceService = require('./src/services/attendance.service');
const dateUtil = require('./src/utils/date.util');

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Verification...");

  // 1. Create a test user
  const email = `test_session_${Date.now()}@example.com`;
  const employeeId = `EMP_SESS_${Date.now()}`;
  
  const user = await prisma.user.create({
    data: {
      employeeId,
      name: "Session Tester",
      email,
      passwordHash: "hash",
      role: "EMPLOYEE",
    }
  });
  
  console.log(`Created user: ${user.employeeId}`);

  // 2. Clock In (Session 1)
  console.log("Clocking In (Session 1)...");
  await attendanceService.clockIn(employeeId, "Office", new Date().toISOString());
  
  // 3. Clock Out (Session 1)
  console.log("Clocking Out (Session 1)...");
  await new Promise(r => setTimeout(r, 100)); // small delay
  await attendanceService.clockOut(employeeId, new Date().toISOString());

  // 4. Clock In (Session 2)
  console.log("Clocking In (Session 2)...");
  await new Promise(r => setTimeout(r, 100));
  await attendanceService.clockIn(employeeId, "Home", new Date().toISOString());

  // 5. Clock Out (Session 2)
  console.log("Clocking Out (Session 2)...");
  await new Promise(r => setTimeout(r, 100));
  await attendanceService.clockOut(employeeId, new Date().toISOString());

  // 6. Verify
  console.log("Verifying Records...");
  const records = await attendanceService.getAttendanceForEmployee(employeeId);
  
  if (records.length !== 1) {
    console.error(`Expected 1 AttendanceRecord, found ${records.length}`);
  } else {
    const record = records[0];
    console.log(`AttendanceRecord ID: ${record.id}`);
    console.log(`Total Hours: ${record.totalHours}`);
    console.log(`Sessions Count: ${record.sessions.length}`);
    
    record.sessions.forEach((s, i) => {
      console.log(`  Session ${i+1}: ${s.type} | In: ${s.checkIn.toISOString()} | Out: ${s.checkOut?.toISOString()} | Loc: ${s.location}`);
    });

    if (record.sessions.length >= 2) {
      console.log("SUCCESS: Multiple sessions found!");
    } else {
      console.error("FAILURE: Sessions overridden or missing!");
    }
  }

  // Cleanup
  await prisma.attendanceSession.deleteMany({ where: { attendanceRecord: { employeeId: user.id } } });
  await prisma.attendanceRecord.deleteMany({ where: { employeeId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
