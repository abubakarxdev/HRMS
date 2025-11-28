require('dotenv').config();
const attendanceService = require('./src/services/attendance.service');
const prisma = require('./src/config/prisma');
const dateUtil = require('./src/utils/date.util');

async function runTest() {
  try {
    console.log("Starting Reproduction Test...");

    // 1. Create a dummy employee
    const email = `test_${Date.now()}@example.com`;
    const employeeIdNumber = `EMP_${Date.now()}`;
    
    console.log(`Creating test employee: ${email}`);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: 'password123',
        role: 'EMPLOYEE',
        employee: {
          create: {
            firstName: 'Test',
            lastName: 'User',
            employeeIdNumber,
            department: 'IT',
            designation: 'Tester',
            joiningDate: new Date(),
          }
        }
      },
      include: {
        employee: true
      }
    });

    const employeeId = user.employee.id;
    console.log(`Created Employee ID: ${employeeId}`);

    // 2. Simulate Check-In (1 hour ago)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    console.log(`Clocking in at: ${oneHourAgo.toISOString()}`);
    await attendanceService.clockIn(employeeId, "Office", oneHourAgo.toISOString());

    // 3. Simulate Check-Out (30 mins ago) -> Duration: 30 mins
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
    console.log(`Clocking out at: ${thirtyMinsAgo.toISOString()}`);
    await attendanceService.clockOut(employeeId, thirtyMinsAgo.toISOString());

    // 4. Verify Stats (Should be ~30 mins)
    let stats = await attendanceService.getAttendanceStats(employeeId);
    console.log("Stats after first session (Closed):", stats);
    
    if (Math.abs(stats.minutesToday - 30) > 2) {
      console.warn("WARNING: Expected ~30 minutes, got " + stats.minutesToday);
    } else {
      console.log("SUCCESS: First session stats correct.");
    }

    // 5. Simulate Check-In Again (Now) -> Active Session
    console.log(`Clocking in again at: ${now.toISOString()}`);
    await attendanceService.clockIn(employeeId, "Office", now.toISOString());

    // 6. Verify Stats (Should still be ~30 mins because active session duration is 0 until updated? 
    // OR should it calculate live? The user wants it to include active session time.)
    // Let's see what it returns currently.
    stats = await attendanceService.getAttendanceStats(employeeId);
    console.log("Stats after second check-in (Active):", stats);

    // 7. Simulate 15 minutes passing (by manually updating the session checkInTime to 15 mins ago)
    // We can't easily wait 15 mins, so we update the DB record.
    const openSession = await prisma.session.findFirst({
      where: {
        attendanceRecord: { employeeId },
        checkOutTime: null
      }
    });

    if (openSession) {
      const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
      await prisma.session.update({
        where: { id: openSession.id },
        data: { checkInTime: fifteenMinsAgo }
      });
      console.log(`Simulated 15 mins passing (Active session start moved to ${fifteenMinsAgo.toISOString()})`);
    }

    // 8. Verify Stats Again (Should be 30 + 15 = 45 mins)
    stats = await attendanceService.getAttendanceStats(employeeId);
    console.log("Stats with active session (simulated 15m duration):", stats);

    const expectedTotal = 30 + 15;
    if (Math.abs(stats.minutesToday - expectedTotal) > 2) {
      console.error(`FAILURE: Expected ~${expectedTotal} minutes, got ${stats.minutesToday}`);
    } else {
      console.log(`SUCCESS: Stats correctly include active session time!`);
    }

    // Cleanup
    console.log("Cleaning up...");
    await prisma.session.deleteMany({ where: { attendanceRecord: { employeeId } } });
    await prisma.attendanceRecord.deleteMany({ where: { employeeId } });
    await prisma.employee.delete({ where: { id: employeeId } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log("Cleanup done.");

  } catch (error) {
    console.error("Test Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
