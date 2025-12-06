const prisma = require("../config/prisma");

/**
 * Find leave balances for an employee for a specific year
 */
const findLeaveBalances = async (employeeId, year) => {
  try {
    return await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year,
      },
    });
  } catch (error) {
    throw new Error(`Error finding leave balances: ${error.message}`);
  }
};

/**
 * Create a leave balance record
 */
const createLeaveBalance = async (data) => {
  try {
    return await prisma.leaveBalance.create({
      data,
    });
  } catch (error) {
    throw new Error(`Error creating leave balance: ${error.message}`);
  }
};

/**
 * Update a leave balance record
 */
const updateLeaveBalance = async (id, data) => {
  try {
    return await prisma.leaveBalance.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw new Error(`Error updating leave balance: ${error.message}`);
  }
};

/**
 * Create a leave request
 */
const createLeaveRequest = async (data) => {
  try {
    return await prisma.leaveRequest.create({
      data,
    });
  } catch (error) {
    throw new Error(`Error creating leave request: ${error.message}`);
  }
};

/**
 * Find leave requests with filtering and pagination
 */
const findLeaveRequests = async ({ employeeId, status, skip, take } = {}) => {
  try {
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (status && status !== 'all') where.status = status;

    return await prisma.leaveRequest.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeIdNumber: true,
            avatarUrl: true,
          },
        },
      },
    });
  } catch (error) {
    throw new Error(`Error finding leave requests: ${error.message}`);
  }
};

/**
 * Count leave requests matching filters
 */
const countLeaveRequests = async ({ employeeId, status } = {}) => {
  try {
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (status && status !== 'all') where.status = status;

    return await prisma.leaveRequest.count({ where });
  } catch (error) {
    throw new Error(`Error counting leave requests: ${error.message}`);
  }
};

/**
 * Find leave request by ID
 */
const findLeaveRequestById = async (id) => {
  try {
    return await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeIdNumber: true,
            workEmail: true,
          },
        },
      },
    });
  } catch (error) {
    throw new Error(`Error finding leave request by ID: ${error.message}`);
  }
};

/**
 * Update leave request
 */
const updateLeaveRequest = async (id, data) => {
  try {
    return await prisma.leaveRequest.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw new Error(`Error updating leave request: ${error.message}`);
  }
};

module.exports = {
  findLeaveBalances,
  createLeaveBalance,
  updateLeaveBalance,
  createLeaveRequest,
  findLeaveRequests,
  countLeaveRequests,
  findLeaveRequestById,
  updateLeaveRequest,
};
