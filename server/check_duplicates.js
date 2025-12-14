const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    // 1. Get all employees
    const employees = await prisma.employee.findMany();
    console.log(`Checking ${employees.length} employees for duplicate attendance...`);

    for (const emp of employees) {
      // Group by date
      const records = await prisma.attendanceRecord.findMany({
        where: { employeeId: emp.id },
        select: { id: true, date: true, totalWorkMinutes: true }
      });

      const dateMap = {};
      for (const record of records) {
        const dateStr = record.date.toISOString().split('T')[0]; // simple YYYY-MM-DD check
        if (!dateMap[dateStr]) {
            dateMap[dateStr] = [];
        }
        dateMap[dateStr].push(record);
      }

      for (const [date, recs] of Object.entries(dateMap)) {
        if (recs.length > 1) {
            console.log(`[DUPLICATE FOUND] Employee: ${emp.firstName} ${emp.lastName} (${emp.id})`);
            console.log(`  Date: ${date}`);
            console.log(`  Records:`, recs);
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();
