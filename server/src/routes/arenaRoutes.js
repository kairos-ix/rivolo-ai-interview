const express = require("express");
const router = express.Router();
const {
  getChallenges,
  getChallenge,
  submitChallenge,
  getChallengeLeaderboard,
  getGlobalLeaderboard,
  getMyArenaProfile,
} = require("../controllers/arenaController");
const { protect } = require("../middleware/auth");

// All arena routes require authentication
router.use(protect);

// Challenge routes
router.get("/challenges", getChallenges);
router.get("/challenges/:id", getChallenge);
router.post("/challenges/submit", submitChallenge);

// Leaderboard routes
router.get("/leaderboard/global", getGlobalLeaderboard);
router.get("/leaderboard/:challengeId", getChallengeLeaderboard);

// Profile
router.get("/my-profile", getMyArenaProfile);

module.exports = router;
