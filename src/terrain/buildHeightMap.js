// function normalizeScore(raw, norm) {
//   if (!norm) return 0;

//   // Shift the whole score range down so the minimum score sits at 0
//   const shifted = Math.max(0, raw - norm.min);

//   // Optional: mild compression so peaks do not get too insane
//   return Math.pow(shifted, 0.8);
// }
function normalizeScore(raw, norm) {
  if (!norm) return 0;

  const range = norm.max - norm.min;
  if (range <= 0) return 0;

  const normalized = (raw - norm.min) / range;

  // optional: slight compression (keeps peaks but smoother)
  return Math.pow(Math.max(0, normalized), 1);
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
  influenceRadius,
  heightScale
}) {
  let maxHeight = 0;

  for (const game of games) {
    const dx = x - game.x;
    const dz = z - game.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > influenceRadius) continue;

    const influence = computeInfluence(dist, influenceRadius);
    const raw = game.scores?.[metricKey] ?? 0;
    const score = normalizeScore(raw, norm);

    const candidate = score * influence * heightScale;

    if (candidate > maxHeight) {
      maxHeight = candidate;
    }
  }

  return maxHeight;
}

export function buildHeightMap({
  games,
  norm,
  size,
  segments,
  metricKey = "compositeVisibility",
  influenceRadius,
  heightScale
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