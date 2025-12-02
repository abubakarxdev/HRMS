console.log('DEBUG: seed.ts loaded');
/// <reference types="node" />
// @ts-ignore
import { PrismaClient } from '@prisma/client';
// @ts-ignore
import * as bcrypt from 'bcryptjs';


import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Clean up existing data (Safe to re-run)
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.break.deleteMany(),
    prisma.session.deleteMany(),
    prisma.attendanceRecord.deleteMany(),
    prisma.leaveRequest.deleteMany(),
    prisma.leaveBalance.deleteMany(),
    prisma.employmentContract.deleteMany(),
    prisma.user.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.publicHoliday.deleteMany(),
    prisma.office.deleteMany(),
    prisma.legalEntity.deleteMany(),
  ]);

  // 2. Create Organization Structure
  const legalEntity = await prisma.legalEntity.create({
    data: {
      name: 'TechFlow Solutions',
      countryCode: 'PK',
      defaultCurrency: 'PKR',
    },
  });

  const office = await prisma.office.create({
    data: {
      name: 'Cogilent Solutions',
      address: 'Evacuee Trust Complex , 2nd floor, 209 (A), Islamabad',
      timezone: 'Asia/Karachi',
      legalEntityId: legalEntity.id,
    },
  });

  console.log('🏢 Organization created:', legalEntity.name);

  // 3. Create Leave Settings
  await prisma.leaveSetting.create({
    data: {
      legalEntityId: legalEntity.id,
      policyType: 'Standard Full-Time',
      config: {
        annual: 14,
        sick: 10,
        casual: 8,
      },
    },
  });

  // 4. Create Users & Employees
  const passwordHash = await bcrypt.hash('password123', 10);

  // -- ADMIN USER (HR Manager) --
  const adminEmployee = await prisma.employee.create({
    data: {
      firstName: 'Madiha',
      lastName: 'Kareem',
      workEmail: 'madiha.admin@cogilent.com',
      employeeIdNumber: 'EMP-001',
      joiningDate: new Date('2020-01-01'),
      legalEntityId: legalEntity.id,
      officeId: office.id,
      status: 'Active',
      contracts: {
        create: {
          type: 'FULL_TIME',
          position: 'HR Manager',
          startDate: new Date('2020-01-01'),
          probationEndDate: new Date('2020-04-01'), // Historical probation
          currency: 'PKR',
          salary: 250000,
          isActive: true,
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'madiha.admin@cogilent.com',
      passwordHash,
      role: 'HR',
      employeeId: adminEmployee.id,
    },
  });

  // -- REGULAR EMPLOYEE --
  const devEmployee = await prisma.employee.create({
    data: {
      firstName: 'Abu',
      lastName: 'Bakar',
      workEmail: 'abubakar.dev@cogilent.com',
      employeeIdNumber: 'EMP-002',
      joiningDate: new Date('2025-11-06'),
      legalEntityId: legalEntity.id,
      officeId: office.id,
      managerId: adminEmployee.id,
      status: 'Active',
      contracts: {
        create: {
          type: 'FULL_TIME',
          position: 'Software Engineer',
          department: 'Engineering',
          startDate: new Date('2025-11-06'),
          // Setting 3 months probation from joining
          probationEndDate: new Date('2026-02-06'),
          currency: 'PKR',
          salary: 65000,
          isActive: true,
        },
      },
      leaveBalances: {
        createMany: {
          data: [
            { year: 2025, leaveType: 'Annual', totalCredits: 14 },
            { year: 2025, leaveType: 'Sick', totalCredits: 10 },
          ],
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'abubakar.dev@cogilent.com',
      passwordHash,
      role: 'EMPLOYEE',
      employeeId: devEmployee.id,
    },
  });

  console.log('👥 Users created: Admin (madiha.admin) & Employee (abubakar.dev)');
  console.log('🌱 Seed finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });