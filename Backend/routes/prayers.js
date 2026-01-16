const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleWare');
const Prayer = require("../models/prayers");


// === POST NEW PRAYER ===
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { category, request } = req.body;
    if (!category || !request)
      return res.status(400).json({ message: 'Missing fields' });

    const prayer = new Prayer({ user: req.user.name, category, request });
    await prayer.save();
    res.status(201).json(prayer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// === GET ALL PRAYERS ===
router.get('/', async (req, res) => {
  try {
    const prayers = await Prayer.find().sort({ date: -1 });
    res.json(prayers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// === Increment pray count ===
router.post('/:id/pray', authMiddleware, async (req, res) => {
  const prayer = await Prayer.findById(req.params.id);
  if (!prayer) return res.status(404).json({ message: 'Prayer not found' });

  const userId = req.user.id;

  // Check if user already prayed
  if (prayer.prayedBy.includes(userId)) {
    return res.status(400).json({ message: 'You already prayed for this request' });
  }

  // Add user to prayedBy list
  prayer.prayedBy.push(userId);
  prayer.prayCount++;
  await prayer.save();

  res.json({ prayCount: prayer.prayCount });
});

// === Add comment and increment pray count ===
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Missing comment' });

    const prayer = await Prayer.findById(req.params.id);
    if (!prayer) return res.status(404).json({ message: 'Prayer not found' });

    // Add comment with current user
    prayer.comments.push({ user: req.user.name, text });
    prayer.prayCount += 1; // increment prayer count
    await prayer.save();

    res.json({ comments: prayer.comments, prayCount: prayer.prayCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post("/:id/share", async (req, res) => {
  try {
    const prayer = await Prayer.findByIdAndUpdate(
      req.params.id,
      { $inc: { shareCount: 1 } },
      { new: true }
    );

    if (!prayer) {
      return res.status(404).json({ message: "Prayer not found" });
    }

    res.json({ shareCount: prayer.shareCount });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
