const authService = require('../services/auth.service');

const login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const { token } = await authService.login(email, password);
        res.status(200).json({ token });
    } catch (error) {
        // More specific error handling based on service layer exceptions
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        next(error);
    }
};

module.exports = {
    login,
};
