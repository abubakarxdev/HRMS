const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // REPLACE WITH YOUR EMPLOYEE ID
  const employeeId = 'EMP001'; 

  const user = await prisma.user.findUnique({
    where: { employeeId },
  });

  if (!user) {
    console.error(`User with Employee ID ${employeeId} not found.`);
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(9, 0, 0, 0); // 9:00 AM yesterday

  console.log(`Creating open session for ${user.firstName} ${user.lastName} on ${yesterday.toDateString()}...`);

  // Create Attendance Record
  const record = await prisma.attendanceRecord.create({
    data: {
      employeeId: user.id,
      date: yesterday,
      status: 'PRESENT',
      sessions: {
        create: {
          checkInTime: yesterday,
          status: 'ACTIVE',
          location: 'Office',
        }
      }
    }
  });

  console.log('Created pending checkout record:', record.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
