// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors()); // Allows Netlify to talk to Render
app.use(bodyParser.json());

// DATABASE CONNECTION
// REPLACE THESE WITH YOUR ACTUAL CLOUD DATABASE DETAILS
const db = mysql.createConnection({
    host: 'your-cloud-db-host.com', 
    user: 'your-db-user',
    password: 'your-db-password',
    database: 'vibranium_school',
    port: 3306 
});

db.connect(err => {
    if (err) { console.error('DB Connection Error:', err); } 
    else { console.log('Connected to MySQL Database'); }
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