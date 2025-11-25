const prisma = require('../config/prisma');

const findByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email },
    });
};

const findById = async (id) => {
    return await prisma.user.findUnique({
        where: { id: String(id) },
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

const updateRefreshToken = async (userId, refreshToken, expiry) => {
    return await prisma.user.update({
        where: { id: String(userId) },
        data: {
            refreshToken,
            refreshTokenExpiry: expiry,
        },
    });
};

const clearRefreshToken = async (userId) => {
    return await prisma.user.update({
        where: { id: String(userId) },
        data: {
            refreshToken: null,
            refreshTokenExpiry: null,
        },
    });
};

const findByRefreshToken = async (refreshToken) => {
    return await prisma.user.findFirst({
        where: {
            refreshToken,
            refreshTokenExpiry: {
                gt: new Date(), // Token must not be expired
            },
        },
    });
};

module.exports = {
    findByEmail,
    findById,
    updateRefreshToken,
    clearRefreshToken,
    findByRefreshToken,
};
