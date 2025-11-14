const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');

// Mount auth routes
router.use('/auth', authRoutes);


// Placeholder for future routes
// const employeeRoutes = require('./employee.routes');
// router.use('/employees', employeeRoutes);

module.exports = router;
