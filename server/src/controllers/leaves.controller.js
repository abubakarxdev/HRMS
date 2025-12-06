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
 * Get current user's leave requests
 */
const getMyRequests = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID not found for user" });
    }

    const { page, limit, status } = req.query;
    const filters = { employeeId };
    if (status) filters.status = status;

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

    const request = await leaveService.createRequest(employeeId, req.body);
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
    const { page, limit, status, employeeId } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (employeeId) filters.employeeId = employeeId;

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
    const { status, managerComments } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedRequest = await leaveService.updateRequestStatus(id, status, managerComments);
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getMyBalances,
  getMyRequests,
  createRequest,
  getAllRequests,
  updateRequestStatus,
};
