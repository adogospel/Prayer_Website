const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');
const Category = require('../models/Category');
const authMiddleware = require('../middlewares/authMiddleWare');

// === Ensure uploads folder exists ===
const uploadPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// === Multer setup ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// 🔐 Protected route: only admins can upload
router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'file', maxCount: 1 },   // PDF
    { name: 'image', maxCount: 1 }   // Book image
  ]),
  async (req, res) => {
    if (req.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    try {
      const { title, description, category } = req.body;

      const pdfFile = req.files['file'] ? req.files['file'][0].filename : null;
      const imageFile = req.files['image'] ? req.files['image'][0].filename : null;

      if (!pdfFile || !imageFile) {
        return res.status(400).json({ message: 'Both PDF and image are required.' });
      }

      const book = new Book({
        title,
        description,
        category,
        fileUrl: `/uploads/${pdfFile}`,
        imageUrl: `/uploads/${imageFile}`
      });

      await book.save();

      res.json({ message: '✅ Book uploaded successfully', book });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error uploading book' });
    }
  }
);

// === Get all books ===
router.get('/', async (req, res) => {
  const { category } = req.query;
  const filter = category && category !== 'all' ? { category } : {};
  const books = await Book.find(filter).populate('category');
  res.json(books);
});

module.exports = router;
