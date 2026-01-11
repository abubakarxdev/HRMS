const leaveRepository = require("../repositories/leaves.repository");
const attendanceRepository = require("../repositories/attendance.repository");
const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const notificationService = require("./notification.service");
const holidayRepository = require("../repositories/holiday.repository");
const leavePolicyService = require("./leavePolicy.service");

const DEFAULT_LEAVE_QUOTAS = {
  Sick: 10,
  Annual: 14,
  Casual: 8,
};

/**
 * Get leave balances for an employee, initializing if necessary for the specific year
 */
/**
 * Get leave balances for an employee, initializing if necessary
 */
const getBalances = async (employeeId, year = new Date().getFullYear()) => {
  const targetYear = parseInt(year);
  
  // Fetch Employee to get Office and Contract info
  const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { 
          contracts: { 
              where: { isActive: true },
              take: 1
          },
          office: { select: { id: true } }
      } 
  });

  if (!employee || !employee.officeId) return [];

  const contractType = employee.contracts[0]?.type || 'FULL_TIME'; // Fallback?

  // Fetch allowable Leave Types for this Office
  const leaveTypes = await leaveRepository.findLeaveTypes(employee.officeId);
  
  // Fetch existing Balances
  let balances = await leaveRepository.findLeaveBalances(employeeId, targetYear);
  
  // Check for missing balances and initialize based on Policy
  const missingTypes = leaveTypes.filter(type => !balances.find(b => b.leaveTypeId === type.id));

  if (missingTypes.length > 0) {
      const newBalances = [];
      for (const type of missingTypes) {
          try {
              // Find Policy
              const policy = await leaveRepository.findLeavePolicy(employee.officeId, contractType, type.id, targetYear);
              
              // If no policy found for this specific year/type, maybe skip or use 0? 
              // Policy is required for quota.
              const quota = policy ? policy.annualQuotaMinutes : 0; 

              const newBal = await leaveRepository.createLeaveBalance({
                  employeeId,
                  officeId: employee.officeId,
                  year: targetYear,
                  leaveTypeId: type.id,
                  totalCreditsMinutes: quota,
                  usedCreditsMinutes: 0
              });
              // Attach type for consistency
              newBal.leaveType = type; 
              newBalances.push(newBal);
          } catch (error) {
              console.warn(`[getBalances] Failed to create balance for ${type.code}:`, error.message);
          }
      }
      balances = [...balances, ...newBalances];
  }

  // DYNAMIC SYNC: Update balances if Policy Quota has changed
  for (const balance of balances) {
      try {
          // Re-fetch policy to check for updates & Archival Status
          const policy = await leaveRepository.findLeavePolicy(employee.officeId, contractType, balance.leaveTypeId, targetYear);
          
          if (policy) {
             // Attach Archival Status (Memory only, not stored in Balance table usually, or maybe we should?)
             // For now, we return it dynamically.
             balance.policyIsArchived = policy.isArchived;

             // If Policy Quota differs from Total Credits (and assuming no manual overrides exist yet), sync it.
             // We compare 'totalCreditsMinutes'.
             if (balance.totalCreditsMinutes !== policy.annualQuotaMinutes) {
                 console.log(`[Balance Sync] Updating ${balance.leaveType.code} for Emp ${employeeId}: ${balance.totalCreditsMinutes} -> ${policy.annualQuotaMinutes}`);
                 
                 const updated = await leaveRepository.updateLeaveBalance(balance.id, {
                     totalCreditsMinutes: policy.annualQuotaMinutes
                 });
                 
                 // Update the local object to return correct data immediately
                 balance.totalCreditsMinutes = updated.totalCreditsMinutes;
             }
          } else {
              // Policy might be deleted or not found?
              // If not found, maybe treat as archived or invalid?
              balance.policyIsArchived = false; // Default safe
          }
      } catch (err) {
          console.warn(`[Balance Sync] Failed to sync balance for ${balance.id}`, err);
      }
  }

  // Transform for Frontend compatibility (Minutes -> Days)
  return balances.map(b => ({
      ...b,
      totalCredits: b.totalCreditsMinutes / 480,
      usedCredits: b.usedCreditsMinutes / 480,
      leaveType: b.leaveType.code, // Keep legacy 'leaveType' string property working
      leaveTypeName: b.leaveType.name,
      leaveTypeId: b.leaveTypeId,
      isArchived: !!b.policyIsArchived // Expose to frontend
  }));
};

