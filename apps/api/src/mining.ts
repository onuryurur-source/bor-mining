import { efficiencyMultiplier, MINE_LEVELS } from "./gameRules";

export function calcHourlyProduction(mines: { level: number }[]): number {
  const raw = mines.reduce((sum, m) => {
    const levelData = MINE_LEVELS[m.level];
    if (!levelData) return sum;
    return sum + levelData.hourly;
  }, 0);

  const efficiency = efficiencyMultiplier(mines.length);

  return Math.floor(raw * efficiency);
}

export function calcClaimAmount(params: {
  hourlyProduction: number;
  secondsElapsed: number;
  maxSeconds: number;
}): number {
  const seconds = Math.min(params.secondsElapsed, params.maxSeconds);

  return Math.floor((params.hourlyProduction * seconds) / 3600);
}