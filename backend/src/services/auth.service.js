const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { generateToken } = require('../utils/jwt.util');

const login = async (email, password) => {
    const user = await userRepository.findByEmail(email);

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    const payload = {
        id: user.id,
        name: user.name,
        role: user.role,
        employeeId: user.employee_id,
    };
    
    const token = generateToken(payload);

    return { token };
};

module.exports = {
    login,
};
