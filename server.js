// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors()); // Allows Netlify/Frontend to talk to Render Backend
app.use(bodyParser.json());

// DATABASE CONNECTION
// Uses Environment Variables for Security (Set these in Render Dashboard)
const db = mysql.createConnection({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: {
        rejectUnauthorized: false // Required for Aiven and many cloud MySQL providers
    }
});

db.connect(err => {
    if (err) { 
        console.error('DB Connection Error:', err); 
    } else { 
        console.log('Connected to MySQL Database'); 
        
        // --- AUTOMATIC TABLE CREATION LOGIC ---
        
        // 1. Create Users Table
        const userTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                dob DATE,
                email VARCHAR(100) UNIQUE,
                phone VARCHAR(20),
                password VARCHAR(255)
            )`;

        // 2. Create Reviews Table
        const reviewTable = `
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_name VARCHAR(100),
                review_text TEXT,
                rating INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;

        db.query(userTable, (err) => {
            if (err) console.error("Error creating users table:", err);
            else console.log("Users table check/creation: OK");
        });

        db.query(reviewTable, (err) => {
            if (err) console.error("Error creating reviews table:", err);
            else console.log("Reviews table check/creation: OK");
        });
        
        // -------------------------------------
    }
});

// 1. REGISTER API
app.post('/register', (req, res) => {
    const { name, dob, email, phone, password } = req.body;
    const sql = 'INSERT INTO users (name, dob, email, phone, password) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [name, dob, email, phone, password], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Registration Successful!' });
    });
});

// 2. LOGIN API
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            res.json({ message: 'Login Successful', user: results[0] });
        } else {
            res.status(401).json({ message: 'Invalid Credentials' });
        }
    });
});

// 3. GET REVIEWS (LAST 5)
app.get('/reviews', (req, res) => {
    const sql = 'SELECT * FROM reviews ORDER BY id DESC LIMIT 5';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 4. ADD REVIEW API
app.post('/reviews', (req, res) => {
    const { user_name, review_text, rating } = req.body;
    const sql = 'INSERT INTO reviews (user_name, review_text, rating) VALUES (?, ?, ?)';
    db.query(sql, [user_name, review_text, rating], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Review Added!' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Vibranium Backend running on port ${PORT}`);
});