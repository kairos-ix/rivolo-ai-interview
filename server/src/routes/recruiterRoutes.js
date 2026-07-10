const express = require("express");
const router = express.Router();
const { startSession, submitAnswer, getSession, getHistory } = require("../controllers/recruiterController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/rbac");

router.use(protect);
router.use(authorizeRoles("mentor", "admin"));

router.post("/start", startSession);
router.post("/answer", submitAnswer);
router.get("/history", getHistory);
router.get("/session/:sessionId", getSession);

module.exports = router;
