const prisma = require('../config/prisma');

const createHoliday = async (data) => {
  return await prisma.publicHoliday.create({
    data,
  });
};

const findHolidays = async (officeId, startDate, endDate) => {
  return await prisma.publicHoliday.findMany({
    where: {
      officeId,
      // Overlap check: Holiday Start <= Range End AND Holiday End >= Range Start
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    orderBy: { startDate: 'asc' },
  });
};

const getHolidaysPaginated = async ({ officeId, page = 1, limit = 10, search, year }) => {
    const skip = (page - 1) * limit;
    const where = { officeId };

    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }

    if (year) {
        const startOfYear = new Date(`${year}-01-01`);
        const endOfYear = new Date(`${year}-12-31`);
        where.startDate = { gte: startOfYear, lte: endOfYear };
    }

    const [data, total] = await Promise.all([
        prisma.publicHoliday.findMany({
            where,
            skip,
            take: parseInt(limit),
            orderBy: { startDate: 'asc' }
        }),
        prisma.publicHoliday.count({ where })
    ]);

    return {
        data,
        meta: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        }
    };
};

const findHolidayById = async (id) => {
  return await prisma.publicHoliday.findUnique({
    where: { id },
  });
};

const updateHoliday = async (id, data) => {
  return await prisma.publicHoliday.update({
    where: { id },
    data,
  });
};

const deleteHoliday = async (id) => {
  return await prisma.publicHoliday.delete({
    where: { id },
    data: undefined // Ensure no extra arg if that was the issue, but standard delete takes check.
  }); 
};

const findAllHolidaysByOffice = async (officeId) => {
    return await prisma.publicHoliday.findMany({
        where: { officeId },
        orderBy: { startDate: 'asc' }
    });
};


module.exports = {
  createHoliday,
  findHolidays,
  getHolidaysPaginated,
  findHolidayById,
  updateHoliday,
  deleteHoliday,
  findAllHolidaysByOffice
};