/**
 * Helper to calculate working days distributed by year (excluding weekends)
 */
const calculateDaysPerYear = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysPerYear = {};

  let current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Exclude Sunday (0) and Saturday (6)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const year = current.getFullYear();
      daysPerYear[year] = (daysPerYear[year] || 0) + 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return daysPerYear;
};

/**
 * Create a new leave request
 */
const createRequest = async (employeeId, data, userRole) => {
  const { leaveTypeId, startDate, endDate, reason, attachmentUrl, duration } = data; 

  // 1. Basic Date Validations
  if (new Date(startDate) > new Date(endDate)) {
    throw new Error("Start date cannot be after end date");
  }

  // No Past Dates (Strict Enterprise Rule)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(startDate) < today) {
     if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') { 
         throw new Error("Leave requests cannot be for past dates."); 
     }
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // 2. Fetch Employee Details
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { 
        officeId: true, 
        firstName: true, 
        lastName: true, 
        employeeIdNumber: true, 
        contracts: { where: {isActive: true}, take:1 },
        user: { select: { id: true } } // Fetch User ID for notifications
    }
  });

  if (!employee) throw new Error("Employee not found");
  if (!employee.officeId) throw new Error("Employee not assigned to an office.");

  // Determine Contract Type
  const contractType = employee.contracts[0]?.type || 'FULL_TIME';

  // 3. POLICY CHECK: Strict Enforcement
  // Must have a policy covering Start Date AND End Date
  const policyStart = await leavePolicyService.getPolicyForDate(employee.officeId, contractType, leaveTypeId, start);
  const policyEnd = await leavePolicyService.getPolicyForDate(employee.officeId, contractType, leaveTypeId, end);

  if (!policyStart) {
      throw new Error(`No leave policy configured for ${start.toDateString()}. Contact HR.`);
  }

  // ARCHIVED CHECK
  if (policyStart.isArchived) {
      throw new Error(`This leave policy (starting ${start.toDateString()}) is archived and no longer accepts new requests.`);
  }
  
  if (start.getTime() !== end.getTime()) {
      if (!policyEnd) {
           throw new Error(`No leave policy configured for ${end.toDateString()}. Contact HR.`);
      }
      if (policyEnd.isArchived) {
          throw new Error(`This leave policy (ending ${end.toDateString()}) is archived and no longer accepts new requests.`);
      }
      if (policyStart.id !== policyEnd.id) {
          throw new Error("Leave request cannot span across two different policy periods (e.g. across years). Please split your request.");
      }
  }

  // Fetch Leave Type
  const leaveTypeObj = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!leaveTypeObj) throw new Error("Invalid Leave Type");
  
  if (leaveTypeObj.officeId !== employee.officeId) {
      throw new Error("Leave Type does not belong to employee's office");
  }

  // Half-Day Validation
  if (duration && duration !== 'FULL_DAY') {
      if (!leaveTypeObj.allowHalfDay) {
          throw new Error(`${leaveTypeObj.name} does not allow half-day requests.`);
      }
      if (new Date(startDate).getTime() !== new Date(endDate).getTime()) {
          throw new Error("Half-day leave must be for a single date");
      }
  }

  // 3. Overlap Check
  const overlappingRequests = await leaveRepository.findOverlappingRequests(employeeId, start, end);
  if (overlappingRequests.length > 0) {
      const status = overlappingRequests[0].status;
      throw new Error(`You already have a ${status} leave request for the selected dates.`);
  }

  // 4. Fetch Public Holidays
  const holidays = await holidayRepository.findHolidays(employee.officeId, start, end);

  // 5. Calculate Effective Days & Validation
  const daysPerYear = {};
  let totalRequestedDays = 0;

  let current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const currentDateStr = current.toISOString().split('T')[0];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Check Holiday
    const holiday = holidays.find(h => {
        const hStart = h.startDate.toISOString().split('T')[0];
        const hEnd = h.endDate.toISOString().split('T')[0];
        return currentDateStr >= hStart && currentDateStr <= hEnd;
    });

    const isFullHoliday = holiday && !holiday.isHalfDay;
    const isHalfHoliday = holiday && holiday.isHalfDay;

    if (!isWeekend && !isFullHoliday) {
       const year = current.getFullYear();
       let dayValue = 1.0;
       
       if (duration !== 'FULL_DAY') {
           dayValue = 0.5;
       } else if (isHalfHoliday) {
           dayValue = 0.5; 
       }

       daysPerYear[year] = (daysPerYear[year] || 0) + dayValue;
       totalRequestedDays += dayValue;
    }
    current.setDate(current.getDate() + 1);
  }

  if (totalRequestedDays === 0) {
    throw new Error("Selected dates are all holidays or non-working days.");
  }

  // 6. Validate Balances (Using Minutes)
  for (const [year, days] of Object.entries(daysPerYear)) {
    const balances = await getBalances(employeeId, parseInt(year));
    // Match by ID now
    const balance = balances.find(b => b.leaveTypeId === leaveTypeId);

    if (!balance) {
      throw new Error(`No balance found for leave type: ${leaveTypeObj.name} in year ${year}`);
    }

    const requestedMinutes = days * 480;
    const availableMinutes = balance.totalCreditsMinutes - balance.usedCreditsMinutes;

    if (availableMinutes < requestedMinutes) {
      throw new Error(`Insufficient leave balance for ${year}. Available: ${availableMinutes/480} days, Requested: ${days} days`);
    }
  }

  // Auto-approve logic for ADMIN
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  
  const status = isAdmin ? "APPROVED" : "PENDING";
  const approverComments = isAdmin ? "System Auto-Approval (Admin Policy)" : undefined;
  const approverId = undefined; 
  const approvedByRole = isAdmin ? "SYSTEM" : undefined;
  const approvalReason = isAdmin ? "AUTO_APPROVED_ADMIN_LEAVE" : undefined;

  const newRequest = await leaveRepository.createLeaveRequest({
    employeeId,
    officeId: employee.officeId, // Store OfficeID
    leaveTypeId,
    startDate: start,
    endDate: end,
    duration: duration || 'FULL_DAY', 
    reason,
    attachmentUrl,
    status,
    approverComments,
    approverId,
    approvedByRole,
    approvalReason
  });

  if (isAdmin) {
    await processApprovalEffects(newRequest);
  } else {
    // Notifications...
    const employeeName = `${employee.firstName} ${employee.lastName}`;
    const employeeReadableId = employee.employeeIdNumber || employeeId; 
    
    notificationService.notifyAdminsAndHR(
        "New Leave Request",
        `Employee ${employeeName} (${employeeReadableId}) has requested ${totalRequestedDays} day(s) of ${leaveTypeObj.name}.`,
        "LEAVE_REQUEST",
        { leaveRequestId: newRequest.id, employeeId, officeId: employee.officeId, link: "/admin/leave-requests", excludeUserId: employee.user?.id }
    ).catch(err => console.error("Failed to send notifications:", err));
  }

  return newRequest;
};

