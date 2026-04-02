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

function getGenreList(game) {
  if (!Array.isArray(game.genres)) return [];

  return game.genres.filter(
    (g) => g && g !== "Indie" && g !== "Early Access" && g !== "Free To Play"
  );
}

function getAssignedGenre(game) {
  const genres = getGenreList(game);
  return genres[0] || "Other";
}

function getSecondaryGenres(game) {
  const genres = getGenreList(game);
  return genres.slice(1);
}

function getUniqueGenres(games) {
  const genreSet = new Set();

  for (const game of games) {
    genreSet.add(getAssignedGenre(game));
  }

  return Array.from(genreSet).sort();
}

function buildGenreRegions(genres, radius = 55) {
  const regions = {};
  const count = genres.length;

  genres.forEach((genre, index) => {
    const angle = (index / count) * Math.PI * 2;
    regions[genre] = {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius
    };
  });

  return regions;
}

function groupGamesByGenre(games) {
  const groups = new Map();

  for (const game of games) {
    const genre = getAssignedGenre(game);

    if (!groups.has(genre)) {
      groups.set(genre, []);
    }

    groups.get(genre).push(game);
  }

  return groups;
}

function buildSecondaryGenreAngles(gamesInGenre) {
  const secondarySet = new Set();

  for (const game of gamesInGenre) {
    for (const g of getSecondaryGenres(game)) {
      secondarySet.add(g);
    }
  }

  const secondaryGenres = Array.from(secondarySet).sort();
  const angleMap = new Map();

  if (secondaryGenres.length === 0) {
    return angleMap;
  }

  secondaryGenres.forEach((genre, index) => {
    const angle = (index / secondaryGenres.length) * Math.PI * 2;
    angleMap.set(genre, angle);
  });

  return angleMap;
}

function getBaseAngle(game, fallbackSeed, secondaryAngleMap) {
  const secondaryGenres = getSecondaryGenres(game);

  if (secondaryGenres.length === 0) {
    return seededOffset(fallbackSeed) * Math.PI * 2;
  }

  let sum = 0;
  let count = 0;

  for (const g of secondaryGenres) {
    if (!secondaryAngleMap.has(g)) continue;
    sum += secondaryAngleMap.get(g);
    count += 1;
  }

  if (count === 0) {
    return seededOffset(fallbackSeed) * Math.PI * 2;
  }

  return sum / count;
}

export function assignGenreLayout(games) {
  const genres = getUniqueGenres(games);
  const genreRegions = buildGenreRegions(genres, 55);
  const grouped = groupGamesByGenre(games);

  const laidOutGames = [];

  for (const [genre, group] of grouped.entries()) {
    const region = genreRegions[genre] || { x: 0, z: 0 };
    const secondaryAngleMap = buildSecondaryGenreAngles(group);

    const sorted = [...group].sort(
      (a, b) =>
        (b.scores?.compositeVisibility ?? 0) -
        (a.scores?.compositeVisibility ?? 0)
    );

    const summitRadius = 0;
    const ringSpacing = 1.8;
    const maxRadius = 18;

    for (let i = 0; i < sorted.length; i++) {
      const game = sorted[i];
      const seed = hashString(`${game.appid}-${genre}`);

      let x;
      let z;

      if (i === 0) {
        // Highest-ranked game sits at the summit
        x = region.x;
        z = region.z;
      } else {
        // Spiral/ring outward by rank
        const rank = i;
        const ringIndex = Math.floor(Math.sqrt(rank));
        const ringStart = ringIndex * ringIndex;
        const ringCount = Math.max(1, (ringIndex + 1) * (ringIndex + 1) - ringStart);
        const indexInRing = rank - ringStart;

        const baseAngle = getBaseAngle(game, seed, secondaryAngleMap);
        const ringAngle = (indexInRing / ringCount) * Math.PI * 2;

        const jitterAngle = (seededOffset(seed + 1) - 0.5) * 0.25;
        const angle = baseAngle + ringAngle + jitterAngle;

        const radius = Math.min(
          maxRadius,
          summitRadius + ringIndex * ringSpacing + 1.5 + (seededOffset(seed + 2) - 0.5) * 0.4
        );

        x = region.x + Math.cos(angle) * radius;
        z = region.z + Math.sin(angle) * radius;
      }

      laidOutGames.push({
        ...game,
        assignedGenre: genre,
        x,
        z,
        layoutRank: i
      });
    }
  }

  return laidOutGames;
}