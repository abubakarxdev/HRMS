const contractRepository = require("../repositories/contract.repository");

/**
 * Service functions for Employment Contract business logic
 */

/**
 * Create a new contract (Handles Renewals)
 */
const createContract = async (data) => {
  try {
    // Validate required fields
    if (!data.employeeId || !data.type || !data.startDate) {
        throw new Error("Employee ID, Contract Type, and Start Date are required.");
    }

    // Default isActive to true if not specified
    const contractData = {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
    };

    // If this new contract is Active, deactivate all previous active contracts for this employee
    if (contractData.isActive) {
        await contractRepository.deactivateAllContractsForEmployee(data.employeeId);
    }

    // Create the contract
    return await contractRepository.createContract(contractData);
  } catch (error) {
    throw new Error(`Error creating contract: ${error.message}`);
  }
};

/**
 * Get all contracts (optionally filtered by office)
 */
const getAllContracts = async (officeId, legalEntityId) => {
  // Auto-expire contracts before fetching
  await contractRepository.deactivateExpiredContracts();
  return await contractRepository.getAllContracts(officeId, legalEntityId);
};

/**
 * Get contracts for a specific employee
 */
const getContractsByEmployeeId = async (employeeId) => {
  // Auto-expire contracts before fetching
  await contractRepository.deactivateExpiredContracts();
  return await contractRepository.getContractsByEmployeeId(employeeId);
};

/**
 * Get contract by ID
 */
const getContractById = async (id) => {
    const contract = await contractRepository.getContractById(id);
    if (!contract) {
        throw new Error("Contract not found");
    }
    return contract;
};

/**
 * Update a contract
 */
const updateContract = async (id, data) => {
    // If setting to active, deactivate others
    if (data.isActive === true) {
        // We need employeeId to deactivate others
        const existing = await contractRepository.getContractById(id);
        if (existing) {
            await contractRepository.deactivateAllContractsForEmployee(existing.employeeId, id);
        }
    }
    return await contractRepository.updateContract(id, data);
};

/**
 * Delete a contract
 */
const deleteContract = async (id) => {
    return await contractRepository.deleteContract(id);
};

module.exports = {
  createContract,
  getAllContracts,
  getContractsByEmployeeId,
  getContractById,
  updateContract,
  deleteContract,
};
