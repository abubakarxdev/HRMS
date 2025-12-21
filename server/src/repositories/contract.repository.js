const prisma = require("../config/prisma");

/**
 * Repository functions for Employment Contract database operations
 */

/**
 * Create a new employment contract
 */
const createContract = async (contractData) => {
  try {
    return await prisma.employmentContract.create({
      data: contractData,
    });
  } catch (error) {
    throw new Error(`Error creating contract: ${error.message}`);
  }
};

/**
 * Get all contracts with optional filtering
 */
const getAllContracts = async (officeId, legalEntityId) => {
  try {
    const where = {};
    if (officeId) {
        where.employee = {
            officeId: officeId
        };
    }

    if (legalEntityId) {
        where.employee = {
            ...where.employee,
            legalEntityId: legalEntityId
        };
    }

    return await prisma.employmentContract.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            workEmail: true,
            employeeIdNumber: true,
            employeeIdNumber: true,
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { startDate: 'desc' }
      ]
    });
  } catch (error) {
    throw new Error(`Error fetching contracts: ${error.message}`);
  }
};

/**
 * Get contracts by Employee ID
 */
const getContractsByEmployeeId = async (employeeId) => {
  try {
    return await prisma.employmentContract.findMany({
      where: { employeeId },
      orderBy: {
        startDate: 'desc'
      }
    });
  } catch (error) {
    throw new Error(`Error fetching contracts for employee: ${error.message}`);
  }
};

/**
 * Get contract by ID
 */
const getContractById = async (id) => {
  try {
    return await prisma.employmentContract.findUnique({
      where: { id },
      include: {
        employee: {
            select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeIdNumber: true
            }
        }
      }
    });
  } catch (error) {
    throw new Error(`Error fetching contract: ${error.message}`);
  }
};

/**
 * Update a contract
 */
const updateContract = async (id, data) => {
  try {
    return await prisma.employmentContract.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw new Error(`Error updating contract: ${error.message}`);
  }
};

/**
 * Delete a contract
 */
const deleteContract = async (id) => {
  try {
    return await prisma.employmentContract.delete({
      where: { id },
    });
  } catch (error) {
    throw new Error(`Error deleting contract: ${error.message}`);
  }
};

/**
 * Deactivate all contracts for an employee (used during renewal/promotion to ensure only one active)
 * Optionally exclude a specific contract ID
 */
const deactivateAllContractsForEmployee = async (employeeId, excludeContractId = null) => {
    try {
        const where = {
            employeeId,
            isActive: true
        };
        
        if (excludeContractId) {
            where.id = { not: excludeContractId };
        }

        return await prisma.employmentContract.updateMany({
            where,
            data: { 
                isActive: false,
                endDate: new Date() // Close the contract effectively now
            }
        });
    } catch (error) {
        throw new Error(`Error deactivating old contracts: ${error.message}`);
    }
}

/**
 * Deactivate contracts that have passed their end date
 */
const deactivateExpiredContracts = async () => {
    try {
        const now = new Date();
        return await prisma.employmentContract.updateMany({
            where: {
                isActive: true,
                endDate: {
                    lt: now
                }
            },
            data: {
                isActive: false
            }
        });
    } catch (error) {
        throw new Error(`Error deactivating expired contracts: ${error.message}`);
    }
}

module.exports = {
  createContract,
  getAllContracts,
  getContractsByEmployeeId,
  getContractById,
  updateContract,
  deleteContract,
  deactivateAllContractsForEmployee,
  deactivateExpiredContracts
};
