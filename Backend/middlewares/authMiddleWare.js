const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Admin = require('../models/Admin');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);

    // Try to find user or admin
    let user = await User.findById(payload.userId).select('-password');
    if (!user) user = await Admin.findById(payload.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    req.user = user;
    req.role = payload.role || 'user'; // Add role (admin/user)
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = authMiddleware;
