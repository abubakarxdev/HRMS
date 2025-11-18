const prisma = require("../config/prisma");

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
      id: parseInt(id, 10),
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
      id: parseInt(id, 10),
    },
    data: employeeData,
  });
};

const deleteEmployee = async (id) => {
  return prisma.user.delete({
    where: {
      id: parseInt(id, 10),
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
