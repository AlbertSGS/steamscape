import * as THREE from "three";

export function setupHover({
    camera,
    scene,
    renderer,
    pointGroup,
    terrain,
    tooltip,
    getMetricInfo
}) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    let hovered = null;
    let selected = null;

    function resetScale(object) {
        if (!object) return;
        if (object === selected) {
            object.scale.set(1.85, 1.85, 1.85);
        } else {
            object.scale.set(1, 1, 1);
        }
    }

    function setHovered(object) {
        if (hovered && hovered !== object) {
            resetScale(hovered);
        }

        hovered = object;

        if (hovered && hovered !== selected) {
            hovered.scale.set(1.6, 1.6, 1.6);
        }
    }

    function pickObject(event) {
        const rect = renderer.domElement.getBoundingClientRect();

        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const pointHits = raycaster.intersectObjects(pointGroup.children, false);
        const terrainHits = terrain ? raycaster.intersectObject(terrain, false) : [];

        const pointHit = pointHits[0] || null;
        const terrainHit = terrainHits[0] || null;

        if (pointHit && terrainHit && terrainHit.distance < pointHit.distance) {
            return { rect, object: null };
        }

        return { rect, object: pointHit ? pointHit.object : null };
    }

    function onPointerMove(event) {
        const { rect, object } = pickObject(event);

        if (object) {
            const game = object.userData.game;
            const height = object.userData.height ?? 0;
            const { metricKey, metricLabel } = getMetricInfo();

            setHovered(object);

            tooltip.show(
                game,
                height,
                event.clientX - rect.left,
                event.clientY - rect.top,
                metricKey,
                metricLabel
            );
        } else {
            if (hovered) {
                resetScale(hovered);
                hovered = null;
            }
            tooltip.hide();
        }
    }

    function onClick(event) {
        const { object } = pickObject(event);

        if (selected && selected !== object) {
            selected.scale.set(1, 1, 1);
        }

        if (object) {
            selected = object;
            selected.scale.set(1.85, 1.85, 1.85);

            const game = object.userData.game;

            window.dispatchEvent(
                new CustomEvent("steamscape:select-game", {
                    detail: { game }
                })
            );

            window.dispatchEvent(
                new CustomEvent("steamscape:focus-game", {
                    detail: { appid: game.appid }
                })
            );
        }
    }

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("click", onClick);

    return {
        dispose() {
            renderer.domElement.removeEventListener("pointermove", onPointerMove);
            renderer.domElement.removeEventListener("click", onClick);
        }
    };
}