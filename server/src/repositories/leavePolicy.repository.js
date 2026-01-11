const prisma = require('../config/prisma');

/**
 * Create a new leave policy
 */
const create = async (data) => {
  return await prisma.leavePolicy.create({
    data
  });
};

/**
 * Find policies matching filters
 */
const findAll = async ({ officeId, year, contractType }) => {
  const where = {};

  if (officeId) where.officeId = officeId;
  if (contractType) where.contractType = contractType;
  
  // If year is provided, find policies active in that year
  if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      
      where.OR = [
          // Starts within year
          { AND: [{ effectiveFrom: { gte: startOfYear } }, { effectiveFrom: { lte: endOfYear } }] },
          // Ends within year
          { AND: [{ effectiveTo: { gte: startOfYear } }, { effectiveTo: { lte: endOfYear } }] },
          // Spans entire year (Starts before and Ends after)
          { AND: [{ effectiveFrom: { lte: startOfYear } }, { effectiveTo: { gte: endOfYear } }] }
      ];
  }

  return await prisma.leavePolicy.findMany({
    where,
    include: {
      leaveType: true,
      office: { select: { name: true } }
    },
    orderBy: { effectiveFrom: 'desc' }
  });
};

/**
 * Find overlapping policies for validation
 * Scoped to Office + Contract + LeaveType
 */
const findOverlappingPolicies = async (officeId, contractType, leaveTypeId, startDate, endDate, excludeId = null) => {
  const where = {
    officeId,
    contractType,
    leaveTypeId,
    // Overlap: (StartA <= EndB) and (EndA >= StartB)
    effectiveFrom: { lte: endDate },
    effectiveTo: { gte: startDate }
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  return await prisma.leavePolicy.findMany({ where });
};

/**
 * Find active policy for a specific date
 */
const findPolicyForDate = async (officeId, contractType, leaveTypeId, date) => {
    return await prisma.leavePolicy.findFirst({
        where: {
            officeId,
            contractType,
            leaveTypeId,
            effectiveFrom: { lte: date },
            effectiveTo: { gte: date }
        }
    });
};

const findById = async (id) => {
  return await prisma.leavePolicy.findUnique({ where: { id } });
};

const update = async (id, data) => {
  return await prisma.leavePolicy.update({
    where: { id },
    data
  });
};

const deletePolicy = async (id) => {
  return await prisma.leavePolicy.delete({ where: { id } });
};

/**
 * Find distinct years metadata for dropdown
 */
const findDistinctYears = async (officeId) => {
    return await prisma.leavePolicy.findMany({
        where: { officeId },
        select: {
            effectiveFrom: true,
            isArchived: true
        },
        orderBy: {
            effectiveFrom: 'asc'
        }
    });
};

module.exports = {
  create,
  findAll,
  findOverlappingPolicies,
  findPolicyForDate,
  findById,
  update,
  delete: deletePolicy,
  findDistinctYears
};
