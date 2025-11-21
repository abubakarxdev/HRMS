const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the user first - assuming the user from the context (User-EMP-001 or similar)
  // We'll list all users to be sure
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => ({ id: u.id, employeeId: u.employeeId, name: u.name })));

  // Assuming we want to check for the first user or a specific one. 
  // Let's check for all records with open sessions for yesterday (2025-11-21)
  
  const records = await prisma.attendanceRecord.findMany({
    include: {
      sessions: true,
      employee: true
    },
    orderBy: {
      date: 'desc'
    }
  });

  console.log('\nAttendance Records:');
  records.forEach(r => {
    console.log(`\nRecord ID: ${r.id}, Employee: ${r.employee.name} (${r.employeeId}), Date: ${r.date.toISOString()}`);
    console.log('Sessions:');
    r.sessions.forEach(s => {
      console.log(`  - ID: ${s.id}, Type: ${s.type}, In: ${s.checkIn.toISOString()}, Out: ${s.checkOut ? s.checkOut.toISOString() : 'NULL'}`);
    });
    
    const hasOpenSession = r.sessions.some(s => !s.checkOut);
    if (hasOpenSession) {
        console.log('  ⚠️ HAS OPEN SESSION');
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
