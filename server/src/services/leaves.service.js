const leaveRepository = require("../repositories/leaves.repository");
const attendanceRepository = require("../repositories/attendance.repository");
const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const notificationService = require("./notification.service");

const DEFAULT_LEAVE_QUOTAS = {
  Sick: 10,
  Annual: 14,
  Casual: 8,
};

/**
 * Get leave balances for an employee, initializing if necessary for the specific year
 */
const getBalances = async (employeeId, year = new Date().getFullYear()) => {
  const targetYear = parseInt(year);
  let balances = await leaveRepository.findLeaveBalances(employeeId, targetYear);

  if (balances.length === 0) {
    // Fetch settings or use defaults
    // For now, we'll just use the hardcoded defaults
    const quotas = DEFAULT_LEAVE_QUOTAS;

    // Initialize defaults for the requested year
    const promises = Object.entries(quotas).map(([type, total]) => {
      return leaveRepository.createLeaveBalance({
        employeeId,
        year: targetYear,
        leaveType: type,
        totalCredits: total,
        usedCredits: 0,
      });
    });

    balances = await Promise.all(promises);
  }

  return balances;
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
  const { leaveType, startDate, endDate, reason, attachmentUrl } = data;

  if (new Date(startDate) > new Date(endDate)) {
    throw new Error("Start date cannot be after end date");
  }

  // Calculate requested days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysPerYear = calculateDaysPerYear(start, end);

  // Validate balance for EACH year involved
  for (const [year, days] of Object.entries(daysPerYear)) {
    const balances = await getBalances(employeeId, parseInt(year));
    const balance = balances.find(b => b.leaveType === leaveType);

    if (!balance) {
      throw new Error(`No balance found for leave type: ${leaveType} in year ${year}`);
    }

    if (balance.totalCredits - balance.usedCredits < days) {
      throw new Error(`Insufficient leave balance for ${year}. Available: ${balance.totalCredits - balance.usedCredits}, Requested: ${days}`);
    }
  }

  // Auto-approve for Admin/Super Admin
  const isAutoApproved = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
  const status = isAutoApproved ? "Approved" : "Pending";
  const approverComments = isAutoApproved ? "Auto-approved (Self)" : undefined;
  const approverId = isAutoApproved ? employeeId : undefined;

  const newRequest = await leaveRepository.createLeaveRequest({
    employeeId,
    leaveType,
    startDate: start,
    endDate: end,
    reason,
    attachmentUrl,
    status,
    approverComments,
    approverId
  });

  if (isAutoApproved) {
    await processApprovalEffects(newRequest);
  }

  // Calculate days for notification message
  const daysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Fetch employee details for friendly notification
  const employeeDetails = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { firstName: true, lastName: true, employeeIdNumber: true, officeId: true }
  });

  const employeeName = employeeDetails ? `${employeeDetails.firstName} ${employeeDetails.lastName}` : "Unknown Employee";
  const employeeReadableId = employeeDetails?.employeeIdNumber || employeeId; 

  // Trigger Notification for Admins/HR
  // We do this asynchronously so it doesn't block the request response
  notificationService.notifyAdminsAndHR(
    "New Leave Request",
    `Employee ${employeeName} (${employeeReadableId}) has requested ${daysRequested} day(s) of ${leaveType} leave.`,
    "LEAVE_REQUEST",
    {
      leaveRequestId: newRequest.id,
      employeeId,
      officeId: employeeDetails?.officeId,
      link: "/admin/leave-requests", // Fallback default
    }
  ).catch(err => console.error("Failed to send notifications:", err));

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
  // Calculate days per year for split deduction
  const daysPerYear = calculateDaysPerYear(request.startDate, request.endDate);

  // Deduct from EACH year's balance
  for (const [year, days] of Object.entries(daysPerYear)) {
    const balances = await getBalances(request.employeeId, parseInt(year));
    const balance = balances.find(b => b.leaveType === request.leaveType);

    if (balance) {
      await leaveRepository.updateLeaveBalance(balance.id, {
        usedCredits: balance.usedCredits + days,
      }, tx);
    }
  }

  // Create Attendance Records for each day
  // Explicitly define start and end to avoid ReferenceError
  const start = new Date(request.startDate);
  const end = new Date(request.endDate);
  
  console.log("Generating Attendance from:", start, "to", end);

  const currentDate = new Date(start);
  while (currentDate <= end) {
    const existingRecord = await attendanceRepository.findAttendanceRecord(request.employeeId, currentDate);
    
    if (!existingRecord) {
      await attendanceRepository.createAttendanceRecord({
        employeeId: request.employeeId,
        date: new Date(currentDate),
        status: 'ON_LEAVE',
      }, tx);
    } else {
      // Optional: Update existing record status if needed
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }
};

/**
 * Update request status (Approve/Reject)
 */
const updateRequestStatus = async (id, status, approverComments, approverId, approverRole) => {
  const request = await leaveRepository.findLeaveRequestById(id);
  if (!request) {
    throw new Error("Leave request not found");
  }

  // Segregation of duties: Prevent self-approval
  if (approverId && request.employeeId === approverId) {
    throw new Error("You cannot approve your own leave request.");
  }
  
  // Security Policy: Only Admin/Super Admin can approve HR leave requests
  // We need to check if the requester (request.employeeId) is an HR
  const requesterUser = await prisma.user.findFirst({ where: { employeeId: request.employeeId } });
  
  if (requesterUser && requesterUser.role === 'HR') {
      if (!['ADMIN', 'SUPER_ADMIN'].includes(approverRole)) {
          throw new Error("Policy: HR leave requests can only be reviewed by an Admin or Super Admin.");
      }
  }

  // Use a transaction to ensure atomicity
  const updatedRequest = await prisma.$transaction(async (tx) => {
    // Only process effects if moving TO Approved state
    if (status === "Approved" && request.status !== "Approved") {
      await processApprovalEffects(request, tx);
    }

    return await leaveRepository.updateLeaveRequest(id, {
      status,
      approverComments,
      approverId,
    }, tx);
  });

  // Notify Employee (if approved or rejected)
  if (["Approved", "Rejected"].includes(status)) {
    // Find User ID for Employee
    const employeeUser = await prisma.user.findFirst({
        where: { employeeId: request.employeeId },
        select: { id: true }
    });

    if (employeeUser) {
        notificationService.notifyEmployee(
            employeeUser.id,
            `Leave Request ${status}`,
            `Your ${request.leaveType} leave request for ${new Date(request.startDate).toDateString()} has been ${status}.`,
            "LEAVE_STATUS_UPDATE",
            {
                leaveRequestId: request.id,
                status,
                link: "/leaves"
            }
        ).catch(err => console.error("Failed to notify employee:", err));
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

module.exports = {
  getBalances,
  createRequest,
  getRequests,
  updateRequestStatus,
  getRequestById,
};
