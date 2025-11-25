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
      employeeId: id, // Query by employeeId string field
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
      id: id,
    },
    data: employeeData,
  });
};

const deleteEmployee = async (id) => {
  return prisma.user.delete({
    where: {
      id: id,
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
