const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["ai", "user"], required: true },
  content: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  questionNumber: { type: Number },
  scoreAwarded: { type: Number }, // 0-10
  isSkipped: { type: Boolean, default: false },
  isRepeatedAnswer: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

const InterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  domain: { type: String, required: true },
  score: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // minutes
  questionsAnswered: { type: Number, default: 0 },
  messages: [MessageSchema],
  feedback: { type: String, default: "" },
  isComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  
  // Adaptive Engine Fields
  currentDifficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  difficultyHistory: [{
    questionNumber: Number,
    difficulty: String,
    timestamp: { type: Date, default: Date.now }
  }],
  questionHashes: [{ type: String }],
  answerHashes: [{ type: String }],
  skippedCount: { type: Number, default: 0 },
  consecutiveCorrect: { type: Number, default: 0 },
  consecutiveWrong: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 5 },
  questionScores: [{
    questionNumber: Number,
    score: Number,
    difficulty: String,
    question: String,
    answerSummary: String
  }],
  progressionReport: {
    startDifficulty: String,
    endDifficulty: String,
    peakDifficulty: String,
    overallTrajectory: String,
    adaptations: [{ type: String }]
  }
});

module.exports = mongoose.model("Interview", InterviewSchema);
