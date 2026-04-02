import * as THREE from "three";

export function addLighting(scene) {
  // Cool skylight + subtle ground bounce.
  const hemiLight = new THREE.HemisphereLight(0xe8f1ff, 0xc7d0dc, 0.55);
  scene.add(hemiLight);

  // Keep ambient low so the sunlight direction is visible.
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // Warm directional sunlight.
  const sunLight = new THREE.DirectionalLight(0xfff1d1, 2.2);
  sunLight.position.set(170, 95, 35);
  sunLight.castShadow = true;

  sunLight.shadow.mapSize.width = 4096;
  sunLight.shadow.mapSize.height = 4096;

  sunLight.shadow.camera.left = -170;
  sunLight.shadow.camera.right = 170;
  sunLight.shadow.camera.top = 170;
  sunLight.shadow.camera.bottom = -170;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 360;

  sunLight.shadow.bias = -0.00012;
  sunLight.shadow.normalBias = 0.02;

  scene.add(sunLight);
}