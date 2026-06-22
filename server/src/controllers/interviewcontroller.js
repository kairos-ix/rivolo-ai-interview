const Groq = require("groq-sdk");
const Interview = require("../models/Interview.js");
const { groqRetry } = require("../utils/groqRetry.js");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const systemPrompt = (domain) =>
  `
You are Rivolo, a senior technical interviewer created by Sahil (also known as kairos). You are conducting a mock interview for a ${domain} developer role.
Ask one clear, specific technical question at a time.
After the candidate answers, provide feedback and the next question.

If the user asks about your name or who created you, explicitly state that your name is Rivolo and your developer is Sahil (also known as kairos).

Return ONLY the question, nothing else.
`.trim();

// ── Start Interview ───────────────────────────────────────
const startInterview = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ message: "Domain is required" });

    const completion = await groqRetry(() =>
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt(domain) },
          {
            role: "user",
            content: `Start the interview. Ask me the first ${domain} technical question. Only ask the question, no preamble.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      })
    );

    const firstQuestion =
      completion.choices[0].message.content ||
      "Tell me about yourself and your experience.";

    const interview = await Interview.create({
      userId: req.userId,
      domain,
      messages: [{ role: "ai", content: firstQuestion }],
    });

    res.status(201).json({
      sessionId: interview._id,
      question: firstQuestion,
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

    const lastMessage = interview.messages[interview.messages.length - 1];
    const currentQuestion = lastMessage ? lastMessage.content : "General introduction";

    // 1️⃣ Generate feedback on the answer
    const feedbackResponse = await groqRetry(() =>
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are Rivolo, a friendly and experienced technical interviewer created by Sahil (kairos).
You are evaluating an answer for a ${domain} developer role.
Your tone should be human, conversational, encouraging, and natural.

Instructions:
1. If the candidate attempts to answer the technical question, evaluate it naturally and gently correct mistakes.
2. If the candidate says they don't know or asks for help, happily and simply explain the concept to them like a supportive mentor.
3. If the candidate asks who you are or who made you, simply say you are Rivolo, an AI Interviewer.
4. If the candidate asks to skip the question or move to the next one, accept it gracefully ("Sure, let's move on.").
5. If the candidate explicitly asks to end, finish, or stop the interview, acknowledge it gracefully.

You MUST respond in JSON format with exactly three keys:
- "feedback": Your conversational response (2-3 sentences max). Do NOT ask the next question here.
- "isAnswerAttempt": boolean. True ONLY if the candidate actually attempted to answer the technical question, OR if they explicitly asked to skip/move to the next question. False if they just said "I don't know", asked for help, or asked an off-topic/meta question.
- "isEndRequested": boolean. True ONLY if the candidate explicitly wants to end or stop the interview right now.`
          },
          {
            role: "user",
            content: `Question asked: "${currentQuestion}"\nCandidate's Answer: "${answer}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 200,
      })
    );

    const rawContent = feedbackResponse.choices[0].message.content.trim();
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      parsed = { feedback: rawContent, isAnswerAttempt: true, isEndRequested: false };
    }
    
    const feedback = parsed.feedback || rawContent;
    const isAnswerAttempt = parsed.isAnswerAttempt ?? true;
    const isEndRequested = parsed.isEndRequested ?? false;

    // 2️⃣ Save messages to DB
    interview.messages.push({
      role: "user",
      content: answer,
      timestamp: new Date(),
    });
    interview.messages.push({
      role: "ai",
      content: feedback,
      timestamp: new Date(),
    });

    if (!isAnswerAttempt && !isEndRequested) {
      await interview.save();
      return res.json({ 
        feedback, 
        nextQuestion: null, 
        isComplete: false, 
        questionsAnswered: interview.questionsAnswered 
      });
    }

    const isComplete = isEndRequested || questionsAnswered >= 2; // complete if early exit requested or 3 questions reached
    interview.questionsAnswered = questionsAnswered + 1;

    // ── Complete path ──────────────────────────────────────
    if (isComplete) {
      const scoreResponse = await groqRetry(() =>
        groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: `Rate this interview answer on a scale of 1-100 for a ${domain} position.
Consider technical accuracy, communication, and problem-solving.
Return ONLY a number between 10-100, nothing else.
Answer: "${answer}"`,
            },
          ],
          temperature: 0.5,
          max_tokens: 10,
        })
      );

      const scoreRaw = scoreResponse.choices[0].message.content.trim();
      const score = Math.max(10, Math.min(100, parseInt(scoreRaw) || 75));

      interview.score = score;
      interview.isComplete = true;
      interview.feedback = feedback;
      interview.duration = Math.max(
        1,
        Math.round((Date.now() - interview.createdAt.getTime()) / 60000),
      );

      await interview.save();

      return res.json({ feedback, score, isComplete: true });
    }

    // ── Continue path ──────────────────────────────────────
    // Only send the last 4 AI messages to reduce token usage
    const previousQuestions = interview.messages
      .filter((m) => m.role === "ai")
      .slice(-4)
      .map((m) => m.content)
      .join("\n- ");

    const nextQuestionResponse = await groqRetry(() =>
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `You are Rivolo, an expert ${domain} interviewer created by Sahil (also known as kairos). Generate the NEXT interview question.
The question should:
- Be highly relevant to ${domain}
- Be a completely NEW question
- Be open-ended and professional
- Test deeper understanding of the domain

Do NOT ask questions based on the candidate's previous answer if their answer was irrelevant, short, or poor. Always stay focused on the ${domain} interview domain.

Previous questions already asked:
- ${previousQuestions}

Return ONLY the new question, nothing else.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      })
    );

    const nextQuestion = nextQuestionResponse.choices[0].message.content.trim();

    await interview.save();

    return res.json({ 
      feedback, 
      nextQuestion, 
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
