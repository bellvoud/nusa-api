// src/utils/xp.ts

// xp needed to next level
// formula: level * 200  (level 1→2 = 200xp, 2→3 = 400xp, est.)
export const xpToNextLevel = (currentLevel: number): number => {
  return currentLevel * 200;
};

// calculate level based on total xp
export const calculateLevel = (totalXp: number): number => {
  let level = 1;
  let xpRequired = 0;

  while (true) {
    xpRequired += xpToNextLevel(level);
    if (totalXp < xpRequired) break;
    level++;
  }

  return level;
};

// calculate xp in current level
export const xpInCurrentLevel = (totalXp: number): number => {
  const currentLevel = calculateLevel(totalXp);
  let xpUsed = 0;

  for (let i = 1; i < currentLevel; i++) {
    xpUsed += xpToNextLevel(i);
  }

  return totalXp - xpUsed;
};

// calculate xp progress to next level (0–100)
export const levelProgress = (totalXp: number): number => {
  const currentLevel = calculateLevel(totalXp);
  const current = xpInCurrentLevel(totalXp);
  const needed = xpToNextLevel(currentLevel);
  return Math.floor((current / needed) * 100);
};
