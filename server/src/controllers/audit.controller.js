const auditService = require("../services/audit.service");

// Helper function for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Get audit logs for an employee.
 * Route: GET /api/audit-logs/:employeeId
 */
const getAuditLogsForEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const logs = await auditService.getAuditLogsForEmployee(employeeId);
  
  // Transform logs to match frontend expectation if necessary
  // Frontend expects: { id, action, user, details, timestamp }
  // Database has: { id, action, actor: { name }, details, timestamp }
  const formattedLogs = logs.map(log => ({
    id: log.id,
    action: log.action,
    user: log.actor ? log.actor.name : 'Unknown',
    details: log.details,
    timestamp: log.timestamp
  }));

  res.status(200).json(formattedLogs);
});

module.exports = {
  getAuditLogsForEmployee,
};
