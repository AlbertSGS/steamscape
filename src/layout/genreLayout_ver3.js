function normalize(value, min, max) {
  if (!Number.isFinite(value)) return 0.5;
  if (max <= min) return 0.5;
  return (value - min) / (max - min);
}

function getRange(values) {
  let min = Infinity;
  let max = -Infinity;

  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }

  return { min, max };
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function seededOffset(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function assignGenreLayout(games) {
  // X = Reach
  // combines broad audience + review footprint
  const xValues = games.map((g) => {
    const ownership = g.scores?.ownershipReach ?? 0;
    const reviews = g.scores?.reviewVolume ?? 0;
    return 0.65 * ownership + 0.35 * reviews;
  });

  // Z = Stickiness / Ongoing traction
  // combines long-term engagement + current attention
  const zValues = games.map((g) => {
    const engagement = g.scores?.engagement ?? 0;
    const attention = g.scores?.currentAttention ?? 0;
    return 0.7 * engagement + 0.3 * attention;
  });

  const xRange = getRange(xValues);
  const zRange = getRange(zValues);

  const worldSize = 80;

  return games.map((game) => {
    const ownership = game.scores?.ownershipReach ?? 0;
    const reviews = game.scores?.reviewVolume ?? 0;
    const engagement = game.scores?.engagement ?? 0;
    const attention = game.scores?.currentAttention ?? 0;

    const reachScore = 0.65 * ownership + 0.35 * reviews;
    const stickinessScore = 0.7 * engagement + 0.3 * attention;

    let nx = normalize(reachScore, xRange.min, xRange.max);
    let nz = normalize(stickinessScore, zRange.min, zRange.max);

    // Slight nonlinear spread so mid/low values don't bunch up too much
    nx = Math.pow(nx, 0.75);
    nz = Math.pow(nz, 0.8);

    let x = (nx - 0.5) * worldSize;
    let z = (nz - 0.5) * worldSize;

    // tiny deterministic jitter to reduce exact overlap
    const seed = hashString(`${game.appid}-${game.name}`);
    x += (seededOffset(seed) - 0.5) * 2.2;
    z += (seededOffset(seed + 1) - 0.5) * 2.2;

    return {
      ...game,
      assignedGenre: game.primaryGenre || "Other",
      x,
      z
    };
  });
}