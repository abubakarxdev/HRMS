const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.util');

const login = async (email, password) => {
    try {
        const user = await userRepository.findByEmail(email);

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            timezone: user.timezone || 'Asia/Karachi',
            firstName: user.employee?.firstName,
            lastName: user.employee?.lastName,
            legalEntityId: user.employee?.legalEntityId,
            officeId: user.employee?.officeId,
        };
        
        const accessToken = generateToken(payload);
        const refreshToken = generateRefreshToken({ id: user.id });

        // Store refresh token in database with expiry (7 days from now)
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
        await userRepository.updateRefreshToken(user.id, refreshToken, refreshTokenExpiry);

        return { 
            accessToken, 
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                employeeId: user.employeeId,
                timezone: user.timezone || 'Asia/Karachi',
                firstName: user.employee?.firstName,
                lastName: user.employee?.lastName,
                employeeIdNumber: user.employee?.employeeIdNumber,
                legalEntityId: user.employee?.legalEntityId,
                officeId: user.employee?.officeId,
            }
        };
    } catch (error) {
        throw new Error(`Login failed: ${error.message}`);
    }
};

const refreshAccessToken = async (refreshToken) => {
    try {
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        
        if (!decoded) {
            throw new Error('Invalid refresh token');
        }

        // Check if refresh token exists in database and is not expired
        const user = await userRepository.findByRefreshToken(refreshToken);
        
        if (!user) {
            throw new Error('Refresh token expired or invalid');
        }

        // Generate new access token
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            timezone: user.timezone || 'Asia/Karachi',
            firstName: user.employee?.firstName,
            lastName: user.employee?.lastName,
            legalEntityId: user.employee?.legalEntityId,
        };
        
        const accessToken = generateToken(payload);

        return { accessToken };
    } catch (error) {
        throw new Error(`Token refresh failed: ${error.message}`);
    }
};

const logout = async (userId) => {
    try {
        // Clear refresh token from database
        await userRepository.clearRefreshToken(userId);
    } catch (error) {
        throw new Error(`Logout failed: ${error.message}`);
    }
};

module.exports = {
    login,
    refreshAccessToken,
    logout,
};
