const Groq = require("groq-sdk");
const Challenge = require("../models/Challenge.js");
const ChallengeEntry = require("../models/ChallengeEntry.js");
const UserArenaProfile = require("../models/UserArenaProfile.js");
const User = require("../models/User.js");
const { groqRetry } = require("../utils/groqRetry.js");
const { computeNewBadges, computeRankLabel } = require("../utils/badgeEngine.js");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES = ["Technical", "HR", "Aptitude", "Domain"];

const categoryPrompts = {
  Technical: `You are generating a TECHNICAL interview challenge. Focus on programming concepts, data structures, algorithms, system design, or software engineering principles. Questions should test analytical and coding knowledge.`,
  HR: `You are generating an HR interview challenge. Focus on behavioral questions, situational scenarios, communication, teamwork, leadership, conflict resolution, and career motivation. Questions should assess soft skills and professional mindset.`,
  Aptitude: `You are generating an APTITUDE challenge. Focus on logical reasoning, quantitative aptitude, verbal reasoning, pattern recognition, problem-solving, and critical thinking. Questions should test general intelligence and reasoning ability.`,
  Domain: `You are generating a DOMAIN-SPECIFIC challenge. Cover a mix of topics relevant to modern tech careers: cloud computing, DevOps, databases, networking, cybersecurity, or product management. Questions should test real-world domain knowledge.`,
};

/**
 * Auto-generate challenges if none are active for a given type.
 * Called once on server startup after DB connects.
 */
const generateChallenges = async () => {
  try {
    const now = new Date();

    for (const category of CATEGORIES) {
      // Check if daily still active
      const existingDaily = await Challenge.findOne({
        category,
        type: "daily",
        isActive: true,
        expiresAt: { $gt: now },
      });

      if (!existingDaily) {
        await _createChallenge(category, "daily");
      }

      // Check if weekly still active
      const existingWeekly = await Challenge.findOne({
        category,
        type: "weekly",
        isActive: true,
        expiresAt: { $gt: now },
      });

      if (!existingWeekly) {
        await _createChallenge(category, "weekly");
      }
    }

    // Recalculate global ranks after any change
    await _recalculateGlobalRanks();

    console.log("✅ Arena challenges verified/generated.");
  } catch (err) {
    console.error("❌ Arena challenge generation failed:", err.message);
  }
};

const _createChallenge = async (category, type) => {
  const difficulty = type === "daily" ? "medium" : "hard";
  const expiresAt = new Date();
  if (type === "daily") {
    expiresAt.setHours(expiresAt.getHours() + 24);
  } else {
    expiresAt.setDate(expiresAt.getDate() + 7);
  }

  const prompt = `${categoryPrompts[category]}

Generate a ${type.toUpperCase()} interview challenge with exactly 3 questions.
Difficulty: ${difficulty.toUpperCase()}

Return ONLY valid JSON in this exact format:
{
  "title": "Short catchy challenge title (max 8 words)",
  "description": "1-2 sentence description of what this challenge tests",
  "questions": [
    {
      "questionText": "Full question text here",
      "expectedKeyPoints": ["key point 1", "key point 2", "key point 3"]
    },
    {
      "questionText": "Full question text here",
      "expectedKeyPoints": ["key point 1", "key point 2", "key point 3"]
    },
    {
      "questionText": "Full question text here",
      "expectedKeyPoints": ["key point 1", "key point 2", "key point 3"]
    }
  ]
}`;

  const response = await groqRetry(() =>
    groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert interview challenge designer. Return ONLY valid JSON, no markdown fences.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_tokens: 800,
    })
  );

  let parsed;
  try {
    parsed = JSON.parse(response.choices[0].message.content.trim());
  } catch (e) {
    console.error(`Failed to parse AI response for ${category} ${type} challenge`);
    return;
  }

  await Challenge.create({
    title: parsed.title || `${category} ${type} Challenge`,
    description: parsed.description || `A ${difficulty} ${category.toLowerCase()} challenge.`,
    category,
    type,
    difficulty,
    questions: (parsed.questions || []).slice(0, 3).map((q) => ({
      questionText: q.questionText,
      expectedKeyPoints: q.expectedKeyPoints || [],
      maxScore: 100,
    })),
    isActive: true,
    expiresAt,
  });

  console.log(`✅ Generated ${type} ${category} challenge`);
};

// ─── Get Challenges ────────────────────────────────────────────────────────────

