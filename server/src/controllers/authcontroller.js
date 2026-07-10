const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const Interview = require("../models/Interview.js");
const crypto = require("crypto");
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

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Please verify your email address before logging in.", 
        requiresVerification: true, 
        email: user.email 
      });
    }

    const token = signToken(user._id.toString());

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

    user.password = newPassword;
    user.actionOTP = undefined;
    user.actionOTPExpires = undefined;
    await user.save();
    
    res.json({ message: "Password updated successfully" });
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
  updateName
};
