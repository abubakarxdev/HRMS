const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employee.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// VIEW ALL EMPLOYEES
router.get(
  "/employees",
  authMiddleware.protect,
  authMiddleware.allowViewEmployees, // ADMIN, HR, FINANCE, EMPLOYEE
  employeeController.getAllEmployees
);

// VIEW EMPLOYEE BY ID
router.get(
  "/employees/:id",
  authMiddleware.protect,
  authMiddleware.allowViewEmployees,
  employeeController.getEmployeeById
);

// CREATE EMPLOYEE — ADMIN & HR
router.post(
  "/employees",
  authMiddleware.protect,
  authMiddleware.allowManageEmployees, // ADMIN, HR
  employeeController.createEmployee
);

// UPDATE EMPLOYEE — ADMIN & HR
router.put(
  "/employees/:id",
  authMiddleware.protect,
  authMiddleware.allowManageEmployees, // ADMIN, HR
  employeeController.updateEmployee
);

// DELETE EMPLOYEE — ADMIN & HR
router.delete(
  "/employees/:id",
  authMiddleware.protect,
  authMiddleware.allowManageEmployees, // ADMIN, HR
  employeeController.deleteEmployee
);

module.exports = router;
