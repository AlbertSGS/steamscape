export const METRIC_LABELS = {
  compositeVisibility: "Composite Visibility",
  reviewVolume: "Review Volume",
  ownershipReach: "Ownership Reach",
  engagement: "Engagement",
  currentAttention: "Current Attention"
};

export function setupMetricControls(onChange) {
  const select = document.getElementById("metric-select");

  select.addEventListener("change", () => {
    onChange(select.value);
  });

  return select.value;
}