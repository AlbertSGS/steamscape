import { loadProcessedGames } from "./src/data/loader.js";
import { setupScene } from "./src/scene/setupScene.js";
import { setupMetricControls, METRIC_LABELS } from "./src/ui/metricControls.js";
import { setupFilterControls, applyGameFilter } from "./src/ui/filterControls.js";
import { setupGenreControls, applyGenreFilter, getAllGenres } from "./src/ui/genreControls.js";
import { updateInsightPanel } from "./src/ui/insightPanel.js";
import { computeUMAPPositions } from "./src/layout/umapLayout.js";
import { STORIES } from "./src/story/stories.js";
import * as THREE from "three";

const statusEl = document.getElementById("status");
const sceneContainer = document.getElementById("scene-container");
const yearSliderEl = document.getElementById("year-slider");
const yearValueEl = document.getElementById("year-value");
const recomputeLayoutBtn = document.getElementById("recompute-layout-btn");
const gameSearchInputEl = document.getElementById("game-search-input");
const gameSearchBtnEl = document.getElementById("game-search-btn");
const gameSearchStatusEl = document.getElementById("game-search-status");

const storyTextEl = document.getElementById("story-text") || document.querySelector("#story-caption .story-text") || document.querySelector("#story-caption");
const storyPrevBtnEl = document.getElementById("story-prev-btn");
const storyPlayBtnEl = document.getElementById("story-play-btn");
const storyNextBtnEl = document.getElementById("story-next-btn");

const metricSelectEl = document.getElementById("metric-select");
const typeSelectEl = document.getElementById("type-select");
const genreSelectEl = document.getElementById("genre-select");

const UMAP_STORAGE_KEY = "steamscape_umap_positions_v1";

function computeNormalization(games, metricKey) {
  const values = games
    .map((g) => g.scores?.[metricKey] ?? 0)
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);

  if (values.length === 0) {
    return { min: 0, max: 1 };
  }

  const min = values[0];
  const max = values[Math.floor(values.length * 0.95)] ?? values[values.length - 1];

  return { min, max };
}

function saveUMAPPositions(games) {
  const positions = games.map((g) => ({
    appid: g.appid,
    x: g.x,
    z: g.z
  }));

  localStorage.setItem(UMAP_STORAGE_KEY, JSON.stringify(positions));
}

