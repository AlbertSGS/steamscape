export async function loadProcessedGames() {
  const response = await fetch(`${import.meta.env.BASE_URL}processedGames.json`);

  if (!response.ok) {
    throw new Error(`Failed to load processedGames.json: ${response.status}`);
  }

  return response.json();
}