const holidayRepository = require('../repositories/holiday.repository');

const createHoliday = async (officeId, data) => {
  const { startDate, endDate, name, description, isOptional, isHalfDay } = data;

  if (new Date(startDate) > new Date(endDate)) {
    throw new Error('Start date cannot be after end date.');
  }

  // Check for conflicts
  // We check if any existing holiday overlaps with the new range
  const existingHolidays = await holidayRepository.findHolidays(officeId, new Date(startDate), new Date(endDate));
  
  if (existingHolidays.length > 0) {
      throw new Error(`Holiday overlaps with existing holiday: ${existingHolidays[0].name}`);
  }

  return await holidayRepository.createHoliday({
    officeId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    name,
    description,
    isOptional: isOptional || false,
    isHalfDay: isHalfDay || false,
  });
};

const getHolidays = async (officeId, query = {}) => {
  const { page, limit, search, year } = query;
  if (page || limit || search || year) {
      return await holidayRepository.getHolidaysPaginated({ officeId, page, limit, search, year });
  }
  return await holidayRepository.findAllHolidaysByOffice(officeId);
};

const updateHoliday = async (id, data) => {
  const { startDate, endDate, name, description, isOptional, isHalfDay, officeId } = data; // officeId might change? Usually not.

  // if start/end dates are changing, validate overlap with others
  // Need to find existing holiday first to get officeId if not passed
  const existing = await holidayRepository.findHolidayById(id);
  if (!existing) throw new Error("Holiday not found");

  if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('Start date cannot be after end date.');
      }
      
      // Check overlaps
      const overlaps = await holidayRepository.findHolidays(existing.officeId, new Date(startDate), new Date(endDate));
      // Exclude self from overlaps
      const conflict = overlaps.find(h => h.id !== id);
      if (conflict) {
          throw new Error(`Holiday overlaps with existing holiday: ${conflict.name}`);
      }
  }

  return await holidayRepository.updateHoliday(id, {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    name,
    description,
    isOptional,
    isHalfDay
  });
};

const deleteHoliday = async (id) => {
  return await holidayRepository.deleteHoliday(id);
};

module.exports = {
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
};
