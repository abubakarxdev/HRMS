const employeeRepository = require("../repositories/employee.repository");
const bcrypt = require("bcryptjs");

const getAllEmployees = async () => {
  return await employeeRepository.getAllEmployees();
};

const getEmployeeById = async (id) => {
  return await employeeRepository.getEmployeeById(id);
};

const createEmployee = async (employeeData) => {
  const { password, ...rest } = employeeData;
  const passwordHash = await bcrypt.hash(password, 10);

  const newEmployee = {
    ...rest,
    passwordHash,
  };

  return await employeeRepository.createEmployee(newEmployee);
};

const updateEmployee = async (id, employeeData) => {
  const { password, ...rest } = employeeData;

  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    rest.passwordHash = passwordHash;
  }

  return await employeeRepository.updateEmployee(id, rest);
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
