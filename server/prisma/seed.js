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
      name: 'Abu Bakar',
      email: 'abubakar@gmail.com',
      passwordHash: passwordHash,
      position: 'Software Engineer',
      department: 'Technology',
      role: 'EMPLOYEE',
      status: 'Active',
      hireDate: new Date('2025-11-24'),
      avatar: 'https://avatar.iran.liara.run/public/17',
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      employeeId: 'emp-002',
      name: 'Faisal Chohan',
      email: 'faisal@gmail.com',
      passwordHash: passwordHash,
      position: 'Engineering Manager',
      department: 'Technology',
      role: 'MANAGER',
      status: 'Active',
      hireDate: new Date('2021-05-20'),
      avatar: 'https://avatar.iran.liara.run/public/13',
    },
  });
  
  const hrAdmin = await prisma.user.create({
    data: {
      employeeId: 'emp-005',
      name: 'Madiha Kareem',
      email: 'hr@gmail.com',
      passwordHash: passwordHash,
      position: 'HR Director',
      department: 'Human Resources',
      role: 'ADMIN_HR',
      status: 'Active',
      hireDate: new Date('2020-02-10'),
      avatar: 'https://avatar.iran.liara.run/public/73',
    },
  });

  // Assign manager
  await prisma.user.update({
      where: { id: employee1.id },
      data: { managerId: manager1.id }
  });


  // Seed Attendance Records
  // Seed Attendance Records and Sessions
  const attendanceData = [
    { 
      employeeId: employee1.id, 
      date: new Date('2023-10-25'), 
      checkIn: new Date('2023-10-25T09:05:00'), 
      checkOut: new Date('2023-10-25T17:30:00'), 
      status: 'Present', 
      breakHours: 1 
    },
    { 
      employeeId: employee1.id, 
      date: new Date('2023-10-26'), 
      checkIn: new Date('2023-10-26T09:00:00'), 
      checkOut: new Date('2023-10-26T17:00:00'), 
      status: 'Present', 
      breakHours: 0.5 
    },
    { 
      employeeId: manager1.id, 
      date: new Date('2023-10-26'), 
      checkIn: new Date('2023-10-26T08:45:00'), 
      checkOut: new Date('2023-10-26T17:15:00'), 
      status: 'Present', 
      breakHours: 1 
    },
  ];

  for (const data of attendanceData) {
    const record = await prisma.attendanceRecord.create({
      data: {
        employeeId: data.employeeId,
        date: data.date,
        status: data.status,
        totalHours: 8, // Simplified
        breakHours: data.breakHours,
      },
    });

    if (data.checkIn) {
      await prisma.attendanceSession.create({
        data: {
          attendanceRecordId: record.id,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          type: 'WORK',
          location: 'Office',
        },
      });
    }
  }

  // Leave record
  await prisma.attendanceRecord.create({
    data: {
      employeeId: hrAdmin.id,
      date: new Date('2023-10-26'),
      status: 'OnLeave',
    },
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
