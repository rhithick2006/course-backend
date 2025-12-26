// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors()); // Allows Frontend to talk to Backend
app.use(bodyParser.json());

// DATABASE CONNECTION
// Connected to your Aiven MySQL Database
const db = mysql.createConnection({
    uri: 'mysql://avnadmin:AVNS_0dNIH0i-nmlYWEJFMle@mysql-10ebf2a8-rhithicklakshmanan-d0d5.j.aivencloud.com:12329/defaultdb?ssl-mode=REQUIRED',
    ssl: {
        rejectUnauthorized: false // Fixes SSL handshake errors for Aiven
    }
});

db.connect(err => {
    if (err) { 
        console.error('------------------------------------------');
        console.error('FAILED TO CONNECT TO DATABASE');
        console.error(err);
        console.error('------------------------------------------');
    } else { 
        console.log('------------------------------------------');
        console.log('✅ SUCCESS: Connected to Aiven MySQL'); 
        console.log('------------------------------------------');
        
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
            else console.log("Users table check: OK");
        });

        db.query(reviewTable, (err) => {
            if (err) console.error("Error creating reviews table:", err);
            else console.log("Reviews table check: OK");
        });
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

// 3. GET REVIEWS (Public - Limit 5)
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

// 5. ADMIN API: GET ALL USERS
app.get('/users', (req, res) => {
    const sql = 'SELECT id, name, email, phone, dob FROM users';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 6. ADMIN API: DELETE USER
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted successfully' });
    });
});

// 7. ADMIN API: UPDATE USER
app.put('/users/:id', (req, res) => {
    const { name, email, phone, dob } = req.body;
    const sql = 'UPDATE users SET name = ?, email = ?, phone = ?, dob = ? WHERE id = ?';
    db.query(sql, [name, email, phone, dob, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User updated successfully' });
    });
});

// 8. ADMIN API: GET ALL REVIEWS (For Review Manager)
app.get('/admin/reviews', (req, res) => {
    const sql = 'SELECT * FROM reviews ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 9. ADMIN API: DELETE REVIEW
app.delete('/reviews/:id', (req, res) => {
    const reviewId = req.params.id;
    const sql = 'DELETE FROM reviews WHERE id = ?';
    db.query(sql, [reviewId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Review deleted successfully' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Vibranium Backend running on port ${PORT}`);
});
