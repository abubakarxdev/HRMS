const leaveService = require("../services/leaves.service");

/**
 * Get current user's leave balances
 */
const getMyBalances = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID not found for user" });
    }

    const balances = await leaveService.getBalances(employeeId);
    res.json(balances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get leave balances for a specific employee (Admin/HR)
 */
const getEmployeeBalances = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const balances = await leaveService.getBalances(employeeId);
    res.json(balances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get current user's leave requests
 */
const getMyRequests = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID not found for user" });
    }

    const { page, limit, status, startDate, endDate } = req.query;
    const filters = { employeeId };
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await leaveService.getRequests(page, limit, filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new leave request
 */
const createRequest = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID not found for user" });
    }

    const request = await leaveService.createRequest(employeeId, req.body, req.user.role);
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get all leave requests (Admin/HR)
 */
const getAllRequests = async (req, res) => {
  try {
    const { page, limit, status, employeeId, startDate, endDate } = req.query;
    let { officeId } = req.query;
    const { role } = req.user;

    // Strict Data Isolation: Employees and HR can ONLY view requests from their own office
    if (role === 'EMPLOYEE' || role === 'HR') {
        const userOfficeId = req.user.employee?.officeId;
        if (userOfficeId) {
            officeId = userOfficeId;
        } else {
             // If a restricted user has no office assigned, they shouldn't see ALL requests.
             return res.status(200).json({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });
        }
    }

    const filters = {};
    if (status) filters.status = status;
    if (employeeId) filters.employeeId = employeeId;
    if (officeId) filters.officeId = officeId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await leaveService.getRequests(page, limit, filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update request status (Approve/Reject)
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approverComments } = req.body;
    const approverId = req.user.employeeId; // Get ID of the person performing the action

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedRequest = await leaveService.updateRequestStatus(id, status, approverComments, approverId, req.user.role);
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get a single leave request by ID (Admin/HR)
 */
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await leaveService.getRequestById(id);
    
    // Strict Data Isolation: 
    // If not Admin/Super Admin, verify access (e.g., HR viewing their office, or Employee viewing their own)
    // Note: This endpoint is protected by authorize('ADMIN', 'HR') in routes, so currently restricts to them.
    // If we want to allow Employees to view their own detail via this endpoint, we'd need to relax the route middleware 
    // and enforce ownership check here. For now, assuming Admin/HR context as per Plan.
    
    res.json(request);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * Get leave statistics (Admin/HR)
 */
const getLeaveStats = async (req, res) => {
  try {
    const { status, employeeId, startDate, endDate } = req.query;
    let { officeId } = req.query;
    const { role } = req.user;

    // Strict Data Isolation: Employees and HR can ONLY view requests from their own office
    if (role === 'EMPLOYEE' || role === 'HR') {
        const userOfficeId = req.user.employee?.officeId;
        if (userOfficeId) {
            officeId = userOfficeId;
        } else {
             // Restricted user with no office
             return res.status(200).json({ Pending: 0, Approved: 0, Rejected: 0 });
        }
    }

    const filters = {};
    if (employeeId) filters.employeeId = employeeId;
    if (officeId) filters.officeId = officeId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await leaveService.getStats(filters);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyBalances,
  getMyRequests,
  createRequest,
  getAllRequests,
  updateRequestStatus,
  getEmployeeBalances,
  getRequestById,
  getLeaveStats,
};
