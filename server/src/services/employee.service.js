const employeeRepository = require("../repositories/employee.repository");
const bcrypt = require("bcryptjs");

/**
 * Helper function to generate a simple unique employee ID (EMP-XXXXXX)
 */
const generateUniqueId = () =>
  "EMP-" + Math.random().toString(36).substring(2, 10).toUpperCase();

/**
 * Service functions for Employee business logic.
 */

const getAllEmployees = async () => {
  return await employeeRepository.getAllEmployees();
};

const getEmployeeById = async (id) => {
  return await employeeRepository.getEmployeeById(id);
};

const createEmployee = async (employeeData) => {
  // Hash the password before sending it to the repository
  if (!employeeData.password) {
    throw new Error("Password is required for new employee creation.");
  }

  const { password, hireDate, ...rest } = employeeData;

  const passwordHash = await bcrypt.hash(password, 10);

  // Generate a unique employeeId
  const newEmployeeId = generateUniqueId();

  // Convert hireDate string (YYYY-MM-DD) into a valid Date object for Prisma.
  const parsedHireDate = hireDate ? new Date(hireDate) : undefined;

  const newEmployee = {
    ...rest,
    passwordHash,
    employeeId: newEmployeeId,
    hireDate: parsedHireDate,
  };

  try {
    return await employeeRepository.createEmployee(newEmployee);
  } catch (error) {
    // P2002 is the error code for Unique Constraint Violation in Prisma
    if (error.code === "P2002" && error.meta?.target.includes("email")) {
      // Throw a specific error that the frontend can display clearly
      throw new Error(
        `The email address "${newEmployee.email}" is already in use by another employee.`
      );
    }
    // Re-throw any other errors (DB connection, validation, etc.)
    throw error;
  }
};

const updateEmployee = async (id, employeeData) => {
  const { password, hireDate, ...rest } = employeeData;

  // Only hash and update the password if it's provided in the payload
  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    rest.passwordHash = passwordHash;
  }

  // Convert hireDate if it exists in the update payload
  if (hireDate) {
    rest.hireDate = new Date(hireDate);
  }

  // The 'rest' object contains all updateable fields including nid and bankDetails.
  try {
    return await employeeRepository.updateEmployee(id, rest);
  } catch (error) {
    // Optional: Add P2002 check for update logic as well
    if (error.code === "P2002" && error.meta?.target.includes("email")) {
      throw new Error(
        `The email address "${rest.email}" is already in use by another employee.`
      );
    }
    throw error;
  }
};

const deleteEmployee = async (id) => {
  return await employeeRepository.deleteEmployee(id);
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
