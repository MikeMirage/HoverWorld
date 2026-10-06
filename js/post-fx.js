// HoverWorld - Render quality presets.
// "high" renders at up to 2x device pixels with soft 2048 shadows; "low" keeps
// 1x resolution and cheaper shadows for phones and older GPUs.
(function () {
    const PREF_KEY = "hoverworld-quality-v1";
    let renderer, scene, camera, sun = null;
    let quality = "high";

    function defaultQuality() {
        const mobile = Math.min(window.innerWidth, window.innerHeight) < 600 || /Android|iPhone|iPad/i.test(navigator.userAgent);
        return mobile ? "low" : "high";
    }

    function readQuality() {
        try { return localStorage.getItem(PREF_KEY) || defaultQuality(); } catch (e) { return defaultQuality(); }
    }

    function findSun() {
        if (sun) return sun;
        scene.traverse((obj) => { if (!sun && obj.isDirectionalLight && obj.castShadow) sun = obj; });
        return sun;
    }

    function apply() {
        const dpr = window.devicePixelRatio || 1;
        renderer.setPixelRatio(quality === "high" ? Math.min(dpr, 2) : Math.min(dpr, 1.25));
        renderer.shadowMap.type = quality === "high" ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
        if (window.WorldGfx) WorldGfx.setDetail(quality);
        const light = findSun();
        if (light) {
            const size = quality === "high" ? 2048 : 1024;
            if (light.shadow.mapSize.x !== size) {
                light.shadow.mapSize.set(size, size);
                if (light.shadow.map) {
                    light.shadow.map.dispose();
                    light.shadow.map = null;
                }
            }
        }
        scene.traverse((obj) => { if (obj.material && obj.material.needsUpdate !== undefined) obj.material.needsUpdate = true; });
    }

    function init(r, s, c) {
        renderer = r; scene = s; camera = c;
        quality = readQuality();
        apply();
    }

    function setQuality(q) {
        quality = q === "low" ? "low" : "high";
        try { localStorage.setItem(PREF_KEY, quality); } catch (e) { /* ignore */ }
        apply();
    }

    function getQuality() {
        return quality;
    }

    function render() {
        renderer.render(scene, camera);
        if (window.WorldGfx && WorldGfx.renderOverlay) WorldGfx.renderOverlay(renderer);
    }

    function resize() { /* renderer.setSize handles everything for now */ }

    window.PostFX = { init, render, resize, setQuality, getQuality };
})();
