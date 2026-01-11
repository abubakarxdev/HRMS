const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holiday.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(protect);

// List Holidays (Accessible by all authenticated users)
router.get('/', holidayController.getHolidays);

// Management Routes (Admin/HR only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN', 'HR'), holidayController.createHoliday);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'HR'), holidayController.deleteHoliday);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'HR'), holidayController.updateHoliday);

module.exports = router;
