const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: [true, "Email is required"], 
    lowercase: true, 
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."]
  },
  password: { 
    type: String, 
    required: [true, "Password is required"], 
  },
  role: {
    type: String,
    enum: ['student', 'mentor', 'admin'],
    default: 'student'
  },
  permissions: {
    type: [String],
    default: []
  },
  createdAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  verificationOTP: String,
  verificationOTPExpires: Date,
  actionOTP: String,
  actionOTPExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Admin: Account restriction
  isRestricted: { type: Boolean, default: false },
  restrictedAt: { type: Date, default: null },
  restrictedReason: { type: String, default: null },

  // Security: Account lockout
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },

  // Security: Password policy
  passwordChangedAt: { type: Date, default: Date.now },
  previousPasswords: [{ type: String }],
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model("User", userSchema);