const getChallenges = async (req, res) => {
  try {
    const now = new Date();
    const challenges = await Challenge.find({
      isActive: true,
      expiresAt: { $gt: now },
    }).sort({ category: 1, type: 1, createdAt: -1 });

    // For each challenge, check if this user has already completed it
    const userId = req.userId;
    const challengeIds = challenges.map((c) => c._id);
    const userEntries = await ChallengeEntry.find({
      userId,
      challengeId: { $in: challengeIds },
    }).select("challengeId totalScore rank");

    const completedMap = {};
    userEntries.forEach((e) => {
      completedMap[e.challengeId.toString()] = {
        totalScore: e.totalScore,
        rank: e.rank,
      };
    });

    const result = challenges.map((c) => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category,
      type: c.type,
      difficulty: c.difficulty,
      questionCount: c.questions.length,
      participantCount: c.participantCount,
      expiresAt: c.expiresAt,
      isCompleted: !!completedMap[c._id.toString()],
      myScore: completedMap[c._id.toString()]?.totalScore ?? null,
      myRank: completedMap[c._id.toString()]?.rank ?? null,
    }));

    return res.json({ challenges: result });
  } catch (err) {
    console.error("getChallenges error:", err);
    return res.status(500).json({ message: "Failed to fetch challenges." });
  }
};

// ─── Get Single Challenge (with questions for taking) ─────────────────────────

const getChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge || !challenge.isActive || challenge.expiresAt < new Date()) {
      return res.status(404).json({ message: "Challenge not found or expired." });
    }

    // Check if user already completed it
    const existing = await ChallengeEntry.findOne({
      userId: req.userId,
      challengeId: challenge._id,
    });

    return res.json({
      challenge: {
        _id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        type: challenge.type,
        difficulty: challenge.difficulty,
        questions: challenge.questions,
        expiresAt: challenge.expiresAt,
        participantCount: challenge.participantCount,
      },
      alreadyCompleted: !!existing,
      myEntry: existing || null,
    });
  } catch (err) {
    console.error("getChallenge error:", err);
    return res.status(500).json({ message: "Failed to fetch challenge." });
  }
};

// ─── Submit Challenge ──────────────────────────────────────────────────────────

const submitChallenge = async (req, res) => {
  try {
    const { challengeId, answers, timeTakenSeconds } = req.body;

    if (!challengeId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "challengeId and answers are required." });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge || !challenge.isActive || challenge.expiresAt < new Date()) {
      return res.status(404).json({ message: "Challenge not found or expired." });
    }

    // Prevent double submission
    const existing = await ChallengeEntry.findOne({
      userId: req.userId,
      challengeId,
    });
    if (existing) {
      return res.status(409).json({ message: "You have already completed this challenge.", entry: existing });
    }

    // Score each answer with Groq AI
    const scoredAnswers = [];
    for (let i = 0; i < challenge.questions.length; i++) {
      const question = challenge.questions[i];
      const answerText = answers[i]?.answerText || "";

      if (!answerText.trim()) {
        scoredAnswers.push({
          questionIndex: i,
          questionText: question.questionText,
          answerText: "(No answer provided)",
          score: 0,
          aiFeedback: "No answer was provided for this question.",
        });
        continue;
      }

      const scoringPrompt = `You are evaluating a candidate's answer to an interview challenge question.

Question: "${question.questionText}"
Expected Key Points: ${question.expectedKeyPoints.join(", ")}
Candidate's Answer: "${answerText}"

Evaluate the answer strictly. Return ONLY valid JSON:
{
  "score": <number 0-100>,
  "feedback": "<2-3 sentences of specific, constructive feedback>"
}

Scoring guide:
- 90-100: Excellent. Covers all key points with depth and clarity.
- 70-89: Good. Covers most key points with minor gaps.
- 50-69: Average. Covers some points but lacks depth or accuracy.
- 30-49: Below average. Misses important concepts.
- 0-29: Poor. Largely incorrect or irrelevant answer.`;

      let scored = { score: 0, feedback: "Could not evaluate this answer." };
      try {
        const scoreResp = await groqRetry(() =>
          groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "You are a strict but fair interview evaluator. Return ONLY valid JSON." },
              { role: "user", content: scoringPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 300,
          })
        );
        const parsed = JSON.parse(scoreResp.choices[0].message.content.trim());
        scored.score = Math.min(100, Math.max(0, Math.round(parsed.score || 0)));
        scored.feedback = parsed.feedback || "Evaluated.";
      } catch (e) {
        console.error(`Scoring error for Q${i}:`, e.message);
      }

      scoredAnswers.push({
        questionIndex: i,
        questionText: question.questionText,
        answerText,
        score: scored.score,
        aiFeedback: scored.feedback,
      });
    }

    // Calculate total score (average)
    const totalScore =
      scoredAnswers.length > 0
        ? Math.round(scoredAnswers.reduce((s, a) => s + a.score, 0) / scoredAnswers.length)
        : 0;

    const pointsEarned = Math.round(totalScore / 10); // 0-10 points per challenge

    // Save entry
    const entry = await ChallengeEntry.create({
      userId: req.userId,
      challengeId,
      answers: scoredAnswers,
      totalScore,
      timeTakenSeconds: timeTakenSeconds || 0,
      pointsEarned,
    });

    // Increment participant count
    await Challenge.findByIdAndUpdate(challengeId, { $inc: { participantCount: 1 } });

    // Update rank of this entry within the challenge
    await _updateChallengeRanks(challengeId);

    // Update user's arena profile
    const newBadges = await _updateUserArenaProfile(req.userId, {
      totalScore,
      pointsEarned,
      category: challenge.category,
    });

    // Recalculate global ranks
    await _recalculateGlobalRanks();

    // Fetch fresh entry with rank
    const freshEntry = await ChallengeEntry.findById(entry._id);

    return res.status(201).json({
      entry: freshEntry,
      newBadges,
      message: "Challenge submitted successfully!",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You have already completed this challenge." });
    }
    console.error("submitChallenge error:", err);
    return res.status(500).json({ message: "Failed to submit challenge." });
  }
};

