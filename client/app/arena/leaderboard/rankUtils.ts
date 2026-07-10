// Client-side rank utilities (mirrors server badgeEngine.computeRankLabel)
export function computeRankLabel(totalPoints: number): { label: string; emoji: string; tier: number } {
  if (totalPoints >= 1000) return { label: "Legend", emoji: "👑", tier: 5 };
  if (totalPoints >= 600) return { label: "Elite", emoji: "💎", tier: 4 };
  if (totalPoints >= 300) return { label: "Contender", emoji: "🥇", tier: 3 };
  if (totalPoints >= 100) return { label: "Challenger", emoji: "🥈", tier: 2 };
  return { label: "Rookie", emoji: "🥉", tier: 1 };
}
