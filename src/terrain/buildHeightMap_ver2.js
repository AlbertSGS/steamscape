function normalizeScore(raw, norm) {
  if (!norm || norm.max <= norm.min) return 0;

  const clamped = Math.min(raw, norm.max * 0.85);
  const normalized = (clamped - norm.min) / (norm.max - norm.min);
  const safe = Math.max(0, Math.min(1, normalized));

  return Math.pow(safe, 0.4);
}

function computeInfluence(dist, influenceRadius) {
  if (dist >= influenceRadius) return 0;

  const t = 1 - dist / influenceRadius;

  // Sharper falloff for steeper, more mountain-like peaks
  return Math.pow(t, 1);
}

export function sampleTerrainHeightAt({
  x,
  z,
  games,
  norm,
  metricKey = "compositeVisibility",
  influenceRadius = 18,
  heightScale = 2.5
}) {
  let height = 0;

  for (const game of games) {
    const dx = x - game.x;
    const dz = z - game.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > influenceRadius) continue;

    const influence = computeInfluence(dist, influenceRadius);
    const raw = game.scores?.[metricKey] ?? 0;
    const score = normalizeScore(raw, norm);

    height += score * influence * heightScale;
  }

  return height;
}

export function buildHeightMap({
  games,
  norm,
  size = 180,
  segments = 140,
  metricKey = "compositeVisibility",
  influenceRadius = 18,
  heightScale = 2.5
}) {
  const heights = [];
  const half = size / 2;

  for (let iz = 0; iz <= segments; iz++) {
    for (let ix = 0; ix <= segments; ix++) {
      const x = (ix / segments) * size - half;
      const z = (iz / segments) * size - half;

      const height = sampleTerrainHeightAt({
        x,
        z,
        games,
        norm,
        metricKey,
        influenceRadius,
        heightScale
      });

      heights.push(height);
    }
  }

  return heights;
}