const mongoose = require("mongoose");

const RecruiterSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  companyId: { type: String, required: true },
  companyName: { type: String },
  companyType: { type: String, enum: ['product', 'service', 'startup'] },
  candidateType: { type: String, enum: ['fresher', 'internship', 'experienced'], default: 'fresher' },
  questions: [{
    text: String,
    difficulty: String,
    category: String,
    hash: String
  }],
  answers: [{
    questionIndex: Number,
    answerText: String,
    score: Number,
    feedback: String,
    hash: String,
    skipped: Boolean
  }],
  currentQuestionIndex: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  finalScore: { type: Number, default: null },
  meetsCompanyBar: { type: Boolean, default: null },
  companyFeedback: { type: String },
  totalQuestions: { type: Number, default: 5 },
}, { timestamps: true });

module.exports = mongoose.model("RecruiterSession", RecruiterSessionSchema);
