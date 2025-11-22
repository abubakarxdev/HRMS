const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.attendanceRecord.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    include: { sessions: true }
  });

  console.log("--- Last 5 Records ---");
  records.forEach(r => {
    console.log(`ID: ${r.id} | Date (UTC): ${r.date.toISOString()} | Status: ${r.status}`);
    r.sessions.forEach(s => {
      console.log(`  Session: ${s.type} | In: ${s.checkIn?.toISOString()} | Out: ${s.checkOut?.toISOString()}`);
    });
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
