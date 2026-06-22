const mongoose = require("mongoose");

const PlacementReadinessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  candidateType: { 
    type: String, 
    enum: ["fresher", "internship", "experienced"], 
    default: "fresher" 
  },
  overallScore: { type: Number, default: 0, min: 0, max: 100 },
  classification: { 
    type: String, 
    enum: ["Placement Ready", "High Potential Candidate", "Needs Improvement"],
    default: "Needs Improvement"
  },
  weakAreas: [{
    topic: { type: String },
    score: { type: Number, min: 0, max: 100 }
  }],
  communicationGaps: [{ type: String }],
  missingSkills: [{ type: String }],
  roadmap: {
    technologies: [{ type: String }],
    projects: [{ type: String }],
    certifications: [{ type: String }],
    interviewTopics: [{ type: String }]
  },
  scoringConfig: {
    interviewWeight: { type: Number, default: 50 },
    resumeWeight: { type: Number, default: 30 },
    skillBreadthWeight: { type: Number, default: 20 }
  },
  history: [{
    date: { type: Date, default: Date.now },
    score: { type: Number },
    classification: { type: String }
  }],
}, { timestamps: true });

module.exports = mongoose.model("PlacementReadiness", PlacementReadinessSchema);
