const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all attendance records with sessions
  const records = await prisma.attendanceRecord.findMany({
    orderBy: { date: 'desc' },
    take: 10,
    include: { 
      sessions: true,
      employee: {
        select: { name: true, employeeId: true }
      }
    }
  });

  console.log("--- Recent Attendance Records ---\n");
  records.forEach(r => {
    console.log(`Employee: ${r.employee.name} (${r.employee.employeeId})`);
    console.log(`Date: ${r.date.toISOString().split('T')[0]}`);
    console.log(`Status: ${r.status}`);
    console.log(`Total Hours: ${r.totalHours}`);
    console.log(`Break Hours: ${r.breakHours}`);
    console.log(`Sessions:`);
    r.sessions.forEach(s => {
      const duration = s.checkOut ? 
        ((new Date(s.checkOut) - new Date(s.checkIn)) / (1000 * 60 * 60)).toFixed(2) : 
        'OPEN';
      console.log(`  - ${s.type}: ${new Date(s.checkIn).toISOString()} -> ${s.checkOut ? new Date(s.checkOut).toISOString() : 'OPEN'} (${duration}h)`);
    });
    console.log('---\n');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
