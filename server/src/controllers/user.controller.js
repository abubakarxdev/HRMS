const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");

/**
 * Get all/filtered users (Admins/Super Admins)
 */
const getUsers = async (req, res) => {
  try {
    const { role, legalEntityId } = req.query;

    const where = {};
    if (role) {
        where.role = role;
    } else {
        // Default: fetch ADMIN and SUPER_ADMIN if no specific role requested?
        // Or just let frontend filter.
        // Let's filter for relevant roles to avoid fetching all execution employees
        where.role = { in: ['ADMIN', 'SUPER_ADMIN'] };
    }

    if (legalEntityId) {
        where.employee = { legalEntityId };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            legalEntity: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new Admin/Super Admin
 */
const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, legalEntityId } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    // Check existing
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists." });
    }

    // Role validation
    if (role === 'ADMIN' && !legalEntityId) {
        return res.status(400).json({ message: "Legal Entity is required for Admin role." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Transaction to create Employee + User
    const result = await prisma.$transaction(async (tx) => {
        // Create Employee Profile
        const employee = await tx.employee.create({
            data: {
                firstName,
                lastName,
                workEmail: email,
                status: 'Active',
                joiningDate: new Date(),
                legalEntityId: role === 'ADMIN' ? legalEntityId : null, // Super Admin might not have one
                // Generate a dummy employee ID or require it? Let's generate one.
                employeeIdNumber: `ADM-${Date.now().toString().slice(-6)}`, 
            }
        });

        // Create User
        const user = await tx.user.create({
            data: {
                email,
                passwordHash,
                role,
                employeeId: employee.id
            }
        });

        return user;
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Update User
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, legalEntityId, password } = req.body;

    // TODO: Add security checks (e.g. only Super Admin can update roles)

    // Prepare update data
    const updateData = {};
    if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    if (role) updateData.role = role;

    await prisma.$transaction(async (tx) => {
        // Update User
        if (Object.keys(updateData).length > 0) {
            await tx.user.update({
                where: { id },
                data: updateData
            });
        }

        // Update Employee
        // First get employee ID
        const user = await tx.user.findUnique({ where: { id }, select: { employeeId: true } });
        if (user && user.employeeId) {
             const empUpdate = {};
             if (firstName) empUpdate.firstName = firstName;
             if (lastName) empUpdate.lastName = lastName;
             if (legalEntityId !== undefined) empUpdate.legalEntityId = legalEntityId; // Allow null

             if (Object.keys(empUpdate).length > 0) {
                 await tx.employee.update({
                     where: { id: user.employeeId },
                     data: empUpdate
                 });
             }
        }
    });

    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete User
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self?
    if (req.user.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account." });
    }

    // Transaction to delete User and linked Employee?
    // User deletion might cascade or we handle manually.
    // For now, let's delete user. Employee might be kept for records?
    // Usually for Admin accounts, we want to clean up.
    
    await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id } });
        if (!user) throw new Error("User not found");

        await tx.user.delete({ where: { id } });
        
        // Optionally delete employee if created solely for admin purposes
        // We'll leave it for now to avoid accidental data loss of history
        // Or should we delete? Let's delete if it's strictly an admin.
        if (user.employeeId) {
             await tx.employee.delete({ where: { id: user.employeeId } });
        }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
