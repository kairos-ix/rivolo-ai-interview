const express = require("express");
const {
  generateReadiness,
  getReadiness,
  updateScoringConfig,
} = require("../controllers/placementcontroller.js");
const { protect } = require("../middleware/auth.js");

const router = express.Router();

router.use(protect); // all routes require auth

router.get("/", getReadiness);
router.post("/generate", generateReadiness);
router.patch("/config", updateScoringConfig);

module.exports = router;
