const router = require("express").Router();
const Teaching = require("../models/Teaching");
const authMiddleware = require("../middlewares/authMiddleWare");

// GET all teachings
router.get("/", async (req, res) => {
  const teachings = await Teaching
    .find()
    .populate("category", "name")
    .sort({ createdAt: -1 });

  res.json(teachings);
});

// POST teaching (ADMIN)
router.post("/", authMiddleware, async (req, res) => {
  const { title, description, videoUrl, speaker, category } = req.body;

  if (!title || !videoUrl || !category)
    return res.status(400).json({ message: "Missing fields" });

  const teaching = await Teaching.create({
    title,
    description,
    videoUrl,
    speaker,
    category
  });

  res.json({ message: "Teaching published", teaching });
});



module.exports = router;
