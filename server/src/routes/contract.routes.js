const express = require("express");
const router = express.Router();
const contractController = require("../controllers/contract.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(protect);

// List all contracts (Admin/HR)
router.get(
    "/", 
    authorize('SUPER_ADMIN', 'ADMIN', 'HR'), 
    contractController.getAllContracts
);

// Get contracts for specific employee
router.get(
    "/employee/:employeeId", 
    // Allow employee to see own contracts? Maybe later. For now Admin/HR.
    authorize('SUPER_ADMIN', 'ADMIN', 'HR'), 
    contractController.getEmployeeContracts
);

// Create Contract
router.post(
    "/", 
    authorize('SUPER_ADMIN', 'ADMIN', 'HR'), 
    contractController.createContract
);

// Update Contract
router.put(
    "/:id", 
    authorize('SUPER_ADMIN', 'ADMIN', 'HR'), 
    contractController.updateContract
);

// Delete Contract
router.delete(
    "/:id", 
    authorize('SUPER_ADMIN', 'ADMIN', 'HR'), 
    contractController.deleteContract
);

module.exports = router;
