const mongoose = require("mongoose");

const BadgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  emoji: { type: String },
  earnedAt: { type: Date, default: Date.now },
});

const RankHistorySchema = new mongoose.Schema({
  globalRank: { type: Number },
  totalPoints: { type: Number },
  date: { type: Date, default: Date.now },
});

const UserArenaProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  totalChallengesCompleted: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  bestScore: { type: Number, default: 0 }, // highest single challenge score (0-100)
  averageScore: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 }, // consecutive days with at least 1 completion
  longestStreak: { type: Number, default: 0 },
  lastCompletedDate: { type: Date, default: null },
  globalRank: { type: Number, default: null },
  rankHistory: [RankHistorySchema],
  badges: [BadgeSchema],
  // Category-specific stats
  categoryStats: {
    Technical: { completed: { type: Number, default: 0 }, totalScore: { type: Number, default: 0 } },
    HR: { completed: { type: Number, default: 0 }, totalScore: { type: Number, default: 0 } },
    Aptitude: { completed: { type: Number, default: 0 }, totalScore: { type: Number, default: 0 } },
    Domain: { completed: { type: Number, default: 0 }, totalScore: { type: Number, default: 0 } },
  },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserArenaProfile", UserArenaProfileSchema);
