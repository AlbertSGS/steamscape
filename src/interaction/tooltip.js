export function createTooltip() {
  const el = document.getElementById("tooltip");

  function show(game, height, x, y, metricKey, metricLabel) {
    const value = game.scores?.[metricKey] ?? 0;

    el.innerHTML = `
      <strong>${game.name}</strong>
      Genre: ${game.genres?.join(", ") || "N/A"}<br>
      Height: ${height.toFixed(2)}<br>
      Indie: ${game.isIndie ? "Yes" : "No"}<br>
      Developer: ${game.developer || "N/A"}<br>
      Reviews: ${game.reviewCount ?? 0}<br>
      Owners: ${Math.round(game.ownersMid ?? 0).toLocaleString()}<br>
      Median Playtime: ${game.medianForever ?? 0} min<br>
      CCU: ${game.ccu ?? 0}<br>
      ${metricLabel}: ${value.toFixed(4)}
    `;

    el.style.left = `${x + 14}px`;
    el.style.top = `${y + 14}px`;
    el.hidden = false;
  }

  function hide() {
    el.hidden = true;
  }

  return { show, hide };
}