import * as THREE from "three";
import { sampleTerrainHeightAt } from "../terrain/buildHeightMap.js";
import { TERRAIN_CONFIG } from "../terrain/terrainConfig.js";

export function buildGamePoints(games, norm, metricKey) {
    const sortedGames = [...games]
        .sort((a, b) => (b.scores?.[metricKey] ?? 0) - (a.scores?.[metricKey] ?? 0))
        .slice(0, 1000);

    // 👇 top 5
    const topGames = sortedGames.slice(0, 5);
    const topSet = new Set(topGames.map(g => g.appid));

    const geometry = new THREE.ConeGeometry(0.35, 1.0, 8);

    const group = new THREE.Group();

    for (const game of sortedGames) {
        const terrainY = sampleTerrainHeightAt({
            x: game.x,
            z: game.z,
            games,
            norm,
            metricKey,
            influenceRadius: TERRAIN_CONFIG.influenceRadius,
            heightScale: TERRAIN_CONFIG.heightScale
        });

        const isTop = topSet.has(game.appid);
        const material = new THREE.MeshStandardMaterial({
            color: isTop ? 0xffd700 : 0x3e6b45,
            emissive: isTop ? 0x553300 : 0x000000,
            roughness: 0.9,
            metalness: 0,
            transparent: true,
            opacity: 1
        });
        const point = new THREE.Mesh(geometry, material.clone());

        // ConeGeometry points upward by default, centered vertically.
        // So half the height sits below origin. Lift it so the base sits near terrain.
        const coneHeight = 1.0;
        const baseOffset = coneHeight / 2;
        point.position.set(game.x, terrainY + baseOffset, game.z);

        // Store target state for animation
        point.userData.targetPosition = point.position.clone();
        point.userData.targetScale = new THREE.Vector3(1, 1, 1);

        point.userData.game = game;
        point.userData.height = terrainY;
        point.userData.appid = game.appid;
        point.castShadow = true;
        group.add(point);
    }

    return group;
}