/**
 * Get leave requests with pagination
 * @param {number} page
 * @param {number} limit
 * @param {Object} filters - { employeeId, status, officeId }
 */
const getRequests = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;
  const take = parseInt(limit);

  const requests = await leaveRepository.findLeaveRequests({
    ...filters,
    skip,
    take,
  });

  const total = await leaveRepository.countLeaveRequests(filters);

  return {
    data: requests,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update request status (Approve/Reject)
 */
/**
 * Helper to process approval side-effects (Balance deduction + Attendance creation)
 */
const processApprovalEffects = async (request, tx) => {
  console.log("Processing Approval Effects for Request:", request.id, "TX Present:", !!tx);
  
  const start = new Date(request.startDate);
  const end = new Date(request.endDate);

  // Fetch officeId for holidays (Need employee's officeId)
  // Use repository or prisma directly based on tx
  const employee = await (tx || prisma).employee.findUnique({
    where: { id: request.employeeId },
    select: { officeId: true }
  });

  const holidays = employee?.officeId ? await holidayRepository.findHolidays(employee.officeId, start, end) : [];

  // Calculate days per year involved (excluding weekends/holidays)
  const daysPerYear = {};
  
  let current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const currentDateStr = current.toISOString().split('T')[0];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Check Holiday
    const holiday = holidays.find(h => {
        const hStart = h.startDate.toISOString().split('T')[0];
        const hEnd = h.endDate.toISOString().split('T')[0];
        return currentDateStr >= hStart && currentDateStr <= hEnd;
    });

    const isFullHoliday = holiday && !holiday.isHalfDay;
    const isHalfHoliday = holiday && holiday.isHalfDay;

    if (!isWeekend && !isFullHoliday) {
       const year = current.getFullYear();
       let dayValue = 1.0;
       
       if (request.duration !== 'FULL_DAY') {
           dayValue = 0.5;
       } else if (isHalfHoliday) {
           dayValue = 0.5;
       }

       daysPerYear[year] = (daysPerYear[year] || 0) + dayValue;
    }
    current.setDate(current.getDate() + 1);
  }

  // Deduct from EACH year's balance (Minutes)
  for (const [year, days] of Object.entries(daysPerYear)) {    
    const balances = await leaveRepository.findLeaveBalances(request.employeeId, parseInt(year));
    // Match by LeaveTypeId
    const balance = balances.find(b => b.leaveTypeId === request.leaveTypeId);

    if (balance) {
      const minutesToDeduct = days * 480; 
      await leaveRepository.updateLeaveBalance(balance.id, {
        usedCreditsMinutes: balance.usedCreditsMinutes + minutesToDeduct,
      }, tx);
    }
  }

  // Create Attendance Records for each VALID day
  // Reset current for attendance loop
  current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const currentDateStr = current.toISOString().split('T')[0];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const holiday = holidays.find(h => {
        const hStart = h.startDate.toISOString().split('T')[0];
        const hEnd = h.endDate.toISOString().split('T')[0];
        return currentDateStr >= hStart && currentDateStr <= hEnd;
    });

    const isFullHoliday = holiday && !holiday.isHalfDay;
    // Note: If Half Holiday, we still mark 'ON_LEAVE' or 'HALF_DAY'.
    // If request.duration is FULL_DAY but it's Half Holiday -> Attendance?
    // User: "Holidays automatically mark attendance as: OFF -> full-day holiday, HALF_DAY -> half-day holiday".
    // "If leave exists: Full-day leave -> ON_LEAVE".
    // "Prevent conflicts: No leave on full-day holiday".
    // So if Full Holiday -> We skipped loop above -> No record created here?
    // Wait, `ensureAttendanceRecords` handles Holidays.
    // If I create a record here, it might conflict or overwrite.
    // Ideally, `ensureAttendanceRecords` runs separately or lazily.
    // BUT we are forcing creation here to reflect "ON_LEAVE".
    // If Full Holiday -> we don't want to mark ON_LEAVE. We skip.
    
    if (!isWeekend && !isFullHoliday) {
       const existingRecord = await attendanceRepository.findAttendanceRecord(request.employeeId, current);
    
       if (!existingRecord) {
         // Determine status
         let status = 'ON_LEAVE';
         if (request.duration === 'HALF_DAY_AM' || request.duration === 'HALF_DAY_PM') {
             status = 'HALF_DAY';
         } else if (holiday && holiday.isHalfDay) {
             // Leave on Half Holiday -> Still ON_LEAVE or HALF_DAY? 
             // If I take leave on half-day, effectively I am OFF. 
             // But status should reflect Leave.
             status = 'HALF_DAY'; // As per "Half-day leave -> HALF_DAY"
         }

         await attendanceRepository.createAttendanceRecord({
           employeeId: request.employeeId,
           date: new Date(current),
           status: status,
         }, tx);
       } else {
           // Update existing? (e.g., if auto-generated as ABSENT or something)
           // If existing is present, maybe leave matches?
           // For now, only create if missing.
       }
    }
    
    current.setDate(current.getDate() + 1);
  }
};

