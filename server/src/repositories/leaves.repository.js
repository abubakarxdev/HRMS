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
const updateLeaveBalance = async (id, data, tx = prisma) => {
  try {
    return await tx.leaveBalance.update({
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
const findLeaveRequests = async ({ employeeId, status, officeId, startDate, endDate, skip, take } = {}) => {
  try {
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (status && status !== 'all') where.status = status;
    if (officeId) {
      where.employee = {
        officeId: officeId
      };
    }
    
    // Date Filtering: Find leaves that overlap with the selected range
    // Logic: (Request Start <= Filter End) AND (Request End >= Filter Start)
    if (startDate && endDate) {
      where.AND = [
        { startDate: { lte: new Date(endDate) } },
        { endDate: { gte: new Date(startDate) } }
      ];
    } else if (startDate) {
        // If only start date provided, show leaves starting on or after
        where.startDate = { gte: new Date(startDate) };
    }

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
            officeId: true, // Useful for frontend to know
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
const countLeaveRequests = async ({ employeeId, status, officeId, startDate, endDate } = {}) => {
  try {
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (status && status !== 'all') where.status = status;
    if (officeId) {
      where.employee = {
        officeId: officeId
      };
    }

    // Date Filtering (Same logic as find)
    if (startDate && endDate) {
        where.AND = [
          { startDate: { lte: new Date(endDate) } },
          { endDate: { gte: new Date(startDate) } }
        ];
      } else if (startDate) {
          where.startDate = { gte: new Date(startDate) };
      }

    return await prisma.leaveRequest.count({ where });
  } catch (error) {
    throw new Error(`Error counting leave requests: ${error.message}`);
  }
};

/**
 * Find overlapping approved leave requests
 */
const findOverlappingRequests = async (employeeId, startDate, endDate) => {
  return await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: { in: ['Approved', 'Pending'] },
      OR: [
        {
          // Case 1: Existing start date is within new range
          startDate: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          // Case 2: Existing end date is within new range
          endDate: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          // Case 3: New range is fully contained within existing range
          startDate: {
            lte: startDate
          },
          endDate: {
            gte: endDate
          }
        }
      ]
    }
  });
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
const updateLeaveRequest = async (id, data, tx = prisma) => {
  try {
    return await tx.leaveRequest.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw new Error(`Error updating leave request: ${error.message}`);
  }
};

/**
 * Get leave statistics grouped by status
 */
const getLeaveStats = async ({ employeeId, officeId, startDate, endDate } = {}) => {
  try {
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (officeId) {
      where.employee = {
        officeId: officeId
      };
    }
    
    // Apply date filters if present
    if (startDate && endDate) {
      where.AND = [
        { startDate: { lte: new Date(endDate) } },
        { endDate: { gte: new Date(startDate) } }
      ];
    } else if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }

    const stats = await prisma.leaveRequest.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      }
    });

    // Transform into a friendly object { Pending: 5, Approved: 10, ... }
    const result = {
      Pending: 0,
      Approved: 0,
      Rejected: 0
    };

    stats.forEach(group => {
      const statusKey = group.status.charAt(0).toUpperCase() + group.status.slice(1);
      if (result[statusKey] !== undefined) {
        result[statusKey] = group._count.status;
      }
    });

    return result;
  } catch (error) {
    throw new Error(`Error getting leave stats: ${error.message}`);
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
  findOverlappingRequests,
  getLeaveStats,
};
