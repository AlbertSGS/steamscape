export function setupFilterControls(onChange) {
  const select = document.getElementById("type-select");

  select.addEventListener("change", () => {
    onChange(select.value);
  });

  return select.value;
}

export function applyGameFilter(games, type) {
  if (type === "indie") {
    return games.filter((g) => g.isIndie);
  }

  if (type === "nonIndie") {
    return games.filter((g) => !g.isIndie);
  }

  return games;
}