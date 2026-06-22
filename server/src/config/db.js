const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.log("Server will continue running. DB-dependent routes will return errors.");
    // Retry connection after 10 seconds
    setTimeout(() => {
      console.log("Retrying MongoDB connection...");
      connectDB();
    }, 10000);
  }
};

module.exports = connectDB;

