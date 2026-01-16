const mongoose = require("mongoose");

const TeachingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    videoUrl: { type: String, required: true },
    speaker: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeachingCategory",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teaching", TeachingSchema);
