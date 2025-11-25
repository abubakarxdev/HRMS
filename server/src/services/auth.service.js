const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.util');

const login = async (email, password) => {
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
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
    };
    
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken({ id: user.id });

    // Store refresh token in database with expiry (7 days from now)
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
    await userRepository.updateRefreshToken(user.id, refreshToken, refreshTokenExpiry);

    return { accessToken, refreshToken };
};

const refreshAccessToken = async (refreshToken) => {
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
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
    };
    
    const accessToken = generateToken(payload);

    return { accessToken };
};

const logout = async (userId) => {
    // Clear refresh token from database
    await userRepository.clearRefreshToken(userId);
};

module.exports = {
    login,
    refreshAccessToken,
    logout,
};
