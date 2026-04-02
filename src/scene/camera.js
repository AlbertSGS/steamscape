import * as THREE from "three";

export function createCamera(container) {
  const width = container.clientWidth;
  const height = container.clientHeight || 500;

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
  camera.position.set(0, 80, 140);

  return camera;
}