export const STORIES = {
  overview: {
    title: "Market Overview",
    steps: [
      {
        title: "(1 / 4) Visibility Forms a Landscape",
        metric: "compositeVisibility",
        filter: "all",
        genre: "all",
        year: 2026,
        duration: 3500,
        caption:
          "Steam visibility is not flat. It rises into peaks and valleys across the market."
      },
      {
        title: "(2 / 4) A Few Games Dominate the Peaks",
        metric: "compositeVisibility",
        filter: "all",
        genre: "all",
        year: 2026,
        duration: 4500,
        focusTop: true,
        caption:
          "Only a small number of games reach the tallest peaks, showing how concentrated visibility is."
      },
      {
        title: "(3 / 4) Most Games Compete Below the Summit",
        metric: "compositeVisibility",
        filter: "all",
        genre: "all",
        year: 2026,
        duration: 3500,
        focusTop: false,
        caption:
          "Below the highest peaks, most games compete in dense lower terrain rather than at the top."
      },
      {
        title: "(4 / 4) Visibility Changes with the Metric",
        metric: "currentAttention",
        filter: "all",
        genre: "all",
        year: 2026,
        duration: 3500,
        focusTop: false,
        caption:
          "Changing the metric reshapes the landscape, revealing a different view of who stands out."
      }
    ]
  },

  indie: {
    title: "Indie vs Non-Indie",
    steps: [
      {
        title: "(1 / 4) Visibility Is Uneven",
        metric: "compositeVisibility",
        filter: "all",
        genre: "all",
        year: 2026,
        duration: 3500,
        caption:
          "Across the full market, visibility is unevenly distributed, with only a few games reaching the top."
      },
      {
        title: "(2 / 4) Indie Games Fill the Landscape",
        metric: "compositeVisibility",
        filter: "indie",
        genre: "all",
        year: 2026,
        duration: 3500,
        caption:
          "Indie games are widely distributed across the terrain, forming much of the landscape but rarely the tallest peaks."
      },
      {
        title: "(3 / 4) Non-Indie Dominates the Peaks",
        metric: "compositeVisibility",
        filter: "nonIndie",
        genre: "all",
        year: 2026,
        duration: 4500,
        focusTop: true,
        caption:
          "The highest peaks are largely occupied by non-indie titles, showing a strong visibility advantage."
      },
      {
        title: "(4 / 4) Some Indie Games Break Through",
        metric: "currentAttention",
        filter: "indie",
        genre: "all",
        year: 2026,
        duration: 4500,
        focusTop: true,
        caption:
          "Under current attention, a few indie games rise sharply, showing that breakthrough moments still happen."
      }
    ]
  },

  competition: {
    title: "Competition Clusters",
    steps: [
      {
        title: "(1 / 4) Competition Is Local",
        metric: "compositeVisibility",
        filter: "all",
        genre: "all",
        year: 2026,
        duration: 3500,
        caption:
          "Steam is not one flat market. Games compete inside local clusters of similar visibility."
      },
      {
        title: "(2 / 4) Genre Does Not Fully Explain Competition",
        metric: "compositeVisibility",
        filter: "all",
        genre: "Action",
        year: 2026,
        duration: 3500,
        caption:
          "Even within Action, visibility splits across multiple regions rather than one unified block."
      },
      {
        title: "(3 / 4) Different Genres Occupy Different Terrain",
        metric: "compositeVisibility",
        filter: "all",
        genre: "RPG",
        year: 2026,
        duration: 3500,
        caption:
          "RPG reveals a different competitive terrain, showing that nearby games share attention patterns, not just labels."
      },
      {
        title: "(4 / 4) Peaks Shape Their Neighborhoods",
        metric: "compositeVisibility",
        filter: "all",
        genre: "all",
        year: 2026,
        duration: 4500,
        focusTop: true,
        caption:
          "The tallest peaks act like anchors, pulling nearby games into the same competitive landscape."
      }
    ]
  }
};