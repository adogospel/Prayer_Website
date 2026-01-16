const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: String,
  text: String,
  date: { type: Date, default: Date.now }
});

const prayerSchema = new mongoose.Schema({
  user: { type: String, required: true },
  request: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
  prayCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  comments: [commentSchema],
  prayedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Prayer", prayerSchema);
