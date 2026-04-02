import fs from "fs";
import path from "path";
import { computeScores } from "./visibilityScore.js";

const DATA_DIR = path.resolve("data");
const steamSpyPath = path.join(DATA_DIR, "steamspy.json");
const steamApiPath = path.join(DATA_DIR, "steamapi.json");
const outputPath = path.join(DATA_DIR, "processedGames.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function parseOwnersRange(rangeStr) {
  if (!rangeStr || typeof rangeStr !== "string") {
    return { ownersMin: 0, ownersMax: 0, ownersMid: 0 };
  }

  const parts = rangeStr.split("..").map(s => s.trim().replace(/,/g, ""));
  const min = Number(parts[0]) || 0;
  const max = Number(parts[1]) || 0;
  const mid = (min + max) / 2;

  return {
    ownersMin: min,
    ownersMax: max,
    ownersMid: mid
  };
}

function extractReleaseYear(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const match = dateStr.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function centsToDollars(value) {
  const num = Number(value) || 0;
  return num / 100;
}

function cleanGenres(apiEntry) {
  const rawGenres = Array.isArray(apiEntry.genres)
    ? apiEntry.genres.map(g => g.description).filter(Boolean)
    : [];

  const isIndie = rawGenres.includes("Indie");
  const genres = rawGenres.filter(g => g !== "Indie");
  const primaryGenre = genres[0] || "Other";

  return { genres, isIndie, primaryGenre };
}

function cleanCategories(apiEntry) {
  return Array.isArray(apiEntry.categories)
    ? apiEntry.categories.map(c => c.description).filter(Boolean)
    : [];
}

function buildProcessedGame(appid, spyEntry, apiEntry) {
  const { ownersMin, ownersMax, ownersMid } = parseOwnersRange(spyEntry.owners);
  const { genres, isIndie, primaryGenre } = cleanGenres(apiEntry);
  const categories = cleanCategories(apiEntry);

  const positive = Number(spyEntry.positive) || 0;
  const negative = Number(spyEntry.negative) || 0;
  const reviewCount = positive + negative;
  const positiveRatio = reviewCount > 0 ? positive / reviewCount : 0;

  const game = {
    appid: Number(appid),
    name: apiEntry.name || spyEntry.name || "Unknown",
    releaseYear: extractReleaseYear(apiEntry.release_date?.date),

    genres,
    categories,
    primaryGenre,
    isIndie,

    developer:
      Array.isArray(apiEntry.developers) && apiEntry.developers.length
        ? apiEntry.developers.join(", ")
        : spyEntry.developer || "",

    publisher:
      Array.isArray(apiEntry.publishers) && apiEntry.publishers.length
        ? apiEntry.publishers.join(", ")
        : spyEntry.publisher || "",

    positive,
    negative,
    reviewCount,
    positiveRatio,

    ownersMin,
    ownersMax,
    ownersMid,

    averageForever: Number(spyEntry.average_forever) || 0,
    medianForever: Number(spyEntry.median_forever) || 0,
    average2Weeks: Number(spyEntry.average_2weeks) || 0,
    median2Weeks: Number(spyEntry.median_2weeks) || 0,
    ccu: Number(spyEntry.ccu) || 0,

    price: centsToDollars(spyEntry.price),
    initialPrice: centsToDollars(spyEntry.initialprice),
    discount: Number(spyEntry.discount) || 0,

    recommendations: Number(apiEntry.recommendations?.total) || 0,
    metacritic: Number(apiEntry.metacritic?.score) || 0,

    headerImage: apiEntry.header_image || "",
    shortDescription: apiEntry.short_description || ""
  };

  game.scores = computeScores(game);

  return game;
}

function main() {
  const steamSpy = readJson(steamSpyPath);
  const steamApi = readJson(steamApiPath);

  const processedGames = [];

  for (const appid of Object.keys(steamSpy)) {
    const spyEntry = steamSpy[appid];
    const apiEntry = steamApi[appid];

    if (!spyEntry || !apiEntry) continue;
    if ((Number(appid) || 0) === 999999) continue;
    if (apiEntry.type !== "game") continue;

    const processed = buildProcessedGame(appid, spyEntry, apiEntry);
    processedGames.push(processed);
  }

  processedGames.sort(
    (a, b) => b.scores.compositeVisibility - a.scores.compositeVisibility
  );

  fs.writeFileSync(outputPath, JSON.stringify(processedGames, null, 2), "utf-8");

  console.log(`Processed ${processedGames.length} games.`);
  console.log(`Saved to ${outputPath}`);
}

main();