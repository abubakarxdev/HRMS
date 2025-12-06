const leaveRepository = require("../repositories/leaves.repository");
const attendanceRepository = require("../repositories/attendance.repository");
const { Prisma } = require("@prisma/client");

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
const createRequest = async (employeeId, data) => {
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

  return await leaveRepository.createLeaveRequest({
    employeeId,
    leaveType,
    startDate: start,
    endDate: end,
    reason,
    attachmentUrl,
    status: "Pending",
  });
};

/**
 * Get leave requests with pagination
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
const updateRequestStatus = async (id, status, managerComments) => {
  const request = await leaveRepository.findLeaveRequestById(id);
  if (!request) {
    throw new Error("Leave request not found");
  }

  if (status === "Approved" && request.status !== "Approved") {
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
  }

  return await leaveRepository.updateLeaveRequest(id, {
    status,
    managerComments,
  });
};

module.exports = {
  getBalances,
  createRequest,
  getRequests,
  updateRequestStatus,
};
