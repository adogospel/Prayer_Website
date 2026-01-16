// routes/adminAuth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Admin model
const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

// REGISTER admin
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existing = await Admin.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Admin already exists' });

    // ⚡ Don't hash manually — model handles it automatically
    const admin = new Admin({ username, password });
    await admin.save();

    res.json({ message: '✅ Admin created successfully' });
  } catch (err) {
    console.error('❌ Admin register error:', err);
    res.status(500).json({ message: err.message || 'Error creating admin' });
  }
});

// LOGIN admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });

    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    // TEST:
    console.log('--- LOGIN ATTEMPT DIAGNOSTIC ---');
    console.log('Received Username:', username);
    console.log('Received Password Length:', password ? password.length : 'undefined');
    
    console.log('Received Password Value:', `"${password}"`); 
    console.log('Stored hash from DB:', admin.password);

    console.log('-------------------------------');


    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ userId: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '3h' });

    res.json({ message: '✅ Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

module.exports = router;