/**
 * Update request status (Approve/Reject)
 */
const updateRequestStatus = async (id, status, approverId, approverRole, reason) => {
  const request = await leaveRepository.findLeaveRequestById(id);
  if (!request) {
      throw new Error("Leave request not found");
  }

  if (request.status !== 'PENDING') {
      throw new Error(`Cannot update request that is already ${request.status}`);
  }

  // Enterprise Rule: No Self-Approval (Except for SYSTEM auto-approval which skips this)
  if (approverId && request.employeeId === approverId) {
      throw new Error("Self-approval is not allowed. Please ask another Admin or HR to approve.");
  }

  // Enterprise Rule: HR cannot approve other HR requests (Must be Admin)
  if (approverRole === 'HR') {
      // Need to check the role of the employee who made the request
      // We need to fetch the User associated with the Employee
      const requesterUser = await prisma.user.findFirst({
          where: { employeeId: request.employeeId }
      });
      
      if (requesterUser && (requesterUser.role === 'HR' || requesterUser.role === 'ADMIN' || requesterUser.role === 'SUPER_ADMIN')) {
          throw new Error("HR cannot approve leave requests for other HR/Admin staff. Admin approval required.");
      }
  }

  // Update logic with audit fields
  // If ApproverId is provided, we assume it's an employee
  // If not, it might be System (handled in createRequest mainly, but here for manual)
  
  const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: { 
          status, 
          approverId,
          approvedByRole: approverRole, // "HR" or "ADMIN"
          approvalReason: reason,
          approverComments: reason // Map legacy comment field
      },

      include: { employee: true, leaveType: true }
  });

  if (status === 'APPROVED') {
      await processApprovalEffects(updatedRequest);
      
      // Get User ID for notification
      const userToNotify = await prisma.user.findFirst({ where: { employeeId: updatedRequest.employeeId } });

      if (userToNotify) {
          // Notify Employee
          notificationService.notifyEmployee(
            userToNotify.id,
            "Leave Approved",
            `Your ${updatedRequest.leaveType.name} leave request has been approved.`, // Use name from relation
            "LEAVE_APPROVED",
            { leaveRequestId: id }
          ).catch(console.error);
      }
  } else if (status === 'REJECTED') {
       // Get User ID for notification
       const userToNotify = await prisma.user.findFirst({ where: { employeeId: updatedRequest.employeeId } });
       
       if (userToNotify) {
          // Notify Employee
           notificationService.notifyEmployee(
            userToNotify.id,
            "Leave Rejected",
            `Your ${updatedRequest.leaveType.name} leave request has been rejected.`, // Use name from relation
            "LEAVE_REJECTED",
            { leaveRequestId: id }
          ).catch(console.error);
       }
  }

  return updatedRequest;
};
  


/**
 * Get a single leave request by ID
 */
const getRequestById = async (id) => {
  const request = await leaveRepository.findLeaveRequestById(id);
  if (!request) {
    throw new Error("Leave request not found");
  }
  return request;
};

/**
 * Get leave statistics
 */
const getStats = async (filters) => {
  return await leaveRepository.getLeaveStats(filters);
};

/**
 * Get leave types for an office
 */
const getLeaveTypes = async (officeId) => {
    return await leaveRepository.findLeaveTypes(officeId);
};

module.exports = {
  getBalances,
  createRequest,
  getRequests,
  updateRequestStatus,
  getRequestById,
  getStats,
  getLeaveTypes,
};
