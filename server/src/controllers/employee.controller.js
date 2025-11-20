const employeeService = require("../services/employee.service");

// Helper function for error handling (recommended in Express)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Controller function to get all employees.
 * Route: GET /api/employees
 */
const getAllEmployees = asyncHandler(async (req, res) => {
  const employees = await employeeService.getAllEmployees();
  res.status(200).json(employees);
});

/**
 * get an employee by ID.
 * Route: GET /api/employees/:id
 */
const getEmployeeById = asyncHandler(async (req, res) => {
  const employeeId = req.params.id;
  const employee = await employeeService.getEmployeeById(employeeId);

  if (!employee) {
    return res
      .status(404)
      .json({ message: `Employee with ID ${employeeId} not found.` });
  }

  res.status(200).json(employee);
});

/**
 * create a new employee.
 * Route: POST /api/employees
 */
const createEmployee = asyncHandler(async (req, res) => {
  const employeeData = req.body;
  try {
    const newEmployee = await employeeService.createEmployee(employeeData);
    // 201 Created status
    res.status(201).json(newEmployee);
  } catch (error) {
    // Check for the custom error message thrown by the service layer for duplicate email
    if (error.message.includes("already in use by another employee")) {
      // Send 409 Conflict
      return res.status(409).json({ message: error.message });
    }

    throw error;
  }
});

/**
 * update an existing employee.
 * Route: PUT /api/employees/:id
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const employeeId = req.params.id;
  const employeeData = req.body;

  try {
    const updatedEmployee = await employeeService.updateEmployee(
      employeeId,
      employeeData
    );

    if (!updatedEmployee) {
      return res.status(404).json({
        message: `Employee with ID ${employeeId} not found for update.`,
      });
    }

    res.status(200).json(updatedEmployee);
  } catch (error) {
    // Check for the custom error message thrown by the service layer for duplicate email on update
    if (error.message.includes("already in use by another employee")) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * delete an employee.
 * Route: DELETE /api/employees/:id
 */
const deleteEmployee = asyncHandler(async (req, res) => {
  const employeeId = req.params.id;

  // Service layer handles the deletion
  await employeeService.deleteEmployee(employeeId);

  // 204 No Content for successful deletion
  res.status(204).send();
});

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
