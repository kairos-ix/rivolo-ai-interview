const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { getStudentInterviews, submitFeedback } = require('../controllers/mentorController');

// All mentor routes require authentication and the 'mentor' or 'admin' role
router.use(protect);
router.use(authorizeRoles('mentor', 'admin'));

router.get('/interviews', getStudentInterviews);
router.post('/interviews/:id/feedback', submitFeedback);

module.exports = router;
