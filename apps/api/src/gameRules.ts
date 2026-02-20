export const MINE_LEVELS: Record<number, { borCost: number; starCost: number; hourly: number }> = {
  1: { borCost: 200, starCost: 10, hourly: 10 },
  2: { borCost: 400, starCost: 20, hourly: 20 },
  3: { borCost: 800, starCost: 30, hourly: 40 }
};

export const FREE_OFFLINE_MAX_SECONDS = 3600; // 1 saat
export const PREMIUM_OFFLINE_MAX_SECONDS = 12 * 3600; // 12 saat

export const PREMIUM_PRICE_STARS = 25;
export const PREMIUM_DURATION_SECONDS = 24 * 3600;

// Soft-cap (sınırsız maden var ama verim düşer)
export function efficiencyMultiplier(totalMines: number): number {
  return 1 / (1 + totalMines / 200);
}