const employeeRepository = require("../repositories/employee.repository");
const bcrypt = require("bcryptjs");

/**
 * Helper function to generate a unique employee ID number (EMP-XXXXXX)
 */
const generateEmployeeIdNumber = () =>
  "EMP-" + Math.random().toString(36).substring(2, 10).toUpperCase();

/**
 * Service functions for Employee business logic
 */

/**
 * Get all employees
 */
const getAllEmployees = async (officeId, { page, limit, search, role, department, status } = {}) => {
  try {
    const isPaginated = page !== undefined || limit !== undefined;
    const take = isPaginated ? (parseInt(limit) || 10) : undefined;
    const skip = isPaginated ? Math.max(0, ((parseInt(page) || 1) - 1) * take) : undefined;

    const where = {};
    if (officeId && officeId !== 'undefined' && officeId !== 'null') where.officeId = officeId;
    if (status && status !== 'all') where.status = status;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { workEmail: { contains: search, mode: 'insensitive' } },
        { employeeIdNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by active contract details
    if ((role && role !== 'all') || (department && department !== 'all')) {
         where.contracts = {
             some: {
                isActive: true,
                ...(role && role !== 'all' ? { position: role } : {}),
                ...(department && department !== 'all' ? { department: department } : {}),
             }
         };
    }

    const { data, total } = await employeeRepository.getAllEmployees({ skip, take, where });

    if (!isPaginated) {
        return data; // Return raw array for backward compatibility
    }

    return {
        data,
        meta: {
            total,
            page: parseInt(page || 1),
            limit: take,
            totalPages: Math.ceil(total / take)
        }
    };
  } catch (error) {
    throw new Error(`Error fetching employees: ${error.message}`);
  }
};

/**
 * Get employee by ID
 */
const getEmployeeById = async (id) => {
  try {
    const employee = await employeeRepository.getEmployeeById(id);
    if (!employee) {
      throw new Error("Employee not found");
    }
    return employee;
  } catch (error) {
    throw new Error(`Error fetching employee: ${error.message}`);
  }
};

/**
 * Create employee with user account
 */
const createEmployee = async (data) => {
  try {
    // Validate required fields
    if (!data.email || !data.password) {
      throw new Error("Email and password are required");
    }

    if (!data.firstName || !data.lastName) {
      throw new Error("First name and last name are required");
    }

    if (!data.workEmail) {
      throw new Error("Work email is required");
    }

    if (!data.joiningDate) {
      throw new Error("Joining date is required");
    }

    // Check if email already exists
    const existingEmployee = await employeeRepository.findByEmail(data.workEmail);
    if (existingEmployee) {
      throw new Error(`Work email "${data.workEmail}" is already in use`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Generate employee ID number
    const employeeIdNumber = data.employeeIdNumber || generateEmployeeIdNumber();
    
    // Extract Position and Department from top-level or personalDetails
    // Prirority: Top-level data > personalDetails > Defaults
    const position = data.position || data.personalDetails?.position || "Unassigned";
    const department = data.department || data.personalDetails?.department || "Unassigned";
    
    // Clean specific fields from personalDetails to avoid duplication
    let personalDetailsRaw = data.personalDetails || {};
    // Clone to avoid mutation if needed
    const personalDetails = { ...personalDetailsRaw };
    delete personalDetails.position;
    delete personalDetails.department;

    // Prepare Contract Data
    const contractData = {
        type: data.contractType || "FULL_TIME", // Enum: FULL_TIME, PART_TIME, etc.
        position: position,
        department: department,
        startDate: new Date(data.joiningDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        salary: data.salary || 0,
        currency: data.currency || "USD",
        isActive: true, // Auto-activate initial contract
    };

    // Prepare employee data
    const employeeData = {
      employeeIdNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      workEmail: data.workEmail,
      personalEmail: data.personalEmail || null,
      avatarUrl: data.avatarUrl || null,
      status: data.status || "Active",
      joiningDate: new Date(data.joiningDate),
      personalDetails: Object.keys(personalDetails).length > 0 ? personalDetails : null,
      bankDetails: data.bankDetails || null,
      legalEntityId: data.legalEntityId || null,
      officeId: data.officeId || null,
      managerId: data.managerId || null,
    };

    // Prepare user data
    const userData = {
      email: data.email,
      passwordHash,
      role: data.role || "EMPLOYEE",
      timezone: data.timezone || "Asia/Karachi",
    };

    // Create employee with user and contract
    return await employeeRepository.createEmployee(employeeData, userData, contractData);
  } catch (error) {
    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      throw new Error(`The ${field} is already in use`);
    }
    throw new Error(`Error creating employee: ${error.message}`);
  }
};

/**
 * Update employee
 */
const updateEmployee = async (id, data) => {
  try {
    // Check if employee exists
    const existingEmployee = await employeeRepository.getEmployeeById(id);
    if (!existingEmployee) {
      throw new Error("Employee not found");
    }

    // Prepare employee update data
    const employeeData = {};
    
    if (data.firstName !== undefined) employeeData.firstName = data.firstName;
    if (data.lastName !== undefined) employeeData.lastName = data.lastName;
    if (data.workEmail !== undefined) employeeData.workEmail = data.workEmail;
    if (data.personalEmail !== undefined) employeeData.personalEmail = data.personalEmail;
    if (data.avatarUrl !== undefined) employeeData.avatarUrl = data.avatarUrl;
    if (data.status !== undefined) employeeData.status = data.status;
    if (data.joiningDate !== undefined) employeeData.joiningDate = new Date(data.joiningDate);
    if (data.personalDetails !== undefined) employeeData.personalDetails = data.personalDetails;
    if (data.bankDetails !== undefined) employeeData.bankDetails = data.bankDetails;
    if (data.legalEntityId !== undefined) employeeData.legalEntityId = data.legalEntityId;
    if (data.officeId !== undefined) employeeData.officeId = data.officeId;
    if (data.managerId !== undefined) employeeData.managerId = data.managerId;

    // Update employee
    const updatedEmployee = await employeeRepository.updateEmployee(id, employeeData);

    // Update user data if provided
    const userData = {};
    if (data.email !== undefined) userData.email = data.email;
    if (data.role !== undefined) userData.role = data.role;
    if (data.timezone !== undefined) userData.timezone = data.timezone;
    if (data.password !== undefined) {
      userData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    if (Object.keys(userData).length > 0) {
      await employeeRepository.updateEmployeeUser(id, userData);
    }

    // Return updated employee
    return await employeeRepository.getEmployeeById(id);
  } catch (error) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      throw new Error(`The ${field} is already in use`);
    }
    throw new Error(`Error updating employee: ${error.message}`);
  }
};

/**
 * Delete employee
 */
const deleteEmployee = async (id) => {
  try {
    const employee = await employeeRepository.getEmployeeById(id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    return await employeeRepository.deleteEmployee(id);
  } catch (error) {
    throw new Error(`Error deleting employee: ${error.message}`);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
