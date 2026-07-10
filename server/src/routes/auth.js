const express = require('express');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteAccount,
  verifyEmail,
  resendOTP,
  sendActionOTP,
  updateName,
  getLoginHistory,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  getSecurityAlerts
} = require("../controllers/authcontroller.js");
const { protect } = require('../middleware/auth.js');
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/send-action-otp", protect, sendActionOTP);
router.get("/me", protect, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/change-password", protect, changePassword);
router.put("/update-name", protect, updateName);
router.delete("/delete-account", protect, deleteAccount);

// Security Endpoints
router.get("/login-history", protect, getLoginHistory);
router.get("/sessions", protect, getActiveSessions);
router.delete("/sessions/:id", protect, revokeSession);
router.delete("/sessions", protect, revokeAllSessions);
router.get("/security-alerts", protect, getSecurityAlerts);

module.exports = router;