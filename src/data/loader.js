export async function loadProcessedGames() {
  const response = await fetch("./public/processedGames.json");

  if (!response.ok) {
    throw new Error(`Failed to load processedGames.json: ${response.status}`);
  }

  return await response.json();
}