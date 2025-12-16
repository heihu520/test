const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./nexus.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error("Table users error:", err);
            } else {
                // Check if admin exists
                db.get("SELECT id FROM users WHERE username = ?", ["admin"], (err, row) => {
                    if (!row) {
                        const hash = bcrypt.hashSync('admin123', 10);
                        db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                            ['admin', hash, 'admin']);
                        console.log("Default admin user created: admin / admin123");
                    }
                });
            }
        });

        // Transactions Table
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT,
            user_initial TEXT,
            avatar_color TEXT,
            amount REAL,
            status TEXT,
            date TEXT
        )`, (err) => {
            if (!err) {
                // Seed some data if empty
                db.get("SELECT count(*) as count FROM transactions", (err, row) => {
                    if (row && row.count === 0) {
                        const stmt = db.prepare("INSERT INTO transactions (user_name, user_initial, avatar_color, amount, status, date) VALUES (?, ?, ?, ?, ?, ?)");
                        stmt.run("Jason Lee", "J", "#8b5cf6", 450.00, "completed", "Oct 24, 2024");
                        stmt.run("Sarah Chen", "S", "#ec4899", 120.50, "pending", "Oct 23, 2024");
                        stmt.run("Mike Ross", "M", "#06b6d4", 890.00, "completed", "Oct 23, 2024");
                        stmt.run("Emma Watson", "E", "#10b981", 2300.00, "completed", "Oct 22, 2024");
                        stmt.finalize();
                        console.log("Seeded transactions table.");
                    }
                });
            }
        });
    });
}

module.exports = db;
