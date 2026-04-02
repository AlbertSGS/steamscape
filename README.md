# 🌄 SteamScape  
**Visualizing Game Visibility as a 3D Landscape**

SteamScape is an interactive web-based visualization that transforms abstract game metrics into a navigable 3D terrain. Instead of charts and rankings, visibility becomes something you can explore spatially.

---

## ✨ Overview

Thousands of games compete for attention on Steam, but understanding visibility is difficult. Metrics like reviews, ownership, and engagement exist in isolation.

SteamScape brings them together into a single visual metaphor:
- **Height → Visibility**
- **Proximity → Competition / similarity**
- **Terrain → Overall structure of the market**

---

## 🎯 Features

- 🏔 **3D Terrain Visualization**  
  Games form peaks and valleys based on visibility metrics.

- 🔍 **Search & Focus**  
  Quickly locate any game and zoom into it.

- 🎛 **Filters & Controls**  
  Filter by genre, indie status, and metrics.

- 🎥 **Story Mode**  
  Guided sequences highlighting patterns like:
  - dominant peaks
  - indie vs non-indie differences
  - clusters of competition

- 🖱 **Interactive Exploration**
  - Hover → quick info  
  - Click → focus + details  
  - Smooth camera transitions  

---

## 🧠 Data & Method

Each game is represented as a data point with:

- Review volume  
- Ownership estimates  
- Engagement (playtime)  
- Current attention  
- Genre  

### UMAP Projection
Games are embedded into 2D space using UMAP based on:
- normalized metrics  
- lightweight genre encoding  

This preserves **local similarity**, meaning nearby games have similar profiles.

### Terrain Construction
The terrain is generated as a smooth surface where:
- each game contributes local height  
- high-visibility games form peaks  

---

## 🛠 Tech Stack

- **Three.js** — 3D rendering  
- **UMAP-js** — dimensionality reduction  
- **Vanilla JavaScript** — interaction logic  
- **HTML / CSS** — UI  

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/steamscape.git
cd steamscape
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run locally
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

---

## 🌐 Deployment (GitHub Pages)

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist/` folder using GitHub Pages.

---

## ⚠️ Limitations

- Visibility is an approximation based on available data  
- 3D terrain can cause occlusion  
- Layout is static (not time-evolving)

---

## 🔮 Future Work

- Temporal evolution (year-based transitions)  
- Improved storytelling system  
- Enhanced clustering / layout techniques  
- User studies with developers  

---

## 👤 Author

**Albert Shi**
