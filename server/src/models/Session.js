const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tokenHash: { type: String, required: true },
  deviceInfo: {
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    device: { type: String, default: "Unknown" },
  },
  ipAddress: { type: String, default: "unknown" },
  lastActiveAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
});

SessionSchema.index({ userId: 1, isRevoked: 1 });
SessionSchema.index({ tokenHash: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup

module.exports = mongoose.model("Session", SessionSchema);
