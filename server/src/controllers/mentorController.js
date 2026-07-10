const Interview = require("../models/Interview");
const User = require("../models/User");

/**
 * @desc    Get all completed student interviews for review
 * @route   GET /api/mentor/interviews
 * @access  Private/Mentor
 */
const getStudentInterviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Only get completed interviews
    const query = { isComplete: true };

    const interviews = await Interview.find(query)
      .populate("userId", "name email isRestricted")
      .populate("reviewedBy", "name")
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Interview.countDocuments(query);

    res.json({
      interviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching interviews", error: error.message });
  }
};

/**
 * @desc    Submit mentor feedback for an interview
 * @route   POST /api/mentor/interviews/:id/feedback
 * @access  Private/Mentor
 */
const submitFeedback = async (req, res) => {
  try {
    const { feedback } = req.body;
    
    if (!feedback || feedback.trim() === '') {
      return res.status(400).json({ message: "Feedback content is required" });
    }

    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    interview.mentorFeedback = feedback;
    interview.reviewedBy = req.user._id;
    await interview.save();

    res.json({ 
      message: "Feedback submitted successfully",
      interview
    });
  } catch (error) {
    res.status(500).json({ message: "Error submitting feedback", error: error.message });
  }
};

module.exports = {
  getStudentInterviews,
  submitFeedback
};
