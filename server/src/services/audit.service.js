const prisma = require("../config/prisma");

/**
 * Get audit logs for a specific employee
 * @param {string} employeeId
 * @returns {Promise<Array>}
 */
const getAuditLogsForEmployee = async (employeeId) => {
  return await prisma.auditLog.findMany({
    where: {
      targetId: employeeId,
      targetType: "User", // Assuming we filter by targetType 'User' for employee profile logs
    },
    orderBy: {
      timestamp: "desc",
    },
    include: {
      actor: {
        select: {
          name: true,
        },
      },
    },
  });
};

module.exports = {
  getAuditLogsForEmployee,
};
