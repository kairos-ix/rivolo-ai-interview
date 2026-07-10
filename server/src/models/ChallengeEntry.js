const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  questionText: { type: String },
  answerText: { type: String, required: true },
  score: { type: Number, default: 0 }, // 0-100
  aiFeedback: { type: String, default: "" },
});

const ChallengeEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Challenge",
    required: true,
  },
  answers: [AnswerSchema],
  totalScore: { type: Number, default: 0 }, // 0-100 average
  rank: { type: Number, default: null }, // rank among all entries for this challenge
  timeTakenSeconds: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
});

// Prevent double-submission
ChallengeEntrySchema.index({ userId: 1, challengeId: 1 }, { unique: true });

module.exports = mongoose.model("ChallengeEntry", ChallengeEntrySchema);
