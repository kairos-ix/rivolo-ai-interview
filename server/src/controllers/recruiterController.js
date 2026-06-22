const Groq = require("groq-sdk");
const RecruiterSession = require("../models/RecruiterSession.js");
const COMPANY_PROFILES = require("../config/companyProfiles.js");
const { groqRetry } = require("../utils/groqRetry.js");
const { computeNextDifficulty, hashText, isRepeatedAnswer } = require("../utils/adaptiveEngine.js");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ── Start Session ───────────────────────────────────────
const startSession = async (req, res) => {
  try {
    const { companyId, candidateType = "fresher" } = req.body;

    if (!companyId || !COMPANY_PROFILES[companyId]) {
      return res.status(400).json({ message: "Invalid or missing companyId" });
    }

    const company = COMPANY_PROFILES[companyId];

    const prompt = `You are a senior ${company.name} interviewer.

Style: ${company.style}
Focus areas: ${company.focusAreas.join(', ')}
Question patterns: ${company.questionPatterns.join(' | ')}
Difficulty: ${company.difficulty}
Candidate type: ${candidateType}

Generate the first interview question. Return ONLY JSON:
{"question": "string", "category": "string", "difficulty": "string", "hint": "string"}
No markdown. No explanation.`;

    const response = await groqRetry(() =>
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an AI interviewer simulator. You must output exactly valid JSON, no backticks, no markdown formatting." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 300,
      })
    );

    let parsed;
    try {
      parsed = JSON.parse(response.choices[0].message.content.trim());
    } catch (e) {
      console.error("Parse error startSession:", e);
      return res.status(500).json({ message: "Failed to parse AI question." });
    }

    const questionHash = hashText(parsed.question);

    const session = await RecruiterSession.create({
      userId: req.userId,
      companyId,
      companyName: company.name,
      companyType: company.type,
      candidateType,
      questions: [{
        text: parsed.question,
        difficulty: parsed.difficulty || company.difficulty,
        category: parsed.category || "General",
        hash: questionHash
      }],
      totalQuestions: 5
    });

    return res.status(201).json({
      sessionId: session._id,
      companyName: company.name,
      companyType: company.type,
      question: {
        text: parsed.question,
        category: parsed.category || "General",
        difficulty: parsed.difficulty || company.difficulty,
        hint: parsed.hint || ""
      },
      questionNumber: 1,
      totalQuestions: 5
    });

  } catch (err) {
    console.error("startSession error:", err);
    res.status(500).json({ message: "Failed to start recruiter session." });
  }
};

