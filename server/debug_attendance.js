const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Replace with the specific employeeId if known, or fetch all to find the user
  // Assuming the user is the one logged in, let's list all users first or just dump all attendance
  
  const users = await prisma.user.findMany({
    include: { employee: true }
  });

  console.log("Users:", users.map(u => ({ id: u.id, name: u.name, employeeId: u.employeeId })));

  // Fetch all attendance records with sessions
  const records = await prisma.attendanceRecord.findMany({
    include: {
      sessions: true,
      employee: {
        select: { name: true, employeeId: true }
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  console.log("\n--- Attendance Records ---");
  records.forEach(r => {
    console.log(`\nID: ${r.id} | Date: ${r.date.toISOString()} | Emp: ${r.employee.name} (${r.employee.employeeId}) | Status: ${r.status}`);
    console.log(`Total Hours: ${r.totalHours}`);
    if (r.sessions && r.sessions.length > 0) {
      console.log("Sessions:");
      r.sessions.forEach(s => {
        console.log(`  - ID: ${s.id} | Type: ${s.type} | In: ${s.checkIn ? s.checkIn.toISOString() : 'NULL'} | Out: ${s.checkOut ? s.checkOut.toISOString() : 'NULL'}`);
      });
    } else {
      console.log("  No sessions.");
    }
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
