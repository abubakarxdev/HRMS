const authService = require('../services/auth.service');

const login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const { accessToken, refreshToken } = await authService.login(email, password);
        res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
        // More specific error handling based on service layer exceptions
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        next(error);
    }
};

const refresh = async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required.' });
    }

    try {
        const { accessToken } = await authService.refreshAccessToken(refreshToken);
        res.status(200).json({ accessToken });
    } catch (error) {
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
            return res.status(401).json({ message: error.message });
        }
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        // User ID comes from the protect middleware
        await authService.logout(req.user.id);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    refresh,
    logout,
};
