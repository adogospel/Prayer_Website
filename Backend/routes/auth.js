const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// optional: const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXP = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REMEMBER_EXP = process.env.JWT_REMEMBER_EXPIRES_IN || '30d';

/* SIGNUP */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name||!email||!password) return res.status(400).json({ message:'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message:'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash });
    return res.status(201).json({ message: 'User created' });
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }) }
});

/* SIGNIN */
router.post('/signin', async (req, res) => {
  try {
    const { email, password, keep } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const expiresIn = keep ? JWT_REMEMBER_EXP : JWT_EXP;
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn });

    // Send token in response; you may set cookie too:
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: keep ? 30*24*3600*1000 : 3600*1000 // match expiries
    });

    return res.json({ message: 'Signed in', token, user: { name: user.name, email: user.email } });
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }) }
});

/* FORGOT PASSWORD */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message:'Provide email' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ message:'If your email exists, you will receive reset instructions' }); // avoid leaking

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetExpires = Date.now() + 3600*1000; // 1h
    await user.save();

    // send email with reset link (frontend should handle route to reset)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // optional: await sendEmail(email, 'Reset password', `Click: ${resetLink}`);
    console.log('Reset link (dev):', resetLink);

    return res.json({ message: 'If your email exists, you will receive reset instructions' });
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }) }
});

/* RESET PASSWORD (example) */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ message:'Missing fields' });
    const user = await User.findOne({ email, resetToken: token, resetExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message:'Invalid or expired token' });
    user.password = await bcrypt.hash(newPassword, 12);
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();
    return res.json({ message: 'Password reset' });
  } catch(err){ console.error(err); res.status(500).json({ message:'Server error' }) }
});

/* GET /me — verify token */
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message:'Unauthorized' });
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId).select('-password');
    if (!user) return res.status(401).json({ message:'Unauthorized' });
    res.json(user);
  } catch(err){ console.error(err); res.status(401).json({ message: 'Unauthorized' }) }
});

module.exports = router;
