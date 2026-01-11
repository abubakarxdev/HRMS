const holidayService = require('../services/holiday.service');

const createHoliday = async (req, res, next) => {
  try {
    const { officeId } = req.user; // Or from body if Super Admin managing multiple offices
    // For now, assume Admin manages their own office or passed in body
    const targetOfficeId = req.body.officeId || req.user.officeId || req.user.employee?.officeId;

    if (!targetOfficeId) {
        return res.status(400).json({ message: "Office ID is required" });
    }

    const holiday = await holidayService.createHoliday(targetOfficeId, req.body);
    res.status(201).json(holiday);
  } catch (error) {
    next(error);
  }
};

const getHolidays = async (req, res, next) => {
  try {
    const targetOfficeId = req.query.officeId || req.user.officeId || req.user.employee?.officeId;
    if (!targetOfficeId) {
        return res.status(400).json({ message: "Office ID is required" });
    }
    const holidays = await holidayService.getHolidays(targetOfficeId, req.query);
    res.json(holidays);
  } catch (error) {
    next(error);
  }
};

const updateHoliday = async (req, res, next) => {
  try {
    const updated = await holidayService.updateHoliday(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteHoliday = async (req, res, next) => {
  try {
    await holidayService.deleteHoliday(req.params.id);
    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
};
