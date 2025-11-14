require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const runSqlFile = async (filePath) => {
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
        await db.query(sql);
        console.log(`Successfully executed ${path.basename(filePath)}`);
    } catch (error) {
        console.error(`Error executing ${path.basename(filePath)}:`, error);
        throw error;
    }
};

const seedUsers = async () => {
    console.log('Seeding users with hashed passwords...');
    const users = [
        { email: 'hr@example.com', password: 'password', role: 'Admin HR', employeeId: 'emp-005' },
        { email: 'manager@example.com', password: 'password', role: 'Manager', employeeId: 'emp-002' },
        { email: 'employee@example.com', password: 'password', role: 'Employee', employeeId: 'emp-001' },
    ];

    for (const user of users) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(user.password, salt);

        const queryText = 'INSERT INTO users (email, password_hash, role, employee_id) VALUES ($1, $2, $3, $4)';
        const values = [user.email, passwordHash, user.role, user.employeeId];

        try {
            await db.query(queryText, values);
            console.log(`Seeded user: ${user.email}`);
        } catch (error) {
            console.error(`Error seeding user ${user.email}:`, error.message);
        }
    }
    console.log('User seeding complete.');
};


const initializeDatabase = async () => {
    try {
        console.log('Starting database initialization...');
        
        // Drop tables if they exist to start clean
        await runSqlFile(path.join(__dirname, '00_drop_tables.sql'));

        // Run schema creation
        await runSqlFile(path.join(__dirname, '01_schema.sql'));

        // Run data seeding
        await runSqlFile(path.join(__dirname, '02_seed.sql'));

        // Seed users separately to hash passwords
        await seedUsers();
        
        console.log('Database initialization completed successfully.');
    } catch (error) {
        console.error('Database initialization failed:', error);
    } finally {
        // The pool will manage connections, so we don't need to explicitly end it here
        // unless this script is supposed to terminate immediately.
        // For a simple script, it's fine to let it hang until connections idle out or exit process.
         process.exit(0);
    }
};

initializeDatabase();
