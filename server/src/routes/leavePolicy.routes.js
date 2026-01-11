const express = require('express');
const router = express.Router();
const leavePolicyController = require('../controllers/leavePolicy.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(protect);

// View Policies: Admin & HR
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'HR'), leavePolicyController.getPolicies);

// Create: Admin & HR
router.post('/', authorize('ADMIN', 'SUPER_ADMIN', 'HR'), leavePolicyController.createPolicy);

// Get available policy years (Dynamic) - Must be before /:id routes
router.get('/years', authorize('ADMIN', 'SUPER_ADMIN', 'HR'), leavePolicyController.getPolicyYears);

// Update: Admin & HR
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'HR'), leavePolicyController.updatePolicy);

// Delete: Admin Only (Service layer also checks, but good to block here too for clarity)
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), leavePolicyController.deletePolicy);

module.exports = router;