// ─── Update challenge-level ranks ─────────────────────────────────────────────

const _updateChallengeRanks = async (challengeId) => {
  const entries = await ChallengeEntry.find({ challengeId }).sort({ totalScore: -1 });
  for (let i = 0; i < entries.length; i++) {
    await ChallengeEntry.findByIdAndUpdate(entries[i]._id, { rank: i + 1 });
  }
};

// ─── Update global ranks ──────────────────────────────────────────────────────

const _recalculateGlobalRanks = async () => {
  const profiles = await UserArenaProfile.find().sort({ totalPoints: -1, averageScore: -1 });
  for (let i = 0; i < profiles.length; i++) {
    await UserArenaProfile.findByIdAndUpdate(profiles[i]._id, { globalRank: i + 1 });
  }
};

// ─── Update user arena profile + award badges ─────────────────────────────────

const _updateUserArenaProfile = async (userId, { totalScore, pointsEarned, category }) => {
  let profile = await UserArenaProfile.findOne({ userId });

  if (!profile) {
    profile = await UserArenaProfile.create({ userId });
  }

  // Update streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let newStreak = profile.currentStreak;

  if (profile.lastCompletedDate) {
    const lastDate = new Date(profile.lastCompletedDate);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already completed today, streak stays
    } else if (diffDays === 1) {
      newStreak += 1; // Consecutive day
    } else {
      newStreak = 1; // Streak broken
    }
  } else {
    newStreak = 1; // First ever completion
  }

  const newTotal = profile.totalChallengesCompleted + 1;
  const newPoints = profile.totalPoints + pointsEarned;
  const newBestScore = Math.max(profile.bestScore, totalScore);
  const newLongestStreak = Math.max(profile.longestStreak, newStreak);

  // Running average
  const newAverage = Math.round(
    (profile.averageScore * profile.totalChallengesCompleted + totalScore) / newTotal
  );

  // Category stats
  const catStats = profile.categoryStats || {};
  const cat = catStats[category] || { completed: 0, totalScore: 0 };

  // Build updated profile object (plain for badge engine)
  const updatedProfileData = {
    totalChallengesCompleted: newTotal,
    totalPoints: newPoints,
    bestScore: newBestScore,
    averageScore: newAverage,
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastCompletedDate: new Date(),
    badges: profile.badges || [],
    rankHistory: profile.rankHistory || [],
    globalRank: profile.globalRank,
    categoryStats: {
      ...catStats,
      [category]: {
        completed: cat.completed + 1,
        totalScore: cat.totalScore + totalScore,
      },
    },
  };

  // Compute new badges
  const newBadges = computeNewBadges(updatedProfileData);

  // Persist everything
  await UserArenaProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        totalChallengesCompleted: newTotal,
        totalPoints: newPoints,
        bestScore: newBestScore,
        averageScore: newAverage,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCompletedDate: new Date(),
        updatedAt: new Date(),
        [`categoryStats.${category}.completed`]: cat.completed + 1,
        [`categoryStats.${category}.totalScore`]: cat.totalScore + totalScore,
      },
      $push: {
        badges: { $each: newBadges },
        rankHistory: {
          globalRank: profile.globalRank,
          totalPoints: newPoints,
          date: new Date(),
        },
      },
    },
    { upsert: true, new: true }
  );

  return newBadges;
};

