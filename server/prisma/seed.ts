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
  let legalEntity = await prisma.legalEntity.findFirst({ where: { name: 'HRMS Solutions' } });
  if (!legalEntity) {
    legalEntity = await prisma.legalEntity.create({
      data: {
        name: 'HRMS Solutions',
        countryCode: 'PK',
        defaultCurrency: 'PKR',
      },
    });
  }

  let office = await prisma.office.findFirst({ where: { name: 'HRMS Solutions' } });
  if (!office) {
    office = await prisma.office.create({
      data: {
        name: 'HRMS Solutions',
        address: 'hostel city , chak shehzad , lane 10 , street 7B',
        timezone: 'Asia/Karachi',
        legalEntityId: legalEntity.id,
      },
    });
  }

  console.log('🏢 Organization ensured:', legalEntity.name);

  // 3. Create Leave Types & Policies (Office Scoped)
  const leaveTypesData = [
    { code: 'ANNUAL', name: 'Annual Leave', isPaid: true, quotaDays: 14 },
    { code: 'SICK', name: 'Sick Leave', isPaid: true, quotaDays: 10 },
    { code: 'CASUAL', name: 'Casual Leave', isPaid: true, quotaDays: 8 },
  ];

  const leaveTypesMap = new Map(); // code -> LeaveType

  for (const typeData of leaveTypesData) {
    const leaveType = await prisma.leaveType.upsert({
      where: { officeId_code: { officeId: office.id, code: typeData.code } },
      update: {},
      create: {
        officeId: office.id,
        code: typeData.code,
        name: typeData.name,
        isPaid: typeData.isPaid,
        isActive: true
      }
    });
    leaveTypesMap.set(typeData.code, leaveType);

    // Create Policy for Standard Full Time
    await prisma.leavePolicy.upsert({
      where: {
        officeId_contractType_leaveTypeId_effectiveFrom: {
          officeId: office.id,
          contractType: 'FULL_TIME',
          leaveTypeId: leaveType.id,
          effectiveFrom: new Date('2025-01-01')
        }
      },
      update: {
        annualQuotaMinutes: typeData.quotaDays * 480,
        effectiveTo: new Date('2025-12-31')
      },
      create: {
        officeId: office.id,
        contractType: 'FULL_TIME',
        leaveTypeId: leaveType.id,
        annualQuotaMinutes: typeData.quotaDays * 480, // 8 hours * 60
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: new Date('2025-12-31'),
        carryForwardAllowed: typeData.code === 'ANNUAL',
        createdByRole: 'SYSTEM'
      }
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

    // Check if employee exists by email or ID
    let employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { workEmail: email },
          { employeeIdNumber: empId }
        ]
      },
      include: { user: true }
    });

    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          firstName,
          lastName,
          workEmail: email,
          employeeIdNumber: empId,
          joiningDate: new Date('2020-01-01'),
          legalEntityId: legalEntity.id,
          officeId: office.id,
          managerId: managerId || null,
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
        include: { user: true }
      });

      if (role === 'EMPLOYEE' && email === 'employee@gmail.com') {
        // Create Balances using LeaveType Relation and Minutes
        const balancesData = [
          { code: 'ANNUAL', days: 14 },
          { code: 'SICK', days: 10 }
        ];

        for (const data of balancesData) {
          const type = leaveTypesMap.get(data.code);
          if (type) {
            await prisma.leaveBalance.create({
              data: {
                employeeId: employee.id,
                officeId: office.id,
                year: 2025,
                leaveTypeId: type.id,
                totalCreditsMinutes: data.days * 480,
                usedCreditsMinutes: 0
              }
            });
          }
        }
      }
    } else {
      console.log(`Employee record for ${email} / ${empId} already exists.`);
    }

    if (employee.user) {
      console.log(`User already exists for employee ${empId}. Updating credentials if needed.`);
      // Optional: Update the existing user to match the seed email/role if it's different
      // For now, we'll just log it. If strict seed is needed, we would update:
      await prisma.user.update({
        where: { id: employee.user.id },
        data: {
          email,
          passwordHash,
          role: role as any
        }
      });
      console.log(`✅ Updated existing user to: ${email}`);
    } else {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: role as any, // Cast to any or import Role enum if strict
          employeeId: employee.id,
        },
      });
      console.log(`✅ Created user: ${email}`);
    }

    return employee;
  };

  const hrEmployee = await upsertUser('hr@gmail.com', 'HR', 'Manager', 'EMP-HR', 'HR', 'HR Manager', 250000);
  const devEmployee = await upsertUser('employee@gmail.com', 'John', 'Doe', 'EMP-001', 'EMPLOYEE', 'Software Engineer', 65000, hrEmployee?.id);

  await upsertUser('super.admin@gmail.com', 'Super', 'Admin', 'EMP-000', 'SUPER_ADMIN', 'System Owner', 500000);
  await upsertUser('admin@gmail.com', 'System', 'Admin', 'EMP-ADMIN', 'ADMIN', 'Administrator', 400000);

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