import { UMAP } from "umap-js";

function minMax(values) {
    let min = Infinity;
    let max = -Infinity;

    for (const v of values) {
        if (v < min) min = v;
        if (v > max) max = v;
    }

    return { min, max };
}

function normalize(value, min, max) {
    if (max <= min) return 0.5;
    return (value - min) / (max - min);
}

function getCleanGenres(game) {
    if (!Array.isArray(game.genres)) return [];

    return game.genres.filter(
        (g) => g && g !== "Indie" && g !== "Early Access" && g !== "Free To Play"
    );
}

export function computeUMAPPositions(data) {
    // Build genre vocabulary
    const genreSet = new Set();
    for (const game of data) {
        for (const genre of getCleanGenres(game)) {
            genreSet.add(genre);
        }
    }

    const genreList = Array.from(genreSet).sort();
    const genreIndex = new Map(genreList.map((g, i) => [g, i]));

    // Score features
    const scoreFeatures = data.map((d) => [
        Number(d.scores?.reviewVolume) || 0,
        Number(d.scores?.ownershipReach) || 0,
        Number(d.scores?.engagement) || 0,
        Number(d.scores?.currentAttention) || 0
    ]);

    const mins = [Infinity, Infinity, Infinity, Infinity];
    const maxs = [-Infinity, -Infinity, -Infinity, -Infinity];

    for (const f of scoreFeatures) {
        f.forEach((v, i) => {
            if (v < mins[i]) mins[i] = v;
            if (v > maxs[i]) maxs[i] = v;
        });
    }

    const normalizedFeatures = data.map((game, idx) => {
        const scoreVector = scoreFeatures[idx].map((v, i) => {
            const range = maxs[i] - mins[i];
            return range === 0 ? 0 : (v - mins[i]) / range;
        });

        // Light genre influence
        const genreWeight = 0.22;
        const genreVector = new Array(genreList.length).fill(0);

        for (const genre of getCleanGenres(game)) {
            const gi = genreIndex.get(genre);
            if (gi !== undefined) {
                genreVector[gi] = genreWeight;
            }
        }

        return [...scoreVector, ...genreVector];
    });

    const umap = new UMAP({
        nNeighbors: 15,
        minDist: 0.15,
        nComponents: 2
    });

    const embedding = umap.fit(normalizedFeatures);

    const xs = embedding.map((p) => p[0]);
    const zs = embedding.map((p) => p[1]);

    const xr = minMax(xs);
    const zr = minMax(zs);

    const worldSize = 140; // Adjust as needed for your scene scale

    return embedding.map(([x, z]) => ({
        x: (normalize(x, xr.min, xr.max) - 0.5) * worldSize,
        z: (normalize(z, zr.min, zr.max) - 0.5) * worldSize
    }));
}