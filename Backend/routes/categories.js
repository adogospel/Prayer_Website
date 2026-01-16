const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const authMiddleware = require('../middlewares/authMiddleWare');

// Get all categories
router.get('/', async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

// 🔐 Protected: only admin can create
router.post('/', authMiddleware, async (req, res) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const existing = await Category.findOne({ name });
  if (existing) return res.status(400).json({ message: 'Category already exists' });

  const cat = new Category({ name });
  await cat.save();
  res.json({ message: '✅ Category added successfully', cat });
});

// Add new category
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const existing = await Category.findOne({ name });
  if (existing) return res.status(400).json({ message: 'Category already exists' });

  const cat = new Category({ name });
  await cat.save();
  res.json({ message: '✅ Category added successfully', cat });
});

module.exports = router;
