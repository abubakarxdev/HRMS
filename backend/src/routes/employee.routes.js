const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employee.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// VIEW ALL EMPLOYEES
router.get(
  "/employees",
  authMiddleware.protect,
  authMiddleware.allowViewEmployees, // ADMIN_HR, MANAGER, EMPLOYEE
  employeeController.getAllEmployees
);

// VIEW EMPLOYEE BY ID
router.get(
  "/employees/:id",
  authMiddleware.protect,
  authMiddleware.allowViewEmployees,
  employeeController.getEmployeeById
);

// CREATE EMPLOYEE — HR ONLY
router.post(
  "/employees",
  authMiddleware.protect,
  authMiddleware.allowManageEmployees, // ADMIN_HR only
  employeeController.createEmployee
);

// UPDATE EMPLOYEE — HR ONLY
router.put(
  "/employees/:id",
  authMiddleware.protect,
  authMiddleware.allowManageEmployees, // ADMIN_HR only
  employeeController.updateEmployee
);

// DELETE EMPLOYEE — HR ONLY
router.delete(
  "/employees/:id",
  authMiddleware.protect,
  authMiddleware.allowManageEmployees, // ADMIN_HR only
  employeeController.deleteEmployee
);

module.exports = router;
