const prisma = require('../config/prisma');

const findByEmail = async (email) => {
    try {
        return await prisma.user.findUnique({
            where: { email },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeIdNumber: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });
    } catch (error) {
        throw new Error(`Error finding user by email: ${error.message}`);
    }
};

const findById = async (id) => {
    try {
        return await prisma.user.findUnique({
            where: { id: String(id) },
            select: {
                id: true,
                employeeId: true,
                email: true,
                role: true,
                timezone: true,
                lastLogin: true,
                createdAt: true,
                employee: {
                    select: {
                        id: true,
                        employeeIdNumber: true,
                        firstName: true,
                        lastName: true,
                        workEmail: true,
                        avatarUrl: true,
                    }
                }
            },
        });
    } catch (error) {
        throw new Error(`Error finding user by ID: ${error.message}`);
    }
};

const updateRefreshToken = async (userId, refreshToken, expiry) => {
    try {
        // Create a new refresh token record
        return await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: String(userId),
                expiresAt: expiry,
            },
        });
    } catch (error) {
        throw new Error(`Error updating refresh token: ${error.message}`);
    }
};

const clearRefreshToken = async (userId) => {
    try {
        // Revoke all refresh tokens for the user (or we could pass a specific token to revoke)
        // For logout, we typically want to revoke the specific token used, but here we'll revoke all for safety or change signature to revoke specific
        // But to keep it simple and consistent with previous behavior (logging out user from all devices if we just clear all? No, previous behavior was 1 token)
        // Let's change this to delete all tokens for the user for now to ensure clean logout, 
        // OR better: update the signature in service to pass the token to revoke.
        // For now, let's delete all for the user to be safe and simple.
        return await prisma.refreshToken.deleteMany({
            where: { userId: String(userId) },
        });
    } catch (error) {
        throw new Error(`Error clearing refresh tokens: ${error.message}`);
    }
};

const findByRefreshToken = async (refreshToken) => {
    try {
        const tokenRecord = await prisma.refreshToken.findUnique({
            where: {
                token: refreshToken,
            },
            include: {
                user: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                employeeIdNumber: true,
                                firstName: true,
                                lastName: true,
                            }
                        }
                    }
                }
            }
        });

        if (!tokenRecord) return null;

        // Check expiry
        if (new Date() > tokenRecord.expiresAt) {
            return null;
        }

        return tokenRecord.user;
    } catch (error) {
        throw new Error(`Error finding user by refresh token: ${error.message}`);
    }
};

module.exports = {
    findByEmail,
    findById,
    updateRefreshToken,
    clearRefreshToken,
    findByRefreshToken,
};