// ─── Get Challenge Leaderboard ─────────────────────────────────────────────────

const getChallengeLeaderboard = async (req, res) => {
  try {
    const { challengeId } = req.params;

    const challenge = await Challenge.findById(challengeId).select("title category type difficulty");
    if (!challenge) return res.status(404).json({ message: "Challenge not found." });

    const entries = await ChallengeEntry.find({ challengeId })
      .sort({ totalScore: -1, timeTakenSeconds: 1 })
      .limit(50)
      .lean();

    // Fetch user names
    const userIds = entries.map((e) => e.userId);
    const users = await User.find({ _id: { $in: userIds } }).select("name").lean();
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u.name; });

    const leaderboard = entries.map((e, idx) => ({
      rank: e.rank || idx + 1,
      userId: e.userId,
      userName: userMap[e.userId.toString()] || "Unknown",
      totalScore: e.totalScore,
      pointsEarned: e.pointsEarned,
      timeTakenSeconds: e.timeTakenSeconds,
      completedAt: e.completedAt,
      isMe: e.userId.toString() === req.userId,
    }));

    // Find my entry
    const myEntry = entries.find((e) => e.userId.toString() === req.userId);

    return res.json({ challenge, leaderboard, myEntry: myEntry || null });
  } catch (err) {
    console.error("getChallengeLeaderboard error:", err);
    return res.status(500).json({ message: "Failed to fetch leaderboard." });
  }
};

// ─── Get Global Leaderboard ────────────────────────────────────────────────────

const getGlobalLeaderboard = async (req, res) => {
  try {
    const profiles = await UserArenaProfile.find()
      .sort({ totalPoints: -1, averageScore: -1 })
      .limit(50)
      .lean();

    const userIds = profiles.map((p) => p.userId);
    const users = await User.find({ _id: { $in: userIds } }).select("name").lean();
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u.name; });

    const leaderboard = profiles.map((p, idx) => {
      const rank = computeRankLabel(p.totalPoints);
      return {
        globalRank: p.globalRank || idx + 1,
        userId: p.userId,
        userName: userMap[p.userId.toString()] || "Unknown",
        totalPoints: p.totalPoints,
        totalChallengesCompleted: p.totalChallengesCompleted,
        averageScore: p.averageScore,
        bestScore: p.bestScore,
        currentStreak: p.currentStreak,
        badgeCount: (p.badges || []).length,
        rankLabel: rank.label,
        rankEmoji: rank.emoji,
        isMe: p.userId.toString() === req.userId,
      };
    });

    return res.json({ leaderboard });
  } catch (err) {
    console.error("getGlobalLeaderboard error:", err);
    return res.status(500).json({ message: "Failed to fetch global leaderboard." });
  }
};

// ─── Get My Arena Profile ──────────────────────────────────────────────────────

const getMyArenaProfile = async (req, res) => {
  try {
    let profile = await UserArenaProfile.findOne({ userId: req.userId }).lean();

    if (!profile) {
      // Return a blank profile for new users
      return res.json({
        profile: {
          totalChallengesCompleted: 0,
          totalPoints: 0,
          bestScore: 0,
          averageScore: 0,
          currentStreak: 0,
          longestStreak: 0,
          globalRank: null,
          rankHistory: [],
          badges: [],
          categoryStats: {
            Technical: { completed: 0, totalScore: 0 },
            HR: { completed: 0, totalScore: 0 },
            Aptitude: { completed: 0, totalScore: 0 },
            Domain: { completed: 0, totalScore: 0 },
          },
          rankLabel: "Rookie",
          rankEmoji: "🥉",
        },
      });
    }

    const rank = computeRankLabel(profile.totalPoints);

    return res.json({
      profile: {
        ...profile,
        rankLabel: rank.label,
        rankEmoji: rank.emoji,
      },
    });
  } catch (err) {
    console.error("getMyArenaProfile error:", err);
    return res.status(500).json({ message: "Failed to fetch arena profile." });
  }
};

module.exports = {
  generateChallenges,
  getChallenges,
  getChallenge,
  submitChallenge,
  getChallengeLeaderboard,
  getGlobalLeaderboard,
  getMyArenaProfile,
};
