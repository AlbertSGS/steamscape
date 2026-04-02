import * as THREE from "three";
import { createCamera } from "./camera.js";
import { addLighting } from "./lighting.js";
import { createControls } from "./controls.js";
import { buildTerrain } from "../terrain/buildTerrain.js";
import { buildGamePoints } from "../games/buildGamePoints.js";
import { createTooltip } from "../interaction/tooltip.js";
import { setupHover } from "../interaction/raycastHover.js";
import { METRIC_LABELS } from "../ui/metricControls.js";

export function setupScene(container, games, norm, metricKey) {
  const scene = new THREE.Scene();

  const camera = createCamera(container);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight || 500);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  container.querySelector("canvas")?.remove();
  container.appendChild(renderer.domElement);

  addLighting(scene);
  const controls = createControls(camera, renderer);

  let terrain = buildTerrain({
    games,
    norm,
    metricKey
  });
  terrain.receiveShadow = true;
  terrain.castShadow = true;
  scene.add(terrain);

  let gamePoints = buildGamePoints(games, norm, metricKey);
  scene.add(gamePoints);

  const tooltip = createTooltip();

  let hoverApi = setupHover({
    camera,
    scene,
    renderer,
    pointGroup: gamePoints,
    tooltip,
    getMetricInfo: () => ({
      metricKey,
      metricLabel: METRIC_LABELS[metricKey] || metricKey
    })
  });

  let selectedAppid = null;
  let selectedPointMesh = null;
  let pointTransition = null;
  let terrainTransition = null;

  function findPointMeshByAppid(appid) {
    if (!appid) return null;
    return gamePoints.children.find(
      (child) => child.userData?.game?.appid === appid
    ) || null;
  }

  function applySelectedHighlight(appid) {
    if (selectedPointMesh) {
      selectedPointMesh.scale.set(1, 1, 1);

      // restore original color
      if (selectedPointMesh.userData?.originalColor) {
        selectedPointMesh.material.color.set(selectedPointMesh.userData.originalColor);
      }
    }

    selectedAppid = appid ?? null;
    selectedPointMesh = findPointMeshByAppid(selectedAppid);

    if (selectedPointMesh) {
      // store original color once
      if (!selectedPointMesh.userData.originalColor) {
        selectedPointMesh.userData.originalColor = selectedPointMesh.material.color.getHex();
      }

      // apply highlight color (Apple-style blue)
      selectedPointMesh.material.color.set(0x4da3ff);

      selectedPointMesh.scale.set(1.85, 1.85, 1.85);
    }
  }

  function disposePointGroup(group) {
    if (!group) return;
    group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  function startTerrainTransition(oldTerrain, newTerrain) {
    if (!oldTerrain || !newTerrain) return;

    const oldPos = oldTerrain.geometry.attributes.position;
    const newPos = newTerrain.geometry.attributes.position;

    if (!oldPos || !newPos || oldPos.count !== newPos.count) {
      return;
    }

    const fromY = new Float32Array(oldPos.count);
    const toY = new Float32Array(newPos.count);

    for (let i = 0; i < oldPos.count; i++) {
      fromY[i] = oldPos.getY(i);
      toY[i] = newPos.getY(i);
      newPos.setY(i, fromY[i]);
    }

    newPos.needsUpdate = true;
    newTerrain.geometry.computeVertexNormals();

    terrainTransition = {
      mesh: newTerrain,
      fromY,
      toY,
      startTime: performance.now(),
      duration: 700
    };
  }

  function finishTerrainTransition() {
    if (!terrainTransition) return;

    const position = terrainTransition.mesh.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      position.setY(i, terrainTransition.toY[i]);
    }
    position.needsUpdate = true;
    terrainTransition.mesh.geometry.computeVertexNormals();
    terrainTransition = null;
  }

  function startPointTransition(oldGroup, newGroup) {
    const duration = 600;
    const startTime = performance.now();

    const oldByAppid = new Map();
    if (oldGroup) {
      oldGroup.children.forEach((child) => {
        const appid = child.userData?.appid;
        if (appid != null) oldByAppid.set(appid, child);
      });
    }

    const newByAppid = new Map();
    newGroup.children.forEach((child) => {
      const appid = child.userData?.appid;
      if (appid != null) newByAppid.set(appid, child);
    });

    const incoming = [];
    const outgoing = [];

    newGroup.children.forEach((child) => {
      const appid = child.userData?.appid;
      const oldChild = oldByAppid.get(appid);

      child.material.transparent = true;

      if (oldChild) {
        child.position.copy(oldChild.position);
        child.scale.copy(oldChild.scale);
        child.material.opacity = oldChild.material.opacity;
      } else {
        child.position.set(
          child.userData.targetPosition.x,
          child.userData.targetPosition.y - 2,
          child.userData.targetPosition.z
        );
        child.scale.set(0.4, 0.4, 0.4);
        child.material.opacity = 0;
      }

      incoming.push({
        mesh: child,
        fromPos: child.position.clone(),
        toPos: child.userData.targetPosition.clone(),
        fromScale: child.scale.clone(),
        toScale: child.userData.targetScale.clone(),
        fromOpacity: child.material.opacity,
        toOpacity: 1
      });
    });

    if (oldGroup) {
      oldGroup.children.forEach((child) => {
        const appid = child.userData?.appid;
        if (!newByAppid.has(appid)) {
          outgoing.push({
            mesh: child,
            fromScale: child.scale.clone(),
            toScale: new THREE.Vector3(0.2, 0.2, 0.2),
            fromOpacity: child.material.opacity ?? 1,
            toOpacity: 0
          });
        } else {
          outgoing.push({
            mesh: child,
            fromScale: child.scale.clone(),
            toScale: child.scale.clone().multiplyScalar(0.85),
            fromOpacity: child.material.opacity ?? 1,
            toOpacity: 0
          });
        }
      });
    }

    pointTransition = {
      startTime,
      duration,
      oldGroup,
      newGroup,
      incoming,
      outgoing
    };
  }

  function finishPointTransition() {
    if (!pointTransition) return;

    pointTransition.incoming.forEach((item) => {
      item.mesh.position.copy(item.toPos);
      item.mesh.scale.copy(item.toScale);
      item.mesh.material.opacity = item.toOpacity;
    });

    pointTransition.outgoing.forEach((item) => {
      item.mesh.material.opacity = item.toOpacity;
    });

    if (pointTransition.oldGroup) {
      scene.remove(pointTransition.oldGroup);
      disposePointGroup(pointTransition.oldGroup);
    }

    pointTransition = null;
  }

  function animateCameraTo(endPos, endTarget, duration = 700) {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = performance.now();

    function easeInOutCubic(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animateFocus(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(t);

      camera.position.lerpVectors(startPos, endPos, eased);
      controls.target.lerpVectors(startTarget, endTarget, eased);
      controls.update();

      if (t < 1) {
        requestAnimationFrame(animateFocus);
      }
    }

    requestAnimationFrame(animateFocus);
  }

  function focusOnGame(game) {
    if (!game) return;

    const x = game.x ?? 0;
    const z = game.z ?? 0;

    const pointMesh = gamePoints.children.find(
      (child) => child.userData?.game?.appid === game.appid
    );

    const targetY = pointMesh ? pointMesh.position.y : 0;
    const target = new THREE.Vector3(x, targetY, z);

    const distance = 28;
    const heightBoost = 10;

    // Direction from scene center to this game (stable, non-random)
    const dir = new THREE.Vector3(x, 0, z);

    if (dir.lengthSq() < 0.0001) {
      dir.set(1, 0, 1);
    }

    dir.normalize();

    const endPos = new THREE.Vector3(
      x + dir.x * distance,
      targetY + heightBoost,
      z + dir.z * distance
    );

    const endTarget = target.clone();
    animateCameraTo(endPos, endTarget, 700);
  }

  function onFocusGameEvent(event) {
    const appid = event.detail?.appid;
    if (!appid) return;

    const game = games.find((g) => g.appid === appid);
    if (game) {
      focusOnGame(game);
    }
  }

  function onSelectGameEvent(event) {
    const game = event.detail?.game;
    const appid = game?.appid ?? event.detail?.appid;
    if (!appid) return;

    applySelectedHighlight(appid);
  }

  window.addEventListener("steamscape:focus-game", onFocusGameEvent);
  window.addEventListener("steamscape:select-game", onSelectGameEvent);

  function rebuildPoints() {
    finishPointTransition();
    if (hoverApi) {
      hoverApi.dispose();
    }

    const oldGroup = gamePoints;

    gamePoints = buildGamePoints(games, norm, metricKey);
    scene.add(gamePoints);

    if (selectedAppid) {
      applySelectedHighlight(selectedAppid);
    }

    startPointTransition(oldGroup, gamePoints);

    hoverApi = setupHover({
      camera,
      scene,
      renderer,
      pointGroup: gamePoints,
      terrain,
      tooltip,
      getMetricInfo: () => ({
        metricKey,
        metricLabel: METRIC_LABELS[metricKey] || metricKey
      })
    });
  }

  function updateTerrain(newMetricKey, newNorm, newGames) {
    finishTerrainTransition();
    metricKey = newMetricKey;
    norm = newNorm;

    if (newGames) {
      games = newGames;
    }

    const oldTerrain = terrain;

    terrain = buildTerrain({
      games,
      norm,
      metricKey
    });
    terrain.receiveShadow = true;
    terrain.castShadow = true;

    scene.add(terrain);

    if (oldTerrain) {
      startTerrainTransition(oldTerrain, terrain);
      scene.remove(oldTerrain);
      oldTerrain.geometry.dispose();
      oldTerrain.material.dispose();
    }

    rebuildPoints();
  }

  function onResize() {
    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener("resize", onResize);

  function animate() {
    requestAnimationFrame(animate);
    if (terrainTransition) {
      const elapsed = performance.now() - terrainTransition.startTime;
      const t = Math.min(1, elapsed / terrainTransition.duration);
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const position = terrainTransition.mesh.geometry.attributes.position;

      for (let i = 0; i < position.count; i++) {
        position.setY(
          i,
          THREE.MathUtils.lerp(terrainTransition.fromY[i], terrainTransition.toY[i], eased)
        );
      }

      position.needsUpdate = true;
      terrainTransition.mesh.geometry.computeVertexNormals();

      if (t >= 1) {
        terrainTransition = null;
      }
    }
    if (pointTransition) {
      const elapsed = performance.now() - pointTransition.startTime;
      const t = Math.min(1, elapsed / pointTransition.duration);
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      pointTransition.incoming.forEach((item) => {
        item.mesh.position.lerpVectors(item.fromPos, item.toPos, eased);
        item.mesh.scale.lerpVectors(item.fromScale, item.toScale, eased);
        item.mesh.material.opacity = THREE.MathUtils.lerp(item.fromOpacity, item.toOpacity, eased);
      });

      pointTransition.outgoing.forEach((item) => {
        item.mesh.scale.lerpVectors(item.fromScale, item.toScale, eased);
        item.mesh.material.opacity = THREE.MathUtils.lerp(item.fromOpacity, item.toOpacity, eased);
      });

      if (t >= 1) {
        if (pointTransition.oldGroup) {
          scene.remove(pointTransition.oldGroup);
          disposePointGroup(pointTransition.oldGroup);
        }
        pointTransition = null;
      }
    }
    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  return {
    scene,
    camera,
    renderer,
    controls,
    updateTerrain,
    focusOnGame,
    animateCameraTo,
    dispose() {
      finishPointTransition();
      finishTerrainTransition();
      if (hoverApi) hoverApi.dispose();
      if (pointTransition?.oldGroup) {
        scene.remove(pointTransition.oldGroup);
        disposePointGroup(pointTransition.oldGroup);
      }
      if (gamePoints) {
        disposePointGroup(gamePoints);
      }
      if (terrain) {
        terrain.geometry.dispose();
        terrain.material.dispose();
      }
      window.removeEventListener("resize", onResize);
      window.removeEventListener("steamscape:focus-game", onFocusGameEvent);
      window.removeEventListener("steamscape:select-game", onSelectGameEvent);
    }
  };
}