const mongoose = require("mongoose");

const LoginActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  email: { type: String, required: true, lowercase: true },
  status: {
    type: String,
    enum: ["success", "failed", "locked", "suspicious"],
    required: true,
  },
  ipAddress: { type: String, default: "unknown" },
  userAgent: { type: String, default: "" },
  deviceInfo: {
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    device: { type: String, default: "Unknown" },
  },
  reason: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

LoginActivitySchema.index({ userId: 1, timestamp: -1 });
LoginActivitySchema.index({ email: 1, timestamp: -1 });
LoginActivitySchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model("LoginActivity", LoginActivitySchema);
