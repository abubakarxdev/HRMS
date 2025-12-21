const contractService = require("../services/contract.service");
const prisma = require("../config/prisma");

// Helper for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Get all contracts
 */
const getAllContracts = asyncHandler(async (req, res) => {
  let { officeId } = req.query;

  const { role } = req.user;

  // Tenant Isolation
  // Tenant Isolation
  let legalEntityId = undefined;
  if (role !== 'SUPER_ADMIN') {
      legalEntityId = req.user.employee?.legalEntityId || req.user.legalEntityId;

      if (!legalEntityId) {
           const userOfficeId = req.user.employee?.officeId || req.user.officeId;
           if (userOfficeId) {
               const office = await prisma.office.findUnique({
                    where: { id: userOfficeId },
                    select: { legalEntityId: true }
               });
               if (office) legalEntityId = office.legalEntityId;
           }
      }

      if (!legalEntityId) {
          return res.status(200).json([]);
      }
  }

  // Strict Data Isolation: Employees and HR are bound to their assigned office
  if (role === 'EMPLOYEE' || role === 'HR') {
      const userOfficeId = req.user.employee?.officeId;
      if (userOfficeId) {
          officeId = userOfficeId;
      } else {
        // Safe fallback for unassigned users
        return res.status(200).json([]);
      }
  }

  const contracts = await contractService.getAllContracts(officeId, legalEntityId);
  res.status(200).json(contracts);
});

/**
 * Get contracts for a specific employee
 */
const getEmployeeContracts = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const contracts = await contractService.getContractsByEmployeeId(employeeId);
    res.status(200).json(contracts);
});

/**
 * Create a new contract
 */
const createContract = asyncHandler(async (req, res) => {
  const contractData = req.body;
  
  // Basic validation or additional permission checks could go here
  
  // Parse dates
  if (contractData.startDate) {
      contractData.startDate = new Date(contractData.startDate);
  }
  if (contractData.endDate) {
      contractData.endDate = new Date(contractData.endDate);
  } else {
    // If empty string, make it undefined/null to match optional type
    if (contractData.endDate === "") {
        contractData.endDate = null;
    }
  }

  // Ensure type match
  if (contractData.salary) contractData.salary = Number(contractData.salary);
  
  const newContract = await contractService.createContract(contractData);
  res.status(201).json(newContract);
});

/**
 * Update a contract
 */
const updateContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  else if (data.endDate === "") data.endDate = null;
  
  if (data.salary) data.salary = Number(data.salary);

  const updatedContract = await contractService.updateContract(id, data);
  res.status(200).json(updatedContract);
});

/**
 * Delete a contract
 */
const deleteContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await contractService.deleteContract(id);
  res.status(204).send();
});

module.exports = {
  getAllContracts,
  getEmployeeContracts,
  createContract,
  updateContract,
  deleteContract
};
