import { METRIC_LABELS } from "./metricControls.js";

let selectedGame = null;
let selectedListenerAdded = false;

const METRIC_DESCRIPTIONS = {
  compositeVisibility:
    "Height combines review volume, ownership reach, engagement, and current attention into one overall visibility score.",
  reviewVolume:
    "Height represents how much visible review activity a game has received.",
  ownershipReach:
    "Height represents estimated audience reach based on owner count.",
  engagement:
    "Height represents sustained player engagement using median playtime.",
  currentAttention:
    "Height represents current attention using recent active player presence."
};

function ensureSelectedGameListener() {
  if (selectedListenerAdded) return;

  window.addEventListener("steamscape:select-game", (event) => {
    selectedGame = event.detail?.game ?? null;

    const currentViewEl = document.getElementById("current-view");
    if (currentViewEl) {
      const metricSelect = document.getElementById("metric-select");
      const metricKey = metricSelect?.value || "compositeVisibility";
      currentViewEl.textContent = buildSelectedGameText(selectedGame, metricKey);
    }
  });

  selectedListenerAdded = true;
}
function formatOwners(game) {
  const value = game?.ownersMid ?? 0;
  if (!value) return "N/A";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatTopGames(games, metricKey, count = 5) {
  const sorted = [...games]
    .sort((a, b) => (b.scores?.[metricKey] ?? 0) - (a.scores?.[metricKey] ?? 0))
    .slice(0, count);

  const topPeaksEl = document.getElementById("top-peaks");
  if (!topPeaksEl) return;

  topPeaksEl.innerHTML = "";

  sorted.forEach((game, i) => {
    const value = game.scores?.[metricKey] ?? 0;

    const row = document.createElement("button");
    row.type = "button";
    row.className = "peak-row";
    row.textContent = `${i + 1}. ${game.name} (${value.toFixed(3)})`;

    row.addEventListener("click", () => {
      window.dispatchEvent(
        new CustomEvent("steamscape:focus-game", {
          detail: { appid: game.appid }
        })
      );
    });

    topPeaksEl.appendChild(row);
  });
}

function buildCurrentView(games, metricKey, gameType, genre) {
  const metricLabel = METRIC_LABELS[metricKey] || metricKey;
  return [
    `Metric: ${metricLabel}`,
    `Game Type: ${gameType}`,
    `Genre: ${genre}`,
    `Games in view: ${games.length}`
  ].join("\n");
}

function buildSelectedGameText(game, metricKey) {
  if (!game) {
    return "Click a game";
  }

  const metricLabel = METRIC_LABELS[metricKey] || metricKey;
  const metricValue = game.scores?.[metricKey] ?? 0;

  return [
    `${game.name}`,
    ``,
    `${metricLabel}: ${metricValue.toFixed(3)}`,
    `Owners: ${formatOwners(game)}`,
    `Reviews: ${game.reviewCount ?? 0}`,
    `Engagement: ${(game.scores?.engagement ?? 0).toFixed(3)}`,
    `Genre: ${game.primaryGenre || game.genres?.[0] || "N/A"}`,
    `Year: ${game.releaseYear ?? "N/A"}`
  ].join("\n");
}

function buildInterpretation(games, metricKey, gameType, genre) {
  const total = games.length;
  const indieCount = games.filter((g) => g.isIndie).length;
  const indiePct = total > 0 ? ((indieCount / total) * 100).toFixed(1) : "0.0";

  const metricLabel = METRIC_LABELS[metricKey] || metricKey;
  const genreLabel = genre === "all" ? "all genres" : genre;
  const typeLabel =
    gameType === "all"
      ? "all games"
      : gameType === "indie"
      ? "indie games"
      : "non-indie games";

  return `This view shows ${total} ${typeLabel} in ${genreLabel}, with terrain height based on ${metricLabel.toLowerCase()}. Indie games make up ${indiePct}% of the current selection.`;
}

export function updateInsightPanel({
  games,
  metricKey,
  gameType,
  genre
}) {
  ensureSelectedGameListener();

  const metricLabel = METRIC_LABELS[metricKey] || metricKey;
  const metricDescription =
    METRIC_DESCRIPTIONS[metricKey] || "Height reflects the selected visibility metric.";

  const currentViewEl = document.getElementById("current-view");
  const metricMeaningEl = document.getElementById("metric-meaning");
  const interpretationEl = document.getElementById("interpretation");

  if (currentViewEl) {
    currentViewEl.textContent = buildCurrentView(games, metricKey, gameType, genre);
  }

  if (metricMeaningEl) {
    metricMeaningEl.textContent = metricDescription;
  }

  if (interpretationEl) {
    interpretationEl.textContent = buildInterpretation(games, metricKey, gameType, genre);
  }

  formatTopGames(games, metricKey, 5);

  const infoPanelTitle = document.querySelector("#info-panel h2");
  if (infoPanelTitle) {
    infoPanelTitle.textContent = "Selected Game";
  }

  if (currentViewEl) {
    currentViewEl.textContent = buildSelectedGameText(selectedGame, metricKey);
  }
}