function loadUMAPPositions() {
  const raw = localStorage.getItem(UMAP_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function applySavedPositions(games, savedPositions) {
  if (!savedPositions || savedPositions.length === 0) return false;

  const byAppid = new Map(savedPositions.map((p) => [p.appid, p]));
  let appliedCount = 0;

  for (const game of games) {
    const saved = byAppid.get(game.appid);
    if (!saved) continue;

    if (!Number.isFinite(saved.x) || !Number.isFinite(saved.z)) continue;

    game.x = saved.x;
    game.z = saved.z;
    appliedCount += 1;
  }

  return appliedCount > 0;
}

function computeAndApplyNewUMAP(games) {
  const positions = computeUMAPPositions(games);

  games.forEach((game, i) => {
    game.x = positions[i].x;
    game.z = positions[i].z;
  });

  saveUMAPPositions(games);
}

async function init() {
  try {
    const games = await loadProcessedGames();

    const savedPositions = loadUMAPPositions();
    const usedSavedLayout = applySavedPositions(games, savedPositions);

    if (!usedSavedLayout) {
      computeAndApplyNewUMAP(games);
    }

    const allGenres = getAllGenres(games);

    let currentMetric = "compositeVisibility";
    let currentFilter = "all";
    let currentGenre = "all";
    let currentYear = Number(yearSliderEl?.value ?? 2026);

    // ---- Story Mode ----
    let storyIndex = 0;
    let storyTimer = null;
    let currentStoryKey = "overview";
    let storySteps = STORIES[currentStoryKey]?.steps ?? [];

    const storySelectEl = document.getElementById("story-select");

    function setStoryCaption(text) {
      if (storyTextEl) {
        storyTextEl.textContent = text;
      }
    }

    function stopStoryPlayback() {
      if (storyTimer) {
        clearTimeout(storyTimer);
        storyTimer = null;
      }
      if (storyPlayBtnEl) {
        storyPlayBtnEl.textContent = "Play";
      }
    }

    function scheduleNextStoryStep() {
      if (!storySteps.length) return;

      const currentStep = storySteps[storyIndex];
      const delay = currentStep?.duration ?? 3500;

      storyTimer = setTimeout(() => {
        storyIndex = (storyIndex + 1) % storySteps.length;
        runStoryStep(storySteps[storyIndex]);
        scheduleNextStoryStep();
      }, delay);
    }

    function setCurrentStory(key) {
      const nextKey = STORIES[key] ? key : "overview";
      currentStoryKey = nextKey;
      storySteps = STORIES[nextKey]?.steps ?? [];
      storyIndex = 0;

      if (storySelectEl) {
        storySelectEl.value = nextKey;
      }
    }

    function resetCameraView() {
      if (!sceneApi) return;
      sceneApi.animateCameraTo(
        sceneApi.camera.position.clone().set(0, 80, 140),
        new THREE.Vector3(0, 0, 0),
        700
      );
    }

    function runStoryStep(step) {
      if (!step) {
        setStoryCaption("This story has no steps yet.");
        return;
      }

      currentMetric = step.metric ?? "compositeVisibility";
      currentFilter = step.filter ?? "all";
      currentGenre = step.genre ?? "all";
      currentYear = step.year ?? 2026;

      if (metricSelectEl) {
        metricSelectEl.value = currentMetric;
      }
      if (typeSelectEl) {
        typeSelectEl.value = currentFilter;
      }
      if (genreSelectEl) {
        const hasGenreOption = Array.from(genreSelectEl.options).some(
          (option) => option.value === currentGenre
        );
        currentGenre = hasGenreOption ? currentGenre : "all";
        genreSelectEl.value = currentGenre;
      }

      if (yearSliderEl && yearValueEl && Number.isFinite(currentYear)) {
        yearSliderEl.value = String(currentYear);
        yearValueEl.textContent = String(currentYear);
      }

      setStoryCaption(`${step.title}: ${step.caption}`);

      updateScene();

      if (step.focusTop) {
        const top = [...filteredGames]
          .sort((a, b) => (b.scores?.[currentMetric] ?? 0) - (a.scores?.[currentMetric] ?? 0))[0];

        if (top) {
          window.dispatchEvent(
            new CustomEvent("steamscape:select-game", {
              detail: { game: top }
            })
          );
          window.dispatchEvent(
            new CustomEvent("steamscape:focus-game", {
              detail: { appid: top.appid }
            })
          );
        }
      } else {
        resetCameraView();
      }
    }

    function nextStory() {
      if (storySteps.length === 0) return;
      storyIndex = (storyIndex + 1) % storySteps.length;
      runStoryStep(storySteps[storyIndex]);
    }

    function prevStory() {
      if (storySteps.length === 0) return;
      storyIndex = (storyIndex - 1 + storySteps.length) % storySteps.length;
      runStoryStep(storySteps[storyIndex]);
    }

    function playStory() {
      if (storyTimer) {
        stopStoryPlayback();
        return;
      }

      if (storySteps.length === 0) {
        setStoryCaption("This story has no steps yet.");
        return;
      }

      if (storyPlayBtnEl) {
        storyPlayBtnEl.textContent = "Pause";
      }

      storyIndex = 0;
      runStoryStep(storySteps[storyIndex]);
      scheduleNextStoryStep();
    }

    function setSearchStatus(message) {
      if (gameSearchStatusEl) {
        gameSearchStatusEl.textContent = message;
      }
    }

    function findGameByName(query) {
      const q = query.trim().toLowerCase();
      if (!q) return null;

      // exact match first
      let found = games.find((g) => (g.name || "").toLowerCase() === q);
      if (found) return found;

      // substring match next
      found = games.find((g) => (g.name || "").toLowerCase().includes(q));
      return found || null;
    }

    function isGameVisibleInCurrentView(game) {
      return filteredGames.some((g) => g.appid === game.appid);
    }

    function searchAndFocusGame() {
      const query = gameSearchInputEl?.value || "";
      const game = findGameByName(query);

      if (!query.trim()) {
        setSearchStatus("Enter a game name.");
        return;
      }

      if (!game) {
        setSearchStatus("Not found in current dataset.");
        return;
      }

      if (!isGameVisibleInCurrentView(game)) {
        setSearchStatus("Found, but hidden by current filters or year.");
        return;
      }

      setSearchStatus(`Found: ${game.name}`);

      window.dispatchEvent(
        new CustomEvent("steamscape:select-game", {
          detail: { game }
        })
      );

      window.dispatchEvent(
        new CustomEvent("steamscape:focus-game", {
          detail: { appid: game.appid }
        })
      );
    }

    function stopStoryPlaybackIfRunning() {
      if (storyTimer) {
        stopStoryPlayback();
      }
    }

    function getFilteredGames() {
      const yearFiltered = games.filter((game) => {
        if (!game.releaseYear || !Number.isFinite(game.releaseYear)) {
          return true;
        }
        return game.releaseYear <= currentYear;
      });

      const typeFiltered = applyGameFilter(yearFiltered, currentFilter);
      return applyGenreFilter(typeFiltered, currentGenre);
    }

    let filteredGames = getFilteredGames();
    let norm = computeNormalization(filteredGames, currentMetric);

    let sceneApi = setupScene(
      sceneContainer,
      filteredGames,
      norm,
      currentMetric
    );

    // expose for quick testing
    window.steamscapeStory = {
      next: () => nextStory(),
      prev: () => prevStory(),
      play: () => playStory()
    };

    function updateScene() {
      filteredGames = getFilteredGames();
      norm = computeNormalization(filteredGames, currentMetric);

      sceneApi.updateTerrain(currentMetric, norm, filteredGames);

      statusEl.textContent =
        `${filteredGames.length} games | ${METRIC_LABELS[currentMetric]} | ${currentFilter} | ${currentGenre} | up to ${currentYear}`;

      updateInsightPanel({
        games: filteredGames,
        metricKey: currentMetric,
        gameType: currentFilter,
        genre: currentGenre,
        year: currentYear
      });
    }

    if (storySelectEl) {
      storySelectEl.addEventListener("change", (e) => {
        stopStoryPlayback();
        const key = e.target.value;
        setCurrentStory(key);
        runStoryStep(storySteps[0]);
        stopStoryPlayback();
      });
    }

    setupMetricControls((metric) => {
      stopStoryPlaybackIfRunning();
      currentMetric = metric;
      updateScene();
    });

    setupFilterControls((type) => {
      stopStoryPlaybackIfRunning();
      currentFilter = type;
      updateScene();
    });

    setupGenreControls(allGenres, (genre) => {
      stopStoryPlaybackIfRunning();
      currentGenre = genre;
      updateScene();
    });

    if (yearSliderEl && yearValueEl) {
      yearValueEl.textContent = String(currentYear);

      yearSliderEl.addEventListener("input", (event) => {
        stopStoryPlaybackIfRunning();
        currentYear = Number(event.target.value);
        yearValueEl.textContent = String(currentYear);
        updateScene();
      });
    }

    if (recomputeLayoutBtn) {
      recomputeLayoutBtn.addEventListener("click", () => {
        stopStoryPlaybackIfRunning();
        computeAndApplyNewUMAP(games);
        updateScene();
      });
    }

    if (gameSearchBtnEl) {
      gameSearchBtnEl.addEventListener("click", () => {
        stopStoryPlaybackIfRunning();
        searchAndFocusGame();
      });
    }

    if (gameSearchInputEl) {
      gameSearchInputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          stopStoryPlaybackIfRunning();
          searchAndFocusGame();
        }
      });
    }

    if (storyPrevBtnEl) {
      storyPrevBtnEl.addEventListener("click", () => {
        stopStoryPlayback();
        prevStory();
      });
    }

    if (storyNextBtnEl) {
      storyNextBtnEl.addEventListener("click", () => {
        stopStoryPlayback();
        nextStory();
      });
    }

    if (storyPlayBtnEl) {
      storyPlayBtnEl.addEventListener("click", () => {
        playStory();
      });
    }

    setCurrentStory(currentStoryKey);
    setStoryCaption("Use the story controls to step through the narrative.");
    updateScene();
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Error loading data";
  }
}

init();