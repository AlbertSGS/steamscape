export async function loadProcessedGames() {
  const url = `${import.meta.env.BASE_URL}processedGames.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load processedGames.json: ${response.status}`);
  }

  return await response.json();
}