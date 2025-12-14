const prisma = require("../config/prisma");

/**
 * Repository functions for Employee database operations
 */

/**
 * Get all employees with their user information
 */
const getAllEmployees = async (officeId) => {
  try {
    const where = {};
    if (officeId) {
      where.officeId = officeId;
    }

    return await prisma.employee.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            timezone: true,
          }
        },
        legalEntity: {
          select: {
            id: true,
            name: true,
          }
        },
        office: {
          select: {
            id: true,
            name: true,
          }
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    throw new Error(`Error fetching all employees: ${error.message}`);
  }
};

/**
 * Get employee by ID with full details
 */
const getEmployeeById = async (id) => {
  try {
    return await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            timezone: true,
            lastLogin: true,
          }
        },
        legalEntity: true,
        office: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        contracts: {
          where: {
            isActive: true
          }
        },
        educationHistory: true,
        workExperience: true,
      },
    });
  } catch (error) {
    throw new Error(`Error fetching employee by ID: ${error.message}`);
  }
};

/**
 * Create employee with user account
 */
const createEmployee = async (employeeData, userData) => {
  try {
    // Create employee with nested user creation
    return await prisma.employee.create({
      data: {
        ...employeeData,
        user: {
          create: userData
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            timezone: true,
          }
        }
      }
    });
  } catch (error) {
    throw new Error(`Error creating employee: ${error.message}`);
  }
};

/**
 * Update employee
 */
const updateEmployee = async (id, employeeData) => {
  try {
    return await prisma.employee.update({
      where: { id },
      data: employeeData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            timezone: true,
          }
        }
      }
    });
  } catch (error) {
    throw new Error(`Error updating employee: ${error.message}`);
  }
};

/**
 * Update employee's user account (email, role, timezone)
 */
const updateEmployeeUser = async (employeeId, userData) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { user: { select: { id: true } } }
    });

    if (!employee || !employee.user) {
      throw new Error("Employee or associated user not found");
    }

    return await prisma.user.update({
      where: { id: employee.user.id },
      data: userData
    });
  } catch (error) {
    throw new Error(`Error updating employee user: ${error.message}`);
  }
};

/**
 * Delete employee (cascades to user)
 */
const deleteEmployee = async (id) => {
  try {
    return await prisma.employee.delete({
      where: { id },
    });
  } catch (error) {
    throw new Error(`Error deleting employee: ${error.message}`);
  }
};

/**
 * Find employee by email
 */
const findByEmail = async (email) => {
  try {
    return await prisma.employee.findFirst({
      where: {
        OR: [
          { workEmail: email },
          { personalEmail: email }
        ]
      },
      include: {
        user: true
      }
    });
  } catch (error) {
    throw new Error(`Error finding employee by email: ${error.message}`);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeUser,
  deleteEmployee,
  findByEmail,
};
