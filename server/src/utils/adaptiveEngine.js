const crypto = require("crypto");

/**
 * Computes the next difficulty level based on candidate performance.
 * @param {string} currentDifficulty - "easy", "medium", or "hard"
 * @param {number} consecutiveCorrect - Number of consecutive well-answered questions
 * @param {number} consecutiveWrong - Number of consecutive poorly-answered questions
 * @param {boolean} isSkipped - Whether the last question was skipped
 * @returns {object} - { nextDifficulty, adaptationReason, newConsecutiveCorrect, newConsecutiveWrong }
 */
const computeNextDifficulty = (currentDifficulty, consecutiveCorrect, consecutiveWrong, isSkipped) => {
  let nextDifficulty = currentDifficulty;
  let adaptationReason = null;
  let newConsecutiveCorrect = consecutiveCorrect;
  let newConsecutiveWrong = consecutiveWrong;

  if (isSkipped) {
    if (currentDifficulty === "hard") {
      nextDifficulty = "medium";
      adaptationReason = "Decreased difficulty due to skipped question";
    } else if (currentDifficulty === "medium") {
      nextDifficulty = "easy";
      adaptationReason = "Decreased difficulty due to skipped question";
    }
    // Reset consecutive counters on skip
    newConsecutiveCorrect = 0;
    newConsecutiveWrong = 0;
  } else if (consecutiveCorrect >= 2) {
    if (currentDifficulty === "easy") {
      nextDifficulty = "medium";
      adaptationReason = "Increased difficulty after multiple strong answers";
    } else if (currentDifficulty === "medium") {
      nextDifficulty = "hard";
      adaptationReason = "Increased difficulty after multiple strong answers";
    }
    newConsecutiveCorrect = 0; // Reset after promotion
  } else if (consecutiveWrong >= 2) {
    if (currentDifficulty === "hard") {
      nextDifficulty = "medium";
      adaptationReason = "Decreased difficulty to build confidence";
    } else if (currentDifficulty === "medium") {
      nextDifficulty = "easy";
      adaptationReason = "Decreased difficulty to build confidence";
    }
    newConsecutiveWrong = 0; // Reset after demotion
  }

  return { nextDifficulty, adaptationReason, newConsecutiveCorrect, newConsecutiveWrong };
};

/**
 * Normalizes text by removing punctuation, extra spaces, and lowercasing.
 */
const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "") // remove punctuation
    .replace(/\s+/g, " ") // replace multiple spaces with single space
    .trim();
};

/**
 * Hashes normalized text for efficient duplicate checking.
 */
const hashText = (text) => {
  const normalized = normalizeText(text);
  return crypto.createHash("md5").update(normalized).digest("hex");
};

/**
 * Checks if a question has already been asked based on its hash.
 */
const isDuplicateQuestion = (newQuestion, existingHashes) => {
  if (!existingHashes || existingHashes.length === 0) return false;
  const newHash = hashText(newQuestion);
  return existingHashes.includes(newHash);
};

/**
 * Checks if an answer is substantially similar to a previous answer.
 * We consider it repeated if the exact normalized text hash exists.
 * (A more advanced version could use Levenshtein distance or semantic similarity)
 */
const isRepeatedAnswer = (newAnswer, existingAnswerHashes) => {
  if (!newAnswer || newAnswer.length < 20) return false; // Ignore very short answers like "yes" or "no"
  if (!existingAnswerHashes || existingAnswerHashes.length === 0) return false;
  const newHash = hashText(newAnswer);
  return existingAnswerHashes.includes(newHash);
};

/**
 * Generates the final progression report based on the interview history.
 */
const generateProgressionReport = (interview) => {
  const history = interview.difficultyHistory || [];
  if (history.length === 0) return null;

  const startDifficulty = history[0].difficulty;
  const endDifficulty = history[history.length - 1].difficulty;
  
  const difficultyLevels = { easy: 1, medium: 2, hard: 3 };
  let peakDifficulty = startDifficulty;
  
  history.forEach(h => {
    if (difficultyLevels[h.difficulty] > difficultyLevels[peakDifficulty]) {
      peakDifficulty = h.difficulty;
    }
  });

  let overallTrajectory = "Maintained consistent level";
  if (difficultyLevels[endDifficulty] > difficultyLevels[startDifficulty]) {
    overallTrajectory = "Demonstrated ability to handle increasing complexity";
  } else if (difficultyLevels[endDifficulty] < difficultyLevels[startDifficulty]) {
    overallTrajectory = "Required adjustment to foundational concepts";
  }

  return {
    startDifficulty,
    endDifficulty,
    peakDifficulty,
    overallTrajectory,
    adaptations: interview.progressionReport?.adaptations || []
  };
};

module.exports = {
  computeNextDifficulty,
  normalizeText,
  hashText,
  isDuplicateQuestion,
  isRepeatedAnswer,
  generateProgressionReport
};