// ── Submit Answer ─────────────────────────────────────────
const submitAnswer = async (req, res) => {
  try {
    const { sessionId, answerText, skip } = req.body;

    if (!sessionId || (skip !== true && !answerText)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const session = await RecruiterSession.findOne({ _id: sessionId, userId: req.userId });
    if (!session || session.status !== "active") {
      return res.status(404).json({ message: "Active session not found" });
    }

    const company = COMPANY_PROFILES[session.companyId];
    const currentIndex = session.currentQuestionIndex;
    const currentQuestion = session.questions[currentIndex];

    let answerObj = {
      questionIndex: currentIndex,
      answerText: skip ? "" : answerText,
      score: 0,
      feedback: "",
      hash: skip ? "" : hashText(answerText),
      skipped: !!skip
    };

    if (skip) {
      answerObj.feedback = "Skipped";
    } else {
      // Duplicate detection
      const existingHashes = session.answers.map(a => a.hash).filter(Boolean);
      const isDuplicate = isRepeatedAnswer(answerText, existingHashes);

      const prompt = `You are a ${company.name} interviewer evaluating this answer.

Company standards: ${company.evaluationCriteria.join(', ')}
Difficulty: ${currentQuestion.difficulty}
Question: ${currentQuestion.text} (Category: ${currentQuestion.category})

Candidate answer: ${answerText}

Return ONLY JSON:
{
"score": <number 0-100>,
"feedback": "detailed markdown feedback referencing ${company.name} standards specifically",
"strengthPoints": ["string"],
"improvementPoints": ["string"],
"meetsCompanyStandard": <boolean>
}

Score according to ${company.name}'s bar (passingBar: ${company.passingBar}). Be specific about whether this answer would pass at ${company.name}.`;

      const response = await groqRetry(() =>
        groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You evaluate answers. Return ONLY JSON without formatting fences." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 500,
        })
      );

      let parsed;
      try {
        parsed = JSON.parse(response.choices[0].message.content.trim());
      } catch (e) {
        console.error("Parse eval error:", e);
        return res.status(500).json({ message: "Failed to evaluate answer." });
      }

      answerObj.score = isDuplicate ? Math.max(0, (parsed.score || 0) - 30) : (parsed.score || 0); // Heavier penalty for recruiters
      let fb = parsed.feedback || "";
      if (isDuplicate) {
        fb = "**Note: This answer appears highly repetitive compared to previous ones.**\n\n" + fb;
      }
      
      // We append the strength/improvement blocks to feedback markdown
      let fullFeedback = fb;
      if (parsed.strengthPoints && parsed.strengthPoints.length > 0) {
        fullFeedback += "\n\n**Strengths:**\n- " + parsed.strengthPoints.join("\n- ");
      }
      if (parsed.improvementPoints && parsed.improvementPoints.length > 0) {
        fullFeedback += "\n\n**Areas for Improvement:**\n- " + parsed.improvementPoints.join("\n- ");
      }

      answerObj.feedback = fullFeedback;
    }

    session.answers.push(answerObj);
    session.currentQuestionIndex += 1;

    // Check if session is complete
    if (session.currentQuestionIndex >= session.totalQuestions) {
      session.status = "completed";
      
      const totalScore = session.answers.reduce((acc, ans) => acc + (ans.score || 0), 0);
      session.finalScore = Math.round(totalScore / session.totalQuestions);
      session.meetsCompanyBar = session.finalScore >= company.passingBar;

      // Final Feedback
      const weakCategories = [];
      const strongCategories = [];
      session.questions.forEach((q, idx) => {
         const a = session.answers.find(ans => ans.questionIndex === idx);
         if (a) {
           if (a.score < company.passingBar) weakCategories.push(q.category);
           else strongCategories.push(q.category);
         }
      });

      const finalPrompt = `You are a ${company.name} hiring committee giving final verdict.

Candidate scored ${session.finalScore}/100. ${company.name}'s bar is ${company.passingBar}/100.
Weak areas: ${[...new Set(weakCategories)].join(', ') || 'None'}. 
Strong areas: ${[...new Set(strongCategories)].join(', ') || 'None'}.

Write a 3-paragraph hiring verdict as if this is real ${company.name} feedback.
Mention specific ${company.name} values/standards. State clearly: selected / not selected / on hold.
Return plain text, no JSON.`;

      const finalResponse = await groqRetry(() =>
        groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "user", content: finalPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
        })
      );

      session.companyFeedback = finalResponse.choices[0].message.content.trim();
      await session.save();

      return res.json({
        sessionComplete: true,
        nextQuestion: null,
        currentScore: session.finalScore,
        meetsCompanyBar: session.meetsCompanyBar,
        companyFeedback: session.companyFeedback,
        finalScore: session.finalScore,
        answerFeedback: answerObj.feedback,
        answerScore: answerObj.score
      });
    }

    // Adaptive logic for next question
    let lastScore = answerObj.score;
    // Map 0-100 to consecutive logic using loose 10 point scale approximation
    let nextDifficulty = currentQuestion.difficulty;
    if (!skip) {
       if (lastScore >= 70 && nextDifficulty !== "hard") {
         nextDifficulty = nextDifficulty === "easy" ? "medium" : "hard";
       } else if (lastScore < 50 && nextDifficulty !== "easy") {
         nextDifficulty = nextDifficulty === "hard" ? "medium" : "easy";
       }
    } else {
       nextDifficulty = nextDifficulty === "hard" ? "medium" : "easy";
    }

    const coveredCategories = session.questions.map(q => q.category).join(", ");
    
    const nextQPrompt = `You are a senior ${company.name} interviewer.
Candidate type: ${session.candidateType}
Previous categories covered: ${coveredCategories}
Candidate's last score: ${lastScore}/100

Generate the next interview question at ${nextDifficulty} difficulty.
Ensure it is a NEW question, not covering the exact same concept.
Return ONLY JSON:
{"question":"string","category":"string","difficulty":"string","hint":"string"}
No markdown. No explanation.`;

    const nextResponse = await groqRetry(() =>
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Return ONLY JSON without markdown formatting." },
          { role: "user", content: nextQPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 300,
      })
    );

    let nextParsed;
    try {
      nextParsed = JSON.parse(nextResponse.choices[0].message.content.trim());
    } catch (e) {
      console.error("Parse next Q error:", e);
      return res.status(500).json({ message: "Failed to generate next question." });
    }

    session.questions.push({
      text: nextParsed.question,
      difficulty: nextParsed.difficulty || nextDifficulty,
      category: nextParsed.category || "General",
      hash: hashText(nextParsed.question)
    });

    await session.save();

    return res.json({
      sessionComplete: false,
      nextQuestion: {
        text: nextParsed.question,
        category: nextParsed.category || "General",
        difficulty: nextParsed.difficulty || nextDifficulty,
        hint: nextParsed.hint || ""
      },
      currentScore: answerObj.score,
      answerFeedback: answerObj.feedback,
      answerScore: answerObj.score
    });

  } catch (err) {
    console.error("submitAnswer error:", err);
    res.status(500).json({ message: "Failed to process answer." });
  }
};

// ── Get Session ───────────────────────────────────────────
const getSession = async (req, res) => {
  try {
    const session = await RecruiterSession.findOne({ _id: req.params.sessionId, userId: req.userId });
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── Get History ───────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const sessions = await RecruiterSession.find({ userId: req.userId, status: "completed" })
      .sort({ createdAt: -1 })
      .select("companyId companyName finalScore meetsCompanyBar createdAt")
      .lean();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { startSession, submitAnswer, getSession, getHistory };
