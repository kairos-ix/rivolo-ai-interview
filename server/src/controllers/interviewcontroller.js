const Groq = require("groq-sdk");
const Interview = require("../models/Interview.js");
const { groqRetry } = require("../utils/groqRetry.js");
const {
  computeNextDifficulty,
  hashText,
  isDuplicateQuestion,
  isRepeatedAnswer,
  generateProgressionReport
} = require("../utils/adaptiveEngine.js");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const systemPrompt = (domain, difficulty) =>
  `
You are Rivolo, a senior technical interviewer created by Sahil (also known as kairos). You are conducting a mock interview for a ${domain} developer role.
Ask one clear, specific technical question at a time. The difficulty level for this question should be ${difficulty.toUpperCase()}.
After the candidate answers, provide feedback and the next question.

If the user asks about your name or who created you, explicitly state that your name is Rivolo and your developer is Sahil (also known as kairos).

Return ONLY the question, nothing else.
`.trim();

// ── Start Interview ───────────────────────────────────────
const startInterview = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ message: "Domain is required" });

    const currentDifficulty = "medium";

    const completion = await groqRetry(() =>
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt(domain, currentDifficulty) },
          {
            role: "user",
            content: `Start the interview. Ask me the first ${domain} technical question at a ${currentDifficulty.toUpperCase()} difficulty level. Only ask the question, no preamble.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      })
    );

    const firstQuestion =
      completion.choices[0].message.content ||
      "Tell me about yourself and your experience.";

    const qHash = hashText(firstQuestion);

    const interview = await Interview.create({
      userId: req.userId,
      domain,
      currentDifficulty,
      totalQuestions: 5,
      messages: [{ 
        role: "ai", 
        content: firstQuestion, 
        difficulty: currentDifficulty,
        questionNumber: 1
      }],
      difficultyHistory: [{
        questionNumber: 1,
        difficulty: currentDifficulty
      }],
      questionHashes: [qHash]
    });

    res.status(201).json({
      sessionId: interview._id,
      question: firstQuestion,
      difficulty: currentDifficulty
    });
  } catch (err) {
    console.error("startInterview error:", err);
    res
      .status(500)
      .json({ message: "Failed to start interview", error: err.message });
  }
};

// ── Submit Answer ─────────────────────────────────────────
const submitAnswer = async (req, res) => {
  try {
    const {
      sessionId,
      answer,
      domain = "General",
      questionsAnswered = 0,
    } = req.body;

    if (!sessionId || !answer)
      return res.status(400).json({ message: "Missing required fields" });

    const interview = await Interview.findOne({
      _id: sessionId,
      userId: req.userId,
    });
    if (!interview)
      return res.status(404).json({ message: "Session not found" });

    const lastAiMessage = interview.messages.filter(m => m.role === "ai").pop();
    const currentQuestion = lastAiMessage ? lastAiMessage.content : "General introduction";
    const currentQNum = questionsAnswered + 1;

    // Detect repeated answer
    const isRepeated = isRepeatedAnswer(answer, interview.answerHashes);
    if (!isRepeated) {
      interview.answerHashes.push(hashText(answer));
    }

    // 1️⃣ Generate feedback on the answer
    const feedbackResponse = await groqRetry(() =>
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are Rivolo, a friendly and experienced technical interviewer created by Sahil (kairos).
You are evaluating an answer for a ${domain} developer role to a ${interview.currentDifficulty.toUpperCase()} difficulty question.
Your tone should be human, conversational, encouraging, and natural.

Instructions:
1. If the candidate attempts to answer the technical question, evaluate it naturally, gently correct mistakes, and provide a brief explanation if they missed something.
2. If the candidate says they don't know, explicitly asks to skip, or asks for help, HAPPILY and THOROUGHLY explain the concept to them like an expert supportive mentor. Use a detailed, easy-to-understand explanation, provide a concrete real-world example or code snippet, and use bullet points where appropriate to make it highly readable for interview prep.
3. If the candidate asks who you are or who made you, simply say you are Rivolo, an AI Interviewer.
4. If the candidate explicitly asks to end, finish, or stop the interview, acknowledge it gracefully.
5. Use markdown formatting (bold, italics, code blocks, lists) to format your feedback beautifully.

You MUST respond in JSON format with these exact keys:
- "feedback": Your comprehensive conversational response and explanation (can be multi-paragraph with markdown). Do NOT ask the next question here.
- "scoreOutOf10": A number from 0 to 10 rating the answer (0 if skipped or totally wrong, 10 for perfect).
- "isSkipped": boolean. True ONLY if the candidate explicitly skipped, said "I don't know", or didn't attempt the technical aspect.
- "isEndRequested": boolean. True ONLY if the candidate explicitly wants to end or stop the interview right now.`
          },
          {
            role: "user",
            content: `Question asked: "${currentQuestion}"\nCandidate's Answer: "${answer}"\nIs this a repeated/lazy answer? ${isRepeated ? 'Yes' : 'No'}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 800,
      })
    );

    let parsed;
    try {
      parsed = JSON.parse(feedbackResponse.choices[0].message.content.trim());
    } catch (e) {
      parsed = { feedback: "Thank you for your response.", scoreOutOf10: 5, isSkipped: false, isEndRequested: false };
    }
    
    let feedback = parsed.feedback || "Thank you for your response.";
    if (isRepeated) {
      feedback = "I noticed this answer is very similar to a previous one. " + feedback;
      parsed.scoreOutOf10 = Math.max(0, (parsed.scoreOutOf10 || 0) - 3); // Penalty
    }

    const scoreAwarded = parsed.scoreOutOf10 || 0;
    const isSkipped = parsed.isSkipped || false;
    const isEndRequested = parsed.isEndRequested || false;

    // Update consecutive counters and get next difficulty
    if (isSkipped) {
      interview.skippedCount += 1;
    }
    
    let isCorrect = scoreAwarded >= 7;
    let isWrong = scoreAwarded < 5 && !isSkipped;
    
    let newConsecutiveCorrect = isCorrect ? interview.consecutiveCorrect + 1 : 0;
    let newConsecutiveWrong = isWrong ? interview.consecutiveWrong + 1 : 0;

    const { nextDifficulty, adaptationReason, newConsecutiveCorrect: ncc, newConsecutiveWrong: ncw } = 
      computeNextDifficulty(interview.currentDifficulty, newConsecutiveCorrect, newConsecutiveWrong, isSkipped);

    interview.consecutiveCorrect = ncc;
    interview.consecutiveWrong = ncw;
    
    if (adaptationReason && !interview.progressionReport) {
        interview.progressionReport = { adaptations: [] };
    }
    if (adaptationReason) {
        if (!interview.progressionReport) interview.progressionReport = { adaptations: [] };
        if (!interview.progressionReport.adaptations) interview.progressionReport.adaptations = [];
        interview.progressionReport.adaptations.push(`After Q${currentQNum}: ${adaptationReason} (${interview.currentDifficulty} -> ${nextDifficulty})`);
    }

    // Save user message and AI feedback
    interview.messages.push({
      role: "user",
      content: answer,
      timestamp: new Date(),
    });
    interview.messages.push({
      role: "ai",
      content: feedback,
      scoreAwarded,
      isSkipped,
      isRepeatedAnswer: isRepeated,
      timestamp: new Date(),
    });

    interview.questionScores.push({
      questionNumber: currentQNum,
      score: scoreAwarded,
      difficulty: interview.currentDifficulty,
      question: currentQuestion,
      answerSummary: answer.substring(0, 50) + "..."
    });

    interview.questionsAnswered = currentQNum;
    
    const isComplete = isEndRequested || interview.questionsAnswered >= interview.totalQuestions;

    // ── Complete path ──────────────────────────────────────
    if (isComplete) {
      // Calculate weighted score
      let totalWeightedScore = 0;
      let maxPossibleWeightedScore = 0;
      
      const difficultyWeights = { easy: 1, medium: 1.5, hard: 2 };
      
      interview.questionScores.forEach(qs => {
        const weight = difficultyWeights[qs.difficulty] || 1;
        totalWeightedScore += (qs.score * 10) * weight; // convert 0-10 to 0-100
        maxPossibleWeightedScore += 100 * weight;
      });
      
      // Penalize for questions that were not asked/answered due to early exit
      const unaskedQuestions = interview.totalQuestions - interview.questionScores.length;
      if (unaskedQuestions > 0) {
        maxPossibleWeightedScore += (100 * difficultyWeights["medium"]) * unaskedQuestions;
      }
      
      const finalScore = maxPossibleWeightedScore > 0 ? Math.round((totalWeightedScore / maxPossibleWeightedScore) * 100) : 0;

      interview.score = finalScore;
      interview.isComplete = true;
      interview.feedback = "Interview completed. Great job!";
      interview.duration = Math.max(
        1,
        Math.round((Date.now() - interview.createdAt.getTime()) / 60000),
      );

      const report = generateProgressionReport(interview);
      if (report) {
         if(!interview.progressionReport) interview.progressionReport = {};
         interview.progressionReport.startDifficulty = report.startDifficulty;
         interview.progressionReport.endDifficulty = report.endDifficulty;
         interview.progressionReport.peakDifficulty = report.peakDifficulty;
         interview.progressionReport.overallTrajectory = report.overallTrajectory;
      }

      await interview.save();

      return res.json({ feedback, score: finalScore, isComplete: true, progressionReport: interview.progressionReport });
    }

    // ── Continue path ──────────────────────────────────────
    interview.currentDifficulty = nextDifficulty;
    interview.difficultyHistory.push({
      questionNumber: currentQNum + 1,
      difficulty: nextDifficulty,
      timestamp: new Date()
    });

    const previousQuestions = interview.messages
      .filter((m) => m.role === "ai" && m.questionNumber)
      .map((m) => m.content)
      .join("\n- ");

    let nextQuestion = "";
    let retries = 0;
    
    while (retries < 3) {
        const nextQuestionResponse = await groqRetry(() =>
          groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `You are Rivolo, an expert ${domain} interviewer. Generate the NEXT interview question.`
              },
              {
                role: "user",
                content: `The candidate's current difficulty level is ${nextDifficulty.toUpperCase()}.
The question should:
- Be highly relevant to ${domain}
- Be a completely NEW question, different from previous ones
- Be appropriate for a ${nextDifficulty.toUpperCase()} level
- Test deeper understanding if medium/hard, or fundamental concepts if easy.

Previous questions already asked:
- ${previousQuestions}

Return ONLY the new question, nothing else.`,
              },
            ],
            temperature: 0.8 + (retries * 0.1),
            max_tokens: 150,
          })
        );
        
        nextQuestion = nextQuestionResponse.choices[0].message.content.trim();
        if (!isDuplicateQuestion(nextQuestion, interview.questionHashes)) {
            break;
        }
        retries++;
    }

    interview.questionHashes.push(hashText(nextQuestion));
    
    interview.messages.push({
        role: "ai",
        content: nextQuestion,
        difficulty: nextDifficulty,
        questionNumber: currentQNum + 1,
        timestamp: new Date()
    });

    await interview.save();

    return res.json({ 
      feedback, 
      nextQuestion, 
      difficulty: nextDifficulty,
      difficultyChange: adaptationReason,
      isComplete: false,
      questionsAnswered: interview.questionsAnswered
    });
  } catch (err) {
    console.error("submitAnswer error:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// ── Get All Completed Interviews ──────────────────────────
const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({
      userId: req.userId,
      isComplete: true,
    })
      .select("domain score duration questionsAnswered createdAt")
      .sort({ createdAt: -1 });

    const mapped = interviews.map((i) => ({
      id: i._id,
      topic: i.domain,
      score: i.score,
      duration: i.duration,
      date: i.createdAt,
    }));

    res.json({ interviews: mapped });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch interviews", error: err.message });
  }
};

// ── Get Single Interview ──────────────────────────────────
const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!interview)
      return res.status(404).json({ message: "Interview not found" });
    res.json({ interview });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── Delete Single Interview ──────────────────────────────────
const deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    res.json({ message: "Interview deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── Delete All Interviews ──────────────────────────────────
const deleteAllInterviews = async (req, res) => {
  try {
    await Interview.deleteMany({ userId: req.userId });
    res.json({ message: "All history deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { startInterview, submitAnswer, getInterviews, getInterview, deleteInterview, deleteAllInterviews };
