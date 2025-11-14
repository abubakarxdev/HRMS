const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password', salt);

  // Seed Users (and Employees)
  const employee1 = await prisma.user.create({
    data: {
      employeeId: 'emp-001',
      name: 'Alice Johnson',
      email: 'employee@example.com',
      passwordHash: passwordHash,
      position: 'Software Engineer',
      department: 'Technology',
      role: 'EMPLOYEE',
      status: 'Active',
      hireDate: new Date('2022-08-15'),
      avatar: 'https://i.pravatar.cc/150?u=emp-001',
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      employeeId: 'emp-002',
      name: 'Bob Williams',
      email: 'manager@example.com',
      passwordHash: passwordHash,
      position: 'Engineering Manager',
      department: 'Technology',
      role: 'MANAGER',
      status: 'Active',
      hireDate: new Date('2021-05-20'),
      avatar: 'https://i.pravatar.cc/150?u=emp-002',
    },
  });
  
  const hrAdmin = await prisma.user.create({
    data: {
      employeeId: 'emp-005',
      name: 'Catherine Davis',
      email: 'hr@example.com',
      passwordHash: passwordHash,
      position: 'HR Director',
      department: 'Human Resources',
      role: 'ADMIN_HR',
      status: 'Active',
      hireDate: new Date('2020-02-10'),
      avatar: 'https://i.pravatar.cc/150?u=emp-005',
    },
  });

  // Assign manager
  await prisma.user.update({
      where: { id: employee1.id },
      data: { managerId: manager1.id }
  });


  // Seed Attendance Records
  await prisma.attendanceRecord.createMany({
    data: [
      { employeeId: employee1.id, date: new Date('2023-10-25'), clockIn: '09:05:00', clockOut: '17:30:00', status: 'Present', breakHours: 1 },
      { employeeId: employee1.id, date: new Date('2023-10-26'), clockIn: '09:00:00', clockOut: '17:00:00', status: 'Present', breakHours: 0.5 },
      { employeeId: manager1.id, date: new Date('2023-10-26'), clockIn: '08:45:00', clockOut: '17:15:00', status: 'Present', breakHours: 1 },
      { employeeId: hrAdmin.id, date: new Date('2023-10-26'), status: 'OnLeave' },
    ],
  });

  // Seed Approval Requests
  await prisma.approvalRequest.create({
    data: {
      employeeId: employee1.id,
      type: 'AttendanceCorrection',
      date: new Date('2023-10-25'),
      details: 'Forgot to clock out, correct time is 17:30.',
      status: 'Pending',
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
