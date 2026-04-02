export function setupGenreControls(genres, onChange) {
  const select = document.getElementById("genre-select");

  if (!select) {
    throw new Error('Missing #genre-select in index.html');
  }

  select.innerHTML = `
    <option value="all">All Genres</option>
    ${genres.map((genre) => `<option value="${genre}">${genre}</option>`).join("")}
  `;

  select.addEventListener("change", () => {
    onChange(select.value);
  });

  return select.value;
}

export function applyGenreFilter(games, selectedGenre) {
  if (selectedGenre === "all") {
    return games;
  }

  return games.filter(
    (game) => Array.isArray(game.genres) && game.genres.includes(selectedGenre)
  );
}

export function getAllGenres(games) {
  const set = new Set();

  for (const game of games) {
    if (!Array.isArray(game.genres)) continue;

    for (const genre of game.genres) {
      if (genre && genre !== "Indie" && genre !== "Early Access" && genre !== "Free To Play" && genre !== "Nudity" && genre !== "Gore" && genre !== "Violent" && genre !== "Sexual Content") {
        set.add(genre);
      }
    }
  }

  return Array.from(set).sort();
}