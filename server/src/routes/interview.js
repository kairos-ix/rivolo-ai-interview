const express = require("express");
const {
  startInterview,
  submitAnswer,
  getInterviews,
  getInterview,
  deleteInterview,
  deleteAllInterviews,
} = require("../controllers/interviewcontroller.js");
const { protect } = require("../middleware/auth.js");

const router = express.Router();

router.use(protect); // all routes require auth

router.post("/start", startInterview);
router.post("/submit-answer", submitAnswer);
router.get("/", getInterviews);
router.get("/:id", getInterview);
router.delete("/", deleteAllInterviews);
router.delete("/:id", deleteInterview);

module.exports = router;
