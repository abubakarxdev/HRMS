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
  // await prisma.$transaction([
  //   prisma.auditLog.deleteMany(),
  //   prisma.notification.deleteMany(),
  //   prisma.break.deleteMany(),
  //   prisma.session.deleteMany(),
  //   prisma.attendanceRecord.deleteMany(),
  //   prisma.leaveRequest.deleteMany(),
  //   prisma.leaveBalance.deleteMany(),
  //   prisma.employmentContract.deleteMany(),
  //   prisma.user.deleteMany(),
  //   prisma.employee.deleteMany(),
  //   prisma.publicHoliday.deleteMany(),
  //   prisma.office.deleteMany(),
  //   prisma.legalEntity.deleteMany(),
  // ]);

  // 2. Create Organization Structure
  let legalEntity = await prisma.legalEntity.findFirst({ where: { name: 'TechFlow Solutions' } });
  if (!legalEntity) {
    legalEntity = await prisma.legalEntity.create({
      data: {
        name: 'TechFlow Solutions',
        countryCode: 'PK',
        defaultCurrency: 'PKR',
      },
    });
  }

  let office = await prisma.office.findFirst({ where: { name: 'Cogilent Solutions' } });
  if (!office) {
    office = await prisma.office.create({
      data: {
        name: 'Cogilent Solutions',
        address: 'Evacuee Trust Complex , 2nd floor, 209 (A), Islamabad',
        timezone: 'Asia/Karachi',
        legalEntityId: legalEntity.id,
      },
    });
  }

  console.log('🏢 Organization ensured:', legalEntity.name);

  // 3. Create Leave Settings
  const existingSettings = await prisma.leaveSetting.findFirst({ where: { legalEntityId: legalEntity.id } });
  if (!existingSettings) {
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
  }

  // 4. Create Users & Employees
  const passwordHash = await bcrypt.hash('password123', 10);

  const upsertUser = async (
    email: string,
    firstName: string,
    lastName: string,
    empId: string,
    role: string,
    position: string,
    salary: number,
    managerId: string | null | undefined = null
  ) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log(`User ${email} already exists. Skipping.`);
      const emp = await prisma.employee.findUnique({ where: { workEmail: email } });
      return emp;
    }

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        workEmail: email,
        employeeIdNumber: empId,
        joiningDate: new Date('2020-01-01'),
        legalEntityId: legalEntity.id,
        officeId: office.id,
        managerId: managerId || null, // Ensure valid value for Prisma
        status: 'Active',
        contracts: {
          create: {
            type: 'FULL_TIME',
            position,
            startDate: new Date('2020-01-01'),
            currency: 'PKR',
            salary,
            isActive: true,
          },
        },
      },
    });

    if (role === 'EMPLOYEE' && email === 'abubakar.dev@cogilent.com') {
      // Special case for initial leave balances for dev employee
      await prisma.leaveBalance.createMany({
        data: [
          { employeeId: employee.id, year: 2025, leaveType: 'Annual', totalCredits: 14, usedCredits: 0 },
          { employeeId: employee.id, year: 2025, leaveType: 'Sick', totalCredits: 10, usedCredits: 0 },
        ]
      });
    }

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role as any, // Cast to any or import Role enum if strict
        employeeId: employee.id,
      },
    });
    console.log(`✅ Created user: ${email}`);
    return employee;
  };

  const hrEmployee = await upsertUser('madiha.hr@cogilent.com', 'Madiha', 'Karim', 'EMP-3JL8GL8F', 'HR', 'HR Manager', 250000);
  const devEmployee = await upsertUser('abubakar.dev@cogilent.com', 'Abu', 'Bakar', 'EMP-002', 'EMPLOYEE', 'Software Engineer', 65000, hrEmployee?.id);

  await upsertUser('super.admin@cogilent.com', 'Super', 'Admin', 'EMP-000', 'SUPER_ADMIN', 'System Owner', 500000);
  await upsertUser('admin@cogilent.com', 'System', 'Admin', 'EMP-ADMIN', 'ADMIN', 'Administrator', 400000);

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