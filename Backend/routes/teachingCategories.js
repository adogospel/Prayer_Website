const router = require("express").Router();
const TeachingCategory = require("../models/TeachingCategory");
const authMiddleware = require('../middlewares/authMiddleWare');

// Get all categories
router.get("/", async (req, res) => {
  const cats = await TeachingCategory.find().sort("name");
  res.json(cats);
});

// Create category (admin only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const cat = await TeachingCategory.create({ name: req.body.name });
    res.json({ message: "Category added", cat });
  } catch {
    res.status(400).json({ message: "Category already exists" });
  }
});

module.exports = router;
