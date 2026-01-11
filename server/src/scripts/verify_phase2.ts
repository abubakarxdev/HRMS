import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const leaveService = require('../services/leaves.service');

const prisma = new PrismaClient();

// Define minimal types to avoid 'any' errors if inference fails
interface LeaveType {
  id: string;
  name: string;
  officeId: string;
  allowHalfDay: boolean;
}

const verify = async () => {
  console.log("Starting Phase 2 Verification...");

  try {
    // 1. Setup: Get an Employee
    const employee = await prisma.employee.findFirst({
      include: { office: true, user: true }
    });

    if (!employee) {
      console.error("No employee found. Run seed first.");
      return;
    }

    console.log(`Testing with Employee: ${employee.firstName} (${employee.id}) - Office: ${employee.office?.name}`);

    if (!employee.officeId) {
      console.error("Employee has no office assigned.");
      return;
    }

    // 2. Test Get Leave Types
    console.log("\n--- Test 1: Fetch Leave Types ---");
    // Accessing the service function. 
    // Note: verify_phase2.ts is TS, leaves.service.js is JS. 
    // We need to ensure we call it correctly.
    const types = await leaveService.getLeaveTypes(employee.officeId);
    console.log(`Found ${types.length} types:`, types.map((t: LeaveType) => `${t.name} (HalfDay: ${t.allowHalfDay})`).join(', '));

    if (types.length === 0) throw new Error("No leave types found!");

    const annualType = types.find((t: LeaveType) => t.name === 'Annual');
    const sickType = types.find((t: LeaveType) => t.name === 'Sick');

    if (!annualType || !sickType) throw new Error("Missing expected default types (Annual, Sick).");

    // 3. Test Create Request - Full Day Annual
    console.log("\n--- Test 2: Create Full Day Annual Request ---");
    const userRole = employee.user?.role || 'EMPLOYEE';

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const start1 = new Date(nextMonth);
    start1.setDate(10); // 10th of next month
    const end1 = new Date(start1);

    try {
      const req1 = await leaveService.createRequest(employee.id, {
        leaveTypeId: annualType.id,
        startDate: start1.toISOString(),
        endDate: end1.toISOString(),
        reason: "Verification Test 1",
        duration: "FULL_DAY"
      }, userRole);
      console.log("✅ Request Created:", req1.id, req1.status);

      if (req1.status === 'APPROVED') {
        console.log("   Request was Auto-Approved. Checking balance...");
        const updatedBalances = await leaveService.getBalances(employee.id);
        const bal = updatedBalances.find((b: { leaveTypeId: string, totalCredits: number, usedCredits: number }) => b.leaveTypeId === annualType.id);
        if (bal) {
          console.log(`   Balance for Annual: ${bal.totalCredits} days, Used: ${bal.usedCredits} days`);
        }
      }

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("❌ Failed Test 2:", message);
    }

    // 4. Test Half Day
    console.log("\n--- Test 3: Create Half Day Sick Request ---");
    const start2 = new Date(nextMonth);
    start2.setDate(15);

    if (sickType.allowHalfDay) {
      try {
        const req2 = await leaveService.createRequest(employee.id, {
          leaveTypeId: sickType.id,
          startDate: start2.toISOString(),
          endDate: start2.toISOString(),
          reason: "Verification Test Only Half Day",
          duration: "HALF_DAY_AM"
        }, userRole);
        console.log("✅ Half Day Request Created:", req2.id, req2.status, req2.duration);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("❌ Failed Test 3:", message);
      }
    } else {
      console.log("⚠️ Sick Leave does not allow half day in this config. Skipping Test 3.");
    }

    // 5. Test Invalid Half Day
    const restrictedType = types.find((t: LeaveType) => !t.allowHalfDay);
    if (restrictedType) {
      console.log(`\n--- Test 4: Restricted Half Day on ${restrictedType.name} ---`);
      const start3 = new Date(nextMonth);
      start3.setDate(20);
      try {
        await leaveService.createRequest(employee.id, {
          leaveTypeId: restrictedType.id,
          startDate: start3.toISOString(),
          endDate: start3.toISOString(),
          reason: "Should Fail",
          duration: "HALF_DAY_PM"
        }, userRole);
        console.error("❌ Failed Test 4: Should have thrown error but succeeded.");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.log("✅ Correctly rejected:", message);
      }
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Verification Script Error:", message);
  } finally {
    await prisma.$disconnect();
  }
};

verify();
// Note: To verify RBAC (HR blocking), manual testing with two HR accounts is recommended.
