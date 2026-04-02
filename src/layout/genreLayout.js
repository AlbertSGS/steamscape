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
  const cleaned = game.genres.filter((g) => g && g !== "Indie" && g !== "Early Access" && g !== "Free To Play");
  return cleaned.length > 0 ? cleaned : ["Other"];
}

function getUniqueGenres(games) {
  const genreSet = new Set();

  for (const game of games) {
    for (const genre of getGenreList(game)) {
      genreSet.add(genre);
    }
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

function getGenreCentroid(gameGenres, genreRegions) {
  let sumX = 0;
  let sumZ = 0;
  let count = 0;

  for (const genre of gameGenres) {
    const region = genreRegions[genre];
    if (!region) continue;

    sumX += region.x;
    sumZ += region.z;
    count += 1;
  }

  if (count === 0) {
    return { x: 0, z: 0 };
  }

  return {
    x: sumX / count,
    z: sumZ / count
  };
}

export function assignGenreLayout(games) {
  const genres = getUniqueGenres(games);
  const genreRegions = buildGenreRegions(genres, 55);

  return games.map((game) => {
    const gameGenres = getGenreList(game);
    const centroid = getGenreCentroid(gameGenres, genreRegions);

    const seed = hashString(`${game.appid}-${gameGenres.join("|")}`);
    const angle = seededOffset(seed) * Math.PI * 2;
    const radius = 4 + seededOffset(seed + 1) * 12;

    const x = centroid.x + Math.cos(angle) * radius;
    const z = centroid.z + Math.sin(angle) * radius;

    return {
      ...game,
      assignedGenre: gameGenres[0] || "Other",
      layoutGenres: gameGenres,
      x,
      z
    };
  });
}