const Groq = require("groq-sdk");
const Interview = require("../models/Interview.js");
const PlacementReadiness = require("../models/PlacementReadiness.js");
const { groqRetry } = require("../utils/groqRetry.js");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ── Generate Readiness ────────────────────────────────────
const generateReadiness = async (req, res) => {
  try {
    const userId = req.userId;
    const { candidateType } = req.body;
    const type = ["fresher", "internship", "experienced"].includes(candidateType)
      ? candidateType
      : "fresher";

    // 1. Fetch all completed interviews
    const interviews = await Interview.find({ userId, isComplete: true })
      .sort({ createdAt: -1 })
      .lean();

    if (!interviews || interviews.length === 0) {
      return res.status(400).json({
        message: "No completed interviews found. Complete at least one interview before analyzing placement readiness.",
      });
    }

    // Compute avgInterviewScore (average of all session final scores, 0–100)
    const totalInterviews = interviews.length;
    const avgInterviewScore = Math.round(
      interviews.reduce((sum, iv) => sum + (iv.score || 0), 0) / totalInterviews
    );

    // 2. Resume score — resume analysis is not persisted in DB, default 0
    const resumeScore = 0;

    // 3. Skill breadth = min(100, uniqueDomains * 10)
    const domainsCovered = [...new Set(interviews.map(iv => iv.domain))];
    const skillBreadth = Math.min(100, domainsCovered.length * 10);

    // 4. Pull scoringConfig from existing doc or use defaults
    const existingDoc = await PlacementReadiness.findOne({ userId }).lean();
    const config = existingDoc?.scoringConfig || { interviewWeight: 50, resumeWeight: 30, skillBreadthWeight: 20 };

    // 5. Compute overallScore using weighted formula
    const overallScore = Math.round(
      ((avgInterviewScore * config.interviewWeight / 100) +
       (resumeScore * config.resumeWeight / 100) +
       (skillBreadth * config.skillBreadthWeight / 100)) * 10
    ) / 10; // Round to 1 decimal

    // 6. Classification rule
    const classification = overallScore >= 75
      ? "Placement Ready"
      : overallScore >= 50
        ? "High Potential Candidate"
        : "Needs Improvement";

    // 7. Build compact summary for Groq prompt
    // Compute per-domain average scores to find top 3 weak domains
    const domainScores = {};
    interviews.forEach(iv => {
      if (!domainScores[iv.domain]) domainScores[iv.domain] = [];
      domainScores[iv.domain].push(iv.score || 0);
    });
    const domainAvgs = Object.entries(domainScores).map(([domain, scores]) => ({
      domain,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }));
    domainAvgs.sort((a, b) => a.avg - b.avg);
    const weakDomainsSummary = domainAvgs.slice(0, 3)
      .map(d => `${d.domain} (avg ${d.avg}/100)`)
      .join(", ");

    // 8. Single Groq API call
    const prompt = `Analyze this candidate. Return ONLY valid JSON, no markdown fences:

{
  "weakAreas": [{"topic":"string","score":0}],
  "communicationGaps": ["string"],
  "missingSkills": ["string"],
  "roadmap": {"technologies":[],"projects":[],"certifications":[],"interviewTopics":[]}
}

Candidate type: ${type}
Overall score: ${overallScore}/100
Weak domains: ${weakDomainsSummary}
Domains covered: ${domainsCovered.join(", ")}
Resume snapshot: No resume data available

Tailor roadmap for ${type}. Max 5 items per array. Be specific, not generic.`;

    const response = await groqRetry(() =>
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a placement readiness analysis engine. Return ONLY valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      })
    );

    // 9. Parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(response.choices[0].message.content.trim());
    } catch (parseErr) {
      console.error("Failed to parse Groq placement response:", parseErr);
      return res.status(500).json({ message: "AI returned an invalid response. Please try again." });
    }

    // 10. Upsert PlacementReadiness doc, push to history
    const updateData = {
      candidateType: type,
      overallScore,
      classification,
      weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas.slice(0, 5) : [],
      communicationGaps: Array.isArray(parsed.communicationGaps) ? parsed.communicationGaps.slice(0, 5) : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills.slice(0, 5) : [],
      roadmap: {
        technologies: Array.isArray(parsed.roadmap?.technologies) ? parsed.roadmap.technologies.slice(0, 5) : [],
        projects: Array.isArray(parsed.roadmap?.projects) ? parsed.roadmap.projects.slice(0, 5) : [],
        certifications: Array.isArray(parsed.roadmap?.certifications) ? parsed.roadmap.certifications.slice(0, 5) : [],
        interviewTopics: Array.isArray(parsed.roadmap?.interviewTopics) ? parsed.roadmap.interviewTopics.slice(0, 5) : [],
      },
    };

    const doc = await PlacementReadiness.findOneAndUpdate(
      { userId },
      {
        $set: updateData,
        $push: { history: { date: new Date(), score: overallScore, classification } },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 11. Return full doc
    return res.json(doc);
  } catch (err) {
    console.error("generateReadiness error:", err);
    return res.status(500).json({ message: "Failed to generate placement readiness analysis." });
  }
};

// ── Get Readiness ─────────────────────────────────────────
const getReadiness = async (req, res) => {
  try {
    const doc = await PlacementReadiness.findOne({ userId: req.userId }).lean();
    if (!doc) {
      return res.status(404).json({ message: "No placement readiness data found. Generate one first." });
    }
    return res.json(doc);
  } catch (err) {
    console.error("getReadiness error:", err);
    return res.status(500).json({ message: "Failed to fetch placement readiness data." });
  }
};

// ── Update Scoring Config ─────────────────────────────────
const updateScoringConfig = async (req, res) => {
  try {
    const { interviewWeight, resumeWeight, skillBreadthWeight } = req.body;

    if (
      typeof interviewWeight !== "number" ||
      typeof resumeWeight !== "number" ||
      typeof skillBreadthWeight !== "number"
    ) {
      return res.status(400).json({ message: "All weights must be numbers." });
    }

    if (interviewWeight + resumeWeight + skillBreadthWeight !== 100) {
      return res.status(400).json({ message: "Scoring weights must sum to exactly 100." });
    }

    if (interviewWeight < 0 || resumeWeight < 0 || skillBreadthWeight < 0) {
      return res.status(400).json({ message: "Weights cannot be negative." });
    }

    const doc = await PlacementReadiness.findOneAndUpdate(
      { userId: req.userId },
      { $set: { scoringConfig: { interviewWeight, resumeWeight, skillBreadthWeight } } },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "No placement readiness data found. Generate one first." });
    }

    return res.json(doc);
  } catch (err) {
    console.error("updateScoringConfig error:", err);
    return res.status(500).json({ message: "Failed to update scoring configuration." });
  }
};

module.exports = { generateReadiness, getReadiness, updateScoringConfig };
