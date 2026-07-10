const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  expectedKeyPoints: [{ type: String }], // hints for AI evaluator
  maxScore: { type: Number, default: 100 },
});

const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ["Technical", "HR", "Aptitude", "Domain"],
    required: true,
  },
  type: { type: String, enum: ["daily", "weekly"], required: true },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  questions: [QuestionSchema],
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  participantCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Ensure no two active challenges of the same category + type overlap
ChallengeSchema.index({ category: 1, type: 1, expiresAt: 1 });

module.exports = mongoose.model("Challenge", ChallengeSchema);
