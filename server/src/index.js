require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db.js");
const authRoutes = require("./routes/auth.js");
const interviewRoutes = require("./routes/interview.js");
const resumeRoutes = require("./routes/resume.js");
const placementRoutes = require("./routes/placementRoutes.js");


connectDB();
const app = express();

// Allow both localhost (dev) and production (Vercel) origins
const allowedOrigins = [
  "http://localhost:3000",
];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ""));
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Secure HTTP headers
app.use(helmet());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection (Express 5 compatible)
app.use((req, res, next) => {
  ['body', 'params', 'headers'].forEach((key) => {
    if (req[key]) {
      req[key] = mongoSanitize.sanitize(req[key]);
    }
  });
  // In Express 5, req.query is read-only. We mutate the object in-place instead of reassigning it.
  if (req.query) {
    mongoSanitize.sanitize(req.query);
  }
  next();
});

// ── Rate Limiters ─────────────────────────────────────────
// General API limiter
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down and try again in a moment." },
});

// Stricter limiter for AI-powered interview endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8, // 8 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "You're sending answers too quickly! Take a breath and try again in a few seconds." },
});

// Resume analysis limiter (most expensive call)
const resumeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3, // 3 resume analyses per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Resume analysis is processing. Please wait a moment before trying again." },
});

// Extremely strict limiter for authentication endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login/registration attempts. Please try again after 15 minutes." },
});

// Spam protection limiter specifically for sending OTPs/Emails
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 OTP requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "You are requesting too many codes. Please check your email or try again later." },
});

// Apply strict auth limiter explicitly to sensitive paths BEFORE the router
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// Apply spam protection to OTP routes
app.use("/api/auth/resend-otp", otpLimiter);
app.use("/api/auth/send-action-otp", otpLimiter);

app.use("/api/auth", generalLimiter, authRoutes);
app.use("/api/interviews", aiLimiter, interviewRoutes);
app.use("/api/resume", resumeLimiter, resumeRoutes);
app.use("/api/placement", aiLimiter, placementRoutes);
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Backend is running!");
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`),
);
