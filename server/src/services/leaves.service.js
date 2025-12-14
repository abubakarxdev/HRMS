const leaveRepository = require("../repositories/leaves.repository");
const attendanceRepository = require("../repositories/attendance.repository");
const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");

const DEFAULT_LEAVE_QUOTAS = {
  Sick: 10,
  Annual: 14,
  Casual: 8,
};

/**
 * Get leave balances for an employee, initializing if necessary
 */
const getBalances = async (employeeId) => {
  const currentYear = new Date().getFullYear();
  let balances = await leaveRepository.findLeaveBalances(employeeId, currentYear);

  if (balances.length === 0) {
    // Fetch settings or use defaults
    // For now, we'll just use the hardcoded defaults as per request, 
    // but structure it to be easily replaceable with DB fetch later.
    // Ideally: const settings = await leaveRepository.getLeaveSettings(companyId);
    
    const quotas = DEFAULT_LEAVE_QUOTAS;

    // Initialize defaults
    const promises = Object.entries(quotas).map(([type, total]) => {
      return leaveRepository.createLeaveBalance({
        employeeId,
        year: currentYear,
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
  const diffTime = Math.abs(end - start);
  const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Check balance
  const currentYear = start.getFullYear();
  const balances = await getBalances(employeeId);
  const balance = balances.find(b => b.leaveType === leaveType);

  if (!balance) {
    throw new Error(`No balance found for leave type: ${leaveType}`);
  }

  if (balance.totalCredits - balance.usedCredits < requestedDays) {
    throw new Error(`Insufficient leave balance. Available: ${balance.totalCredits - balance.usedCredits}, Requested: ${requestedDays}`);
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
const processApprovalEffects = async (request) => {
  // Calculate days
  const start = new Date(request.startDate);
  const end = new Date(request.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Update balance
  const currentYear = start.getFullYear();
  const balances = await leaveRepository.findLeaveBalances(request.employeeId, currentYear);
  const balance = balances.find(b => b.leaveType === request.leaveType);

  if (balance) {
    await leaveRepository.updateLeaveBalance(balance.id, {
      usedCredits: balance.usedCredits + diffDays,
    });
  }

  // Create Attendance Records for each day
  const currentDate = new Date(start);
  while (currentDate <= end) {
    // Check if record exists
    const existingRecord = await attendanceRepository.findAttendanceRecord(request.employeeId, currentDate);
    
    if (!existingRecord) {
      await attendanceRepository.createAttendanceRecord({
        employeeId: request.employeeId,
        date: new Date(currentDate),
        status: 'ON_LEAVE',
      });
    } else {
      // Optional: Update existing record status if needed
      // await attendanceRepository.updateAttendanceRecord(existingRecord.id, { status: 'ON_LEAVE' });
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

  if (status === "Approved" && request.status !== "Approved") {
    await processApprovalEffects(request);
  }

  return await leaveRepository.updateLeaveRequest(id, {
    status,
    approverComments,
    approverId,
  });
};

module.exports = {
  getBalances,
  createRequest,
  getRequests,
  updateRequestStatus,
};
