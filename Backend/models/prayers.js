import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const prayerSchema = new mongoose.Schema({
  user: { type: String, required: true },
  request: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
  prayCount: { type: Number, default: 0 },
  comments: [commentSchema],
  prayedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // 👈 to track who prayed
});

const Prayer = mongoose.model('Prayer', prayerSchema);
export default Prayer;
