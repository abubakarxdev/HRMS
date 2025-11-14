const db = require('../config/db');

const findByEmail = async (email) => {
    const query = `
        SELECT 
            u.id, 
            u.email, 
            u.password_hash, 
            u.role, 
            u.employee_id,
            e.name
        FROM users u
        JOIN employees e ON u.employee_id = e.id
        WHERE u.email = $1
    `;
    const { rows } = await db.query(query, [email]);
    return rows[0];
};

const findById = async (id) => {
    const query = `
        SELECT 
            u.id, 
            u.email, 
            u.role, 
            u.employee_id,
            e.name
        FROM users u
        JOIN employees e ON u.employee_id = e.id
        WHERE u.id = $1
    `;
    const { rows } = await db.query(query, [id]);
    // We don't want to pass the password hash around after initial auth
    return rows[0];
};


module.exports = {
    findByEmail,
    findById,
};
