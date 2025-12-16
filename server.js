const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'nexus_secret_key_change_me';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const header = req.headers['authorization'];
    if (!header) return res.status(403).json({ message: 'No token provided' });

    const token = header.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

// API: Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ token: null, message: 'Invalid Password' });

        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, SECRET_KEY, {
            expiresIn: 86400 // 24 hours
        });

        res.status(200).json({
            id: user.id,
            username: user.username,
            role: user.role,
            accessToken: token
        });
    });
});

// API: Get Dashboard Stats
app.get('/api/dashboard/stats', verifyToken, (req, res) => {
    res.json({
        views: { value: "128.5K", trend: 12.5, up: true },
        sales: { value: "$45,290", trend: 8.2, up: true },
        users: { value: "3,842", trend: 2.4, up: false }
    });
});

// API: Get Recent Transactions
app.get('/api/transactions', verifyToken, (req, res) => {
    db.query("SELECT * FROM transactions ORDER BY id DESC LIMIT 5", (err, results) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            message: "success",
            data: results
        });
    });
});

// API: Get Users (Admin only)
app.get('/api/users', verifyToken, (req, res) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: "Require Admin Role" });
    }
    db.query("SELECT id, username, role, created_at FROM users", (err, results) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ data: results });
    });
});

// API: Create User
app.post('/api/users', verifyToken, (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: "Require Admin Role" });

    const { username, password, role } = req.body;
    const hash = bcrypt.hashSync(password, 10);

    db.query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hash, role], function (err, result) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "User created", id: result.insertId });
    });
});

// API: Delete User
app.delete('/api/users/:id', verifyToken, (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: "Require Admin Role" });

    db.query("DELETE FROM users WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "User deleted" });
    });
});

// Serve index.html for root if not API
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve users
app.get('/users.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'users.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
