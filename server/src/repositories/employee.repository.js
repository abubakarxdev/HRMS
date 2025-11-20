const prisma = require("../config/prisma");

/**
 * Repository functions for direct database interaction via Prisma.
 */

const getAllEmployees = async () => {
  return prisma.user.findMany({
    where: {
      role: {
        in: ["EMPLOYEE", "ADMIN_HR", "MANAGER"],
      },
    },
  });
};

const getEmployeeById = async (id) => {
  return prisma.user.findUnique({
    where: {
      id: parseInt(id, 10), // Ensure ID is parsed as integer for Prisma
    },
  });
};

const createEmployee = async (employeeData) => {
  return prisma.user.create({
    data: employeeData,
  });
};

const updateEmployee = async (id, employeeData) => {
  return prisma.user.update({
    where: {
      id: parseInt(id, 10), // Ensure ID is parsed as integer
    },
    data: employeeData,
  });
};

const deleteEmployee = async (id) => {
  return prisma.user.delete({
    where: {
      id: parseInt(id, 10), // Ensure ID is parsed as integer
    },
  });
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
