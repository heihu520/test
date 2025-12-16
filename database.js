const mysql = require('mysql2');
require('dotenv').config();

// Create the connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'nexus_dashboard',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper to create DB if not exists (needs a separate connection without DB selected)
function initializeDatabase() {
    const rawConnection = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
    });

    rawConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'nexus_dashboard'}\``, (err) => {
        if (err) {
            console.error("Error creating database:", err);
            rawConnection.end();
            return;
        }
        console.log("Database ensured.");
        rawConnection.end();

        // Now initialize tables
        initTables();
    });
}

function initTables() {
    // Users Table
    const userTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    pool.query(userTableQuery, (err) => {
        if (err) console.error("Error creating users table:", err);
        else {
            // Check for admin
            pool.query("SELECT id FROM users WHERE username = ?", ['admin'], (err, results) => {
                if (results && results.length === 0) {
                    const bcrypt = require('bcryptjs');
                    const hash = bcrypt.hashSync('admin123', 10);
                    pool.query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                        ['admin', hash, 'admin'], (err) => {
                            if (!err) console.log("Default admin created.");
                        });
                }
            });
        }
    });

    // Transactions Table
    const txTableQuery = `
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_name VARCHAR(255),
            user_initial VARCHAR(10),
            avatar_color VARCHAR(50),
            amount DECIMAL(10, 2),
            status VARCHAR(50),
            date VARCHAR(50)
        )
    `;

    pool.query(txTableQuery, (err) => {
        if (err) console.error("Error creating transactions table:", err);
        else {
            pool.query("SELECT COUNT(*) as count FROM transactions", (err, results) => {
                if (results && results[0].count === 0) {
                    const sql = "INSERT INTO transactions (user_name, user_initial, avatar_color, amount, status, date) VALUES ?";
                    const values = [
                        ["Jason Lee", "J", "#8b5cf6", 450.00, "completed", "Oct 24, 2024"],
                        ["Sarah Chen", "S", "#ec4899", 120.50, "pending", "Oct 23, 2024"],
                        ["Mike Ross", "M", "#06b6d4", 890.00, "completed", "Oct 23, 2024"],
                        ["Emma Watson", "E", "#10b981", 2300.00, "completed", "Oct 22, 2024"]
                    ];
                    pool.query(sql, [values], (err) => {
                        if (err) console.error(err);
                        else console.log("Seeded transactions.");
                    });
                }
            });
        }
    });
}

// Start initialization
initializeDatabase();

module.exports = pool;
