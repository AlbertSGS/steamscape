export function logScore(value) {
  return Math.log10((Number(value) || 0) + 1);
}

export function computeScores(game) {
  const reviewVolume = logScore(game.reviewCount);
  const ownershipReach = logScore(game.ownersMid);
  const engagement = logScore(game.medianForever);
  const currentAttention = logScore(game.ccu);

  const compositeVisibility =
    0.35 * reviewVolume +
    0.30 * ownershipReach +
    0.20 * engagement +
    0.15 * currentAttention;

  return {
    reviewVolume,
    ownershipReach,
    engagement,
    currentAttention,
    compositeVisibility
  };
}