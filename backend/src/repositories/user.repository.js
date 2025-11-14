const prisma = require('../config/prisma');

const findByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email },
    });
};

const findById = async (id) => {
    return await prisma.user.findUnique({
        where: { id },
        // Exclude the password hash for security
        select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            position: true,
            department: true,
            role: true,
            status: true,
            hireDate: true,
            avatar: true,
            managerId: true,
        },
    });
};

module.exports = {
    findByEmail,
    findById,
};
