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
  let { officeId, page, limit, search, role: roleFilter, department, status } = req.query;
  const { role } = req.user;

  // Strict Data Isolation: Employees and HR can ONLY view employees from their own office
  if (role === 'EMPLOYEE' || role === 'HR') {
      const userOfficeId = req.user.employee?.officeId;
      if (userOfficeId) {
          officeId = userOfficeId;
      } else {
          // Return empty paginated structure if no office assigned
          return res.status(200).json({ 
              data: [], 
              meta: { total: 0, page: 1, limit: 10, totalPages: 0 } 
          });
      }
  }

  const result = await employeeService.getAllEmployees(officeId, {
      page,
      limit,
      search,
      role: roleFilter,
      department,
      status
  });
  
  res.status(200).json(result);
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
  const requesterRole = req.user.role; // Assuming auth middleware attaches user

  // Prevent HR from creating restricted accounts (Admin, Super Admin, or other HRs)
  if (requesterRole === 'HR' && ['ADMIN', 'SUPER_ADMIN', 'HR'].includes(employeeData.role)) {
      return res.status(403).json({ message: "HR cannot create Admin, Super Admin, or HR accounts." });
  }

  // Prevent Admin from creating Super Admin
  if (requesterRole === 'ADMIN' && employeeData.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Admin cannot create Super Admin accounts." });
  }

  // Enforce Office ID for HR
  if (requesterRole === 'HR') {
      const userOfficeId = req.user.employee?.officeId;
      if (!userOfficeId) {
          return res.status(400).json({ message: "HR account does not have an assigned office. Cannot create employee." });
      }
      employeeData.officeId = userOfficeId;
  }

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
  const requesterRole = req.user.role;

  // Prevent HR from promoting to restricted roles
  if (requesterRole === 'HR' && ['ADMIN', 'SUPER_ADMIN', 'HR'].includes(employeeData.role)) {
      return res.status(403).json({ message: "HR cannot assign Admin, Super Admin, or HR role." });
  }

  // Prevent Admin from promoting to Super Admin
  if (requesterRole === 'ADMIN' && employeeData.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Admin cannot assign Super Admin role." });
  }

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
