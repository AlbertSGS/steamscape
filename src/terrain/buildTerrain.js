import * as THREE from "three";
import { buildHeightMap } from "./buildHeightMap.js";
import { TERRAIN_CONFIG } from "./terrainConfig.js";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
  return new THREE.Color(
    lerp(c1.r, c2.r, t),
    lerp(c1.g, c2.g, t),
    lerp(c1.b, c2.b, t)
  );
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function pseudoNoise(x, z) {
  return (
    Math.sin(x * 0.085) * 0.5 +
    Math.cos(z * 0.07) * 0.35 +
    Math.sin((x + z) * 0.045) * 0.15
  );
}

export function buildTerrain({
  games,
  norm,
  metricKey = "compositeVisibility"
}) {
  const { size, segments, influenceRadius, heightScale } = TERRAIN_CONFIG;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const heights = buildHeightMap({
    games,
    norm,
    size,
    segments,
    metricKey,
    influenceRadius,
    heightScale
  });

  const position = geometry.attributes.position;

  let minH = Infinity;
  let maxH = -Infinity;

  // Visual exaggeration for normalized heightmap
  const exaggeration = 1;

  for (let i = 0; i < position.count; i++) {
    const h = heights[i];
    position.setY(i, h * exaggeration);

    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
  }

  const colors = [];
  const lowColor = new THREE.Color(0x5f7a5f);
  const midColor = new THREE.Color(0x9a8f78);
  const highColor = new THREE.Color(0xfcfdff);
  const snowColor = new THREE.Color(0xffffff);
  const steepRockColor = new THREE.Color(0x979da3);

  for (let i = 0; i < position.count; i++) {
    const h = heights[i];
    const t = maxH > minH ? (h - minH) / (maxH - minH) : 0;

    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    const normalY = geometry.attributes.normal.getY(i);
    const slope = 1 - Math.max(0, Math.min(1, normalY));

    let color;

    if (t < 0.28) {
      color = lerpColor(lowColor, midColor, t / 0.28);
    } else if (t < 0.82) {
      color = lerpColor(midColor, highColor, (t - 0.28) / 0.54);
    } else {
      color = lerpColor(highColor, snowColor, (t - 0.82) / 0.18);
    }

    // Steeper slopes expose more rock.
    const rockMix = smoothstep(0.18, 0.55, slope) * (1 - smoothstep(0.86, 1.0, t) * 0.65);
    color = lerpColor(color, steepRockColor, rockMix * 0.9);

    // Small color variation so the terrain does not look too flat or uniform.
    const noise = pseudoNoise(x, z);
    const noiseStrength = 0.05;
    color.offsetHSL(0, 0, noise * noiseStrength);

    // Slightly brighten sun-facing higher areas for a more natural alpine look.
    const lightLift = smoothstep(0.45, 0.95, t) * 0.025 + (1 - slope) * 0.015;
    color.offsetHSL(0, 0, lightLift);

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.userData = {
    size,
    segments,
    heights: [...heights]
  };

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.2
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = {
    size,
    segments,
    heights: [...heights],
    exaggeration
  };
  mesh.receiveShadow = true;
  mesh.castShadow = true;

  return mesh;
}