const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const Session = require("../models/Session.js");
const LoginActivity = require("../models/LoginActivity.js");
const Interview = require("../models/Interview.js");
const crypto = require("crypto");
const { parseUserAgent, getClientIP } = require("../utils/deviceParser.js");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
    }

    let user = await User.findOne({ email });
    if (user) {
      if (user.isVerified) {
        return res.status(409).json({ message: "Email already in use. Please log in with your correct password." });
      }
      user.password = password;
      user.name = name;
    } else {
      user = new User({ name, email, password, isVerified: false });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = otp;
    user.verificationOTPExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    const { error } = await resend.emails.send({
      from: 'noreply@sahilmauryadev.com',
      to: user.email,
      subject: "Verify Your Email Address",
      text: `Your verification code is: ${otp}\n\nIt expires in 5 minutes.`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #111827; margin-top: 0;">Verify your email address</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Here is your verification code to complete your registration:</p>
          <div style="background-color: #f3f4f6; padding: 16px 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">${otp}</span>
          </div>
          <p style="color: #4b5563; font-size: 14px;">This code will expire in 5 minutes.</p>
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #4b5563; font-size: 14px;">
            Best regards,<br/>
            <strong style="color: #111827; font-size: 16px;">Sahil (Kairos)</strong><br/>
            Developer
          </div>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    res.status(201).json({
      message: "Please check your email to verify your account.",
      requiresVerification: true,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "";
    const fingerprint = req.headers["x-device-fingerprint"] || "";
    const deviceInfo = parseUserAgent(userAgent, fingerprint);

    const user = await User.findOne({ email });

    // Handle unknown user
    if (!user) {
      await LoginActivity.create({
        email,
        status: "failed",
        ipAddress,
        userAgent,
        deviceInfo,
        reason: "invalid_credentials",
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      await LoginActivity.create({
        userId: user._id,
        email,
        status: "locked",
        ipAddress,
        userAgent,
        deviceInfo,
        reason: "account_locked",
      });
      return res.status(423).json({ 
        message: `Account locked due to multiple failed attempts. Please try again in ${waitMinutes} minute(s).` 
      });
    }

    // Handle wrong password
    if (!(await user.comparePassword(password))) {
      user.failedLoginAttempts += 1;
      let reason = "invalid_credentials";
      
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins lock
        reason = "account_locked_due_to_max_failures";
      }
      
      await user.save();
      await LoginActivity.create({
        userId: user._id,
        email,
        status: "failed",
        ipAddress,
        userAgent,
        deviceInfo,
        reason,
      });

      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Handle unverified email
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Please verify your email address before logging in.", 
        requiresVerification: true, 
        email: user.email 
      });
    }

    // Successful login -> Reset lock counters
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Detect suspicious login (new IP or new Device type compared to last 5 logins)
    const recentLogins = await LoginActivity.find({ userId: user._id, status: "success" })
      .sort({ timestamp: -1 })
      .limit(5);
    
    let isSuspicious = false;
    if (recentLogins.length > 0) {
      const knownIps = recentLogins.map(l => l.ipAddress);
      const knownDevices = recentLogins.map(l => l.deviceInfo.device);
      if (!knownIps.includes(ipAddress) && !knownDevices.includes(deviceInfo.device)) {
        isSuspicious = true;
      }
    }

    // Log the activity
    await LoginActivity.create({
      userId: user._id,
      email,
      status: isSuspicious ? "suspicious" : "success",
      ipAddress,
      userAgent,
      deviceInfo,
      reason: isSuspicious ? "unrecognized_device_and_ip" : "",
    });

    // Generate JWT token
    const token = signToken(user._id.toString());
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Revoke all other sessions to prevent duplicate sessions from multiple devices
    await Session.updateMany({ userId: user._id, isRevoked: false }, { isRevoked: true });

    // Create session record
    await Session.create({
      userId: user._id,
      tokenHash,
      deviceInfo,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days (matches jwt expiry)
    });

    // Send security alert if suspicious
    if (isSuspicious) {
      resend.emails.send({
        from: 'noreply@sahilmauryadev.com',
        to: user.email,
        subject: "Security Alert: New Login Detected",
        text: `We detected a new login from ${deviceInfo.browser} on ${deviceInfo.os}. IP: ${ipAddress}`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #111827; margin-top: 0;">New Login Detected</h2>
            <p style="color: #4b5563;">We noticed a new login to your Rivolo account from an unrecognized device or location.</p>
            <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #fecaca;">
              <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>Device:</strong> ${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.device})</p>
              <p style="margin: 0; color: #991b1b;"><strong>IP Address:</strong> ${ipAddress}</p>
            </div>
            <p style="color: #4b5563; font-size: 14px;">If this was you, you can ignore this email. If you don't recognize this activity, please log in and change your password immediately.</p>
          </div>
        `,
      }).catch(err => console.error("Failed to send security alert:", err));
    }

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email is already verified" });
    
    if (user.verificationOTP !== otp || user.verificationOTPExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired verification code." });
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();

    const token = signToken(user._id.toString());
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const ipAddress = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "";
    const fingerprint = req.headers["x-device-fingerprint"] || "";
    const deviceInfo = parseUserAgent(userAgent, fingerprint);

    // Create session record
    await Session.create({
      userId: user._id,
      tokenHash,
      deviceInfo,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days (matches jwt expiry)
    });

    // Log the activity
    await LoginActivity.create({
      userId: user._id,
      email: user.email,
      status: "success",
      ipAddress,
      userAgent,
      deviceInfo,
      reason: "first_login_after_verification",
    });

    res.json({
      message: "Email verified successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email is already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = otp;
    user.verificationOTPExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const { error } = await resend.emails.send({
      from: 'noreply@sahilmauryadev.com',
      to: user.email,
      subject: "Verify Your Email Address (Resend)",
      text: `Your new verification code is: ${otp}\n\nIt expires in 5 minutes.`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #111827; margin-top: 0;">Verify your email address</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Here is your new verification code:</p>
          <div style="background-color: #f3f4f6; padding: 16px 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">${otp}</span>
          </div>
          <p style="color: #4b5563; font-size: 14px;">This code will expire in 15 minutes.</p>
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #4b5563; font-size: 14px;">
            Best regards,<br/>
            <strong style="color: #111827; font-size: 16px;">Sahil (Kairos)</strong><br/>
            Developer
          </div>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({ message: "A new verification code has been sent to your email." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If an account with that email exists, a verification code has been sent." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
    
    user.resetPasswordToken = hashedOTP;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const { error } = await resend.emails.send({
      from: 'noreply@sahilmauryadev.com',
      to: user.email,
      subject: "Password Reset Code",
      text: `Your password reset code is ${otp}. It will expire in 15 minutes.`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #111827; margin-top: 0;">Password Reset Code</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">You requested a password reset. Here is your verification code:</p>
          <div style="background-color: #f3f4f6; padding: 16px 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">${otp}</span>
          </div>
          <p style="color: #4b5563; font-size: 14px;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #4b5563; font-size: 14px;">
            Best regards,<br/>
            <strong style="color: #111827; font-size: 16px;">Sahil (Kairos)</strong><br/>
            Developer
          </div>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }
    
    res.status(200).json({ 
      message: "If an account with that email exists, a verification code has been sent."
    });
  } catch (err) {
    res.status(500).json({ message: "Error sending email", error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." });
    }
    
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedOTP,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "OTP is invalid or has expired" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password successfully reset" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const sendActionOTP = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.actionOTP = otp;
    user.actionOTPExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    const { error } = await resend.emails.send({
      from: 'noreply@sahilmauryadev.com',
      to: user.email,
      subject: "Action Authorization Code",
      text: `Your authorization code is: ${otp}\n\nIt expires in 5 minutes.`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #111827; margin-top: 0;">Authorization Required</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">You requested to perform a sensitive action on your account. Here is your authorization code:</p>
          <div style="background-color: #f3f4f6; padding: 16px 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #dc2626;">${otp}</span>
          </div>
          <p style="color: #4b5563; font-size: 14px;">This code will expire in 5 minutes. If you did not request this, please secure your account immediately.</p>
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #4b5563; font-size: 14px;">
            Best regards,<br/>
            <strong style="color: #111827; font-size: 16px;">Sahil (Kairos)</strong><br/>
            Developer
          </div>
        </div>
      `,
    });

    if (error) throw new Error(error.message);

    res.status(200).json({ message: "An authorization code has been sent to your email." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body;
    if (!currentPassword || !newPassword || !otp) {
      return res.status(400).json({ message: "Current password, new password, and OTP are required" });
    }

    const user = await User.findById(req.userId);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    if (user.actionOTP !== otp || user.actionOTPExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired authorization code." });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." });
    }

    // Enterprise Security: Password History Check
    const bcrypt = require("bcryptjs");
    if (user.previousPasswords && user.previousPasswords.length > 0) {
      for (const oldHash of user.previousPasswords) {
        if (await bcrypt.compare(newPassword, oldHash)) {
          return res.status(400).json({ message: "You cannot reuse any of your last 3 passwords." });
        }
      }
    }

    // Save old password to history
    user.previousPasswords.unshift(user.password);
    if (user.previousPasswords.length > 3) {
      user.previousPasswords = user.previousPasswords.slice(0, 3);
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    user.actionOTP = undefined;
    user.actionOTPExpires = undefined;
    await user.save();

    // Revoke all existing sessions so user has to log in again on all devices
    await Session.updateMany({ userId: user._id }, { isRevoked: true });
    
    res.json({ message: "Password updated successfully. All other devices have been logged out." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { password, otp } = req.body;
    if (!password || !otp) {
      return res.status(400).json({ message: "Password and OTP are required to confirm account deletion" });
    }

    const user = await User.findById(req.userId);
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    if (user.actionOTP !== otp || user.actionOTPExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired authorization code." });
    }

    await Interview.deleteMany({ userId: req.userId });
    await Session.deleteMany({ userId: req.userId });
    await LoginActivity.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateName = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name.trim();
    await user.save();

    res.json({ message: "Name updated successfully", user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── Enterprise Security Endpoints ─────────────────────────────────────────

const getLoginHistory = async (req, res) => {
  try {
    const history = await LoginActivity.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId, isRevoked: false })
      .sort({ lastActiveAt: -1 });
    
    // Mark current session
    const currentSessionId = req.sessionId ? req.sessionId.toString() : null;
    
    const formattedSessions = sessions.map(s => ({
      id: s._id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: s._id.toString() === currentSessionId
    }));

    res.json({ sessions: formattedSessions });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findOne({ _id: id, userId: req.userId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    session.isRevoked = true;
    await session.save();
    
    res.json({ message: "Session revoked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const revokeAllSessions = async (req, res) => {
  try {
    const currentSessionId = req.sessionId;
    
    // Revoke all EXCEPT current session
    await Session.updateMany(
      { userId: req.userId, _id: { $ne: currentSessionId }, isRevoked: false },
      { isRevoked: true }
    );
    
    res.json({ message: "All other sessions revoked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getSecurityAlerts = async (req, res) => {
  try {
    const alerts = await LoginActivity.find({ 
      userId: req.userId, 
      status: { $in: ["locked", "suspicious"] } 
    })
      .sort({ timestamp: -1 })
      .limit(10);
      
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
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
};
