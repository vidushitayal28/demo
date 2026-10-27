import mongoose from "mongoose";

const moodSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mood: {
      type: String,
      required: [true, "Please choose a mood."],
      enum: ["Happy", "Excited", "Calm", "Neutral", "Sad", "Anxious", "Angry"]
    },
    intensity: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 3
    },
    note: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes must be 1000 characters or fewer."],
      default: ""
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 8,
        message: "Please use no more than 8 tags."
      }
    }
  },
  { timestamps: true }
);

moodSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Mood", moodSchema);
