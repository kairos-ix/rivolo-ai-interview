/**
 * Badge Engine — pure function
 * Given a UserArenaProfile document, returns an array of newly earned badge objects.
 * Already-owned badges are excluded.
 */

const ALL_BADGES = [
  {
    id: "first_blood",
    name: "First Blood",
    emoji: "🏆",
    description: "Completed your very first challenge",
    condition: (profile) => profile.totalChallengesCompleted >= 1,
  },
  {
    id: "on_fire",
    name: "On Fire",
    emoji: "🔥",
    description: "Maintained a 3-day challenge streak",
    condition: (profile) => profile.currentStreak >= 3,
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    emoji: "⚔️",
    description: "Maintained a 7-day challenge streak",
    condition: (profile) => profile.currentStreak >= 7,
  },
  {
    id: "perfect_score",
    name: "Perfect Score",
    emoji: "🌟",
    description: "Scored 100/100 on any single challenge",
    condition: (profile) => profile.bestScore >= 100,
  },
  {
    id: "high_achiever",
    name: "High Achiever",
    emoji: "✨",
    description: "Scored 90 or above on any challenge",
    condition: (profile) => profile.bestScore >= 90,
  },
  {
    id: "grinder",
    name: "Grinder",
    emoji: "💪",
    description: "Completed 10 or more challenges",
    condition: (profile) => profile.totalChallengesCompleted >= 10,
  },
  {
    id: "veteran",
    name: "Veteran",
    emoji: "🎖️",
    description: "Completed 25 or more challenges",
    condition: (profile) => profile.totalChallengesCompleted >= 25,
  },
  {
    id: "sharpshooter",
    name: "Sharpshooter",
    emoji: "🎯",
    description: "Average score above 80 after 5+ challenges",
    condition: (profile) =>
      profile.totalChallengesCompleted >= 5 && profile.averageScore >= 80,
  },
  {
    id: "top_3",
    name: "Podium Finisher",
    emoji: "🏅",
    description: "Ranked in the top 3 on any challenge leaderboard",
    condition: (profile) =>
      profile.rankHistory.some((r) => r.globalRank !== null && r.globalRank <= 3),
  },
  {
    id: "arena_king",
    name: "Arena King",
    emoji: "👑",
    description: "Reached #1 on the global leaderboard",
    condition: (profile) => profile.globalRank === 1,
  },
  {
    id: "all_rounder",
    name: "All-Rounder",
    emoji: "🌐",
    description: "Completed at least one challenge in every category",
    condition: (profile) =>
      profile.categoryStats.Technical.completed >= 1 &&
      profile.categoryStats.HR.completed >= 1 &&
      profile.categoryStats.Aptitude.completed >= 1 &&
      profile.categoryStats.Domain.completed >= 1,
  },
];

/**
 * @param {object} profile - UserArenaProfile plain object
 * @returns {Array} - array of newly earned badge objects to add
 */
const computeNewBadges = (profile) => {
  const ownedIds = new Set((profile.badges || []).map((b) => b.id));
  const newBadges = [];

  for (const badge of ALL_BADGES) {
    if (!ownedIds.has(badge.id) && badge.condition(profile)) {
      newBadges.push({
        id: badge.id,
        name: badge.name,
        emoji: badge.emoji,
        description: badge.description,
        earnedAt: new Date(),
      });
    }
  }

  return newBadges;
};

/**
 * Compute rank label from total points
 */
const computeRankLabel = (totalPoints) => {
  if (totalPoints >= 1000) return { label: "Legend", emoji: "👑", tier: 5 };
  if (totalPoints >= 600) return { label: "Elite", emoji: "💎", tier: 4 };
  if (totalPoints >= 300) return { label: "Contender", emoji: "🥇", tier: 3 };
  if (totalPoints >= 100) return { label: "Challenger", emoji: "🥈", tier: 2 };
  return { label: "Rookie", emoji: "🥉", tier: 1 };
};

module.exports = { computeNewBadges, computeRankLabel, ALL_BADGES };
