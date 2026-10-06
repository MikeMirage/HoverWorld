// HoverWorld - Per-biome weather & ambience.
// GPU-wrapped precipitation volumes (rain streaks, snow, sand, ash, embers,
// pollen, spores, fireflies), volumetric mist layers, lightning storms, lava
// geysers, dust devils and bird flocks. Everything follows the camera.
(function () {
    const WEATHER = {
        emerald_plains: {
            sun: 1,
            name: "Día soleado", icon: "☀️",
            layers: [{ kind: "points", preset: "pollen" }],
            birds: true, fog: 1, wind: 0.15, gust: 0
        },
        ember_badlands: {
            sky: { top: 0xc8875a, horizon: 0xeab98a, amount: 0.45 },
            sun: 0.8,
            name: "Calima", icon: "🌫️",
            layers: [{ kind: "points", preset: "dust" }],
            dustDevils: true, mist: { color: 0xe8b07a, opacity: 0.18, heights: [8, 22] }, fog: 0.82, wind: 0.5, gust: 4
        },
        frost_tundra: {
            sky: { top: 0x9aaabc, horizon: 0xe4eaf0, amount: 0.55 },
            sun: 0.65,
            name: "Nevada", icon: "❄️",
            layers: [{ kind: "points", preset: "snow" }, { kind: "points", preset: "snowFine" }],
            mist: { color: 0xf2f6fa, opacity: 0.22, heights: [6, 18] }, fog: 0.72, wind: 0.6, gust: 3
        },
        neon_coast: {
            sky: { top: 0x7c9cb4, horizon: 0xc8dce6, amount: 0.45 },
            sun: 0.55,
            name: "Lluvia ligera", icon: "🌦️",
            layers: [{ kind: "rain", preset: "drizzle" }],
            birds: true, mist: { color: 0xd8f2f8, opacity: 0.16, heights: [5, 14] }, fog: 0.86, wind: 0.3, gust: 1.5, rain: 0.35
        },
        obsidian_ridge: {
            sky: { top: 0x2a0f10, horizon: 0x8a3a2a, amount: 0.45 },
            sun: 0.8,
            name: "Erupción volcánica", icon: "🌋",
            layers: [{ kind: "points", preset: "ash" }, { kind: "points", preset: "embers" }],
            geysers: true, mist: { color: 0x5a3030, opacity: 0.2, heights: [10, 28] }, fog: 0.85, wind: 0.2, gust: 1, lava: 1
        },
        golden_dunes: {
            sky: { top: 0xc9a06a, horizon: 0xe8c58e, amount: 0.75 },
            sun: 0.5,
            name: "Tormenta de arena", icon: "🏜️",
            layers: [{ kind: "points", preset: "sand" }, { kind: "rain", preset: "sandStreak" }],
            mist: { color: 0xe6c48a, opacity: 0.28, heights: [6, 18, 34] }, fog: 0.55, wind: 1, gust: 9, sandstorm: true
        },
        moss_ruins: {
            sky: { top: 0x9fbab0, horizon: 0xe2eee6, amount: 0.55 },
            sun: 0.55,
            name: "Bruma", icon: "🌁",
            layers: [{ kind: "points", preset: "fireflies" }],
            mist: { color: 0xdcefe2, opacity: 0.34, heights: [4, 11, 20, 32] }, fog: 0.62, wind: 0.1, gust: 0
        },
        crimson_isles: {
            sun: 0.85,
            name: "Esporas", icon: "🌸",
            layers: [{ kind: "points", preset: "spores" }],
            mist: { color: 0xf4c0c0, opacity: 0.16, heights: [8, 20] }, fog: 0.85, wind: 0.25, gust: 1
        },
        storm_plateau: {
            sky: { top: 0x232a36, horizon: 0x707c8c, amount: 0.6 },
            sun: 0.3,
            name: "Tormenta eléctrica", icon: "⛈️",
            layers: [{ kind: "rain", preset: "storm" }],
            lightning: true, mist: { color: 0x8a96a8, opacity: 0.22, heights: [10, 26] }, fog: 0.7, wind: 0.8, gust: 6, rain: 1
        },
        aurora_highlands: {
            sun: 1,
            name: "Nieve y aurora", icon: "🌌",
            layers: [{ kind: "points", preset: "snowLight" }, { kind: "points", preset: "sparkle" }],
            fog: 0.9, wind: 0.25, gust: 0.5
        }
    };

    // Point / streak presets: vel in m/s, box = wrapped volume around the camera.
    const PRESETS = {
        pollen: { count: 700, color: 0xfff6c8, size: 1.1, vel: [1.5, 0.3, 0], sway: 2, opacity: 0.7, box: [260, 120, 260] },
        dust: { count: 2600, color: 0xe2b27a, size: 1.4, vel: [14, -0.5, 4], sway: 1.5, opacity: 0.45, box: [320, 140, 320] },
        snow: { count: 5200, color: 0xffffff, size: 2.1, vel: [3, -9, 1], sway: 2.5, opacity: 0.9, box: [300, 180, 300] },
        snowFine: { count: 3000, color: 0xeef6ff, size: 1.1, vel: [5, -6, 2], sway: 1.5, opacity: 0.7, box: [180, 120, 180] },
        snowLight: { count: 2200, color: 0xf2f6ff, size: 1.8, vel: [1.5, -5, 0.5], sway: 2, opacity: 0.8, box: [260, 160, 260] },
        sparkle: { count: 500, color: 0xa8ffe8, size: 1.6, vel: [0, 0.5, 0], sway: 3, opacity: 0.9, box: [240, 120, 240], additive: true, twinkle: true },
        ash: { count: 3200, color: 0x8a7a7a, size: 1.9, vel: [2, -4, 1], sway: 2, opacity: 0.8, box: [300, 170, 300] },
        embers: { count: 900, color: 0xff7a2a, size: 1.6, vel: [1, 6, 0], sway: 3, opacity: 1, box: [260, 140, 260], additive: true, twinkle: true },
        sand: { count: 9000, color: 0xd8b070, size: 1.9, vel: [55, -1, 14], sway: 2, opacity: 0.75, box: [240, 110, 240] },
        fireflies: { count: 650, color: 0xd8ff7a, size: 1.7, vel: [0, 0.2, 0], sway: 4, opacity: 1, box: [260, 22, 260], additive: true, twinkle: true, band: [2, 26] },
        spores: { count: 1600, color: 0xffb8d0, size: 1.5, vel: [2, 1.2, 0.5], sway: 3.5, opacity: 0.75, box: [260, 140, 260] },
        drizzle: { count: 5200, color: 0xe2f0ff, vel: [4, -60, 1], streak: 4.5, opacity: 0.45, box: [220, 150, 220] },
        storm: { count: 9000, color: 0xd6e2f2, vel: [12, -85, 3], streak: 6, opacity: 0.36, box: [240, 170, 240] },
        sandStreak: { count: 4200, color: 0xf0d098, vel: [80, -2, 18], streak: 9, opacity: 0.32, box: [220, 90, 220] }
    };

    const Wx = { scene: null, active: [], mists: [], theme: null, cfg: null, time: 0, flash: 0, nextBolt: 6, bolt: null, geysers: [], devils: [], birds: [], gustT: 0, windPush: new THREE.Vector3(), quality: "high" };

    const NOISE = `
        float wx_hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float wx_noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(wx_hash(i), wx_hash(i + vec2(1.0, 0.0)), f.x), mix(wx_hash(i + vec2(0.0, 1.0)), wx_hash(i + vec2(1.0, 1.0)), f.x), f.y); }
        float wx_fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * wx_noise(p); p *= 2.07; a *= 0.5; } return v; }
    `;

    function countFor(n) { return Math.round(n * (Wx.quality === "low" ? 0.45 : 1)); }

    function makePoints(p) {
        const count = countFor(p.count);
        const pos = new Float32Array(count * 3);
        const rnd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = Math.random() * p.box[0];
            pos[i * 3 + 1] = Math.random() * p.box[1];
            pos[i * 3 + 2] = Math.random() * p.box[2];
            rnd[i] = Math.random();
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(...p.box) },
                uVel: { value: new THREE.Vector3(...p.vel) }, uSway: { value: p.sway || 0 }, uSize: { value: p.size },
                uColor: { value: new THREE.Color(p.color) }, uOpacity: { value: p.opacity }, uTwinkle: { value: p.twinkle ? 1 : 0 },
                uBand: { value: new THREE.Vector2(p.band ? p.band[0] : 0, p.band ? p.band[1] : 0) }, uPixel: { value: 1 }
            },
            vertexShader: `
                uniform float uTime; uniform vec3 uCam; uniform vec3 uBox; uniform vec3 uVel; uniform float uSway; uniform float uSize; uniform vec2 uBand; uniform float uPixel;
                attribute float aRand; varying float vAlpha; varying float vRand;
                void main(){
                    vec3 p = position + uVel * uTime;
                    p.x += sin(uTime * 1.3 + aRand * 20.0) * uSway;
                    p.z += cos(uTime * 1.1 + aRand * 17.0) * uSway;
                    p.y += sin(uTime * 0.9 + aRand * 11.0) * uSway * 0.4;
                    vec3 rel = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5;
                    vec3 world = uCam + rel;
                    if (uBand.y > 0.0) world.y = uBand.x + mod(p.y, uBand.y - uBand.x);
                    vec4 mv = viewMatrix * vec4(world, 1.0);
                    gl_Position = projectionMatrix * mv;
                    float dist = -mv.z;
                    gl_PointSize = uSize * uPixel * (320.0 / max(dist, 1.0)) * (0.6 + aRand * 0.8);
                    vAlpha = smoothstep(uBox.x * 0.5, uBox.x * 0.3, length(rel.xz)) * smoothstep(0.8, 5.0, dist);
                    vRand = aRand;
                }`,
            fragmentShader: `
                uniform vec3 uColor; uniform float uOpacity; uniform float uTwinkle; uniform float uTime;
                varying float vAlpha; varying float vRand;
                void main(){
                    float d = length(gl_PointCoord - 0.5);
                    float a = smoothstep(0.5, 0.08, d);
                    float tw = mix(1.0, 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (3.0 + vRand * 5.0) + vRand * 40.0)), uTwinkle);
                    vec3 col = uColor * (0.85 + vRand * 0.3);
                    gl_FragColor = vec4(col, a * vAlpha * uOpacity * tw);
                }`,
            transparent: true,
            depthWrite: false,
            blending: p.additive ? THREE.AdditiveBlending : THREE.NormalBlending
        });
        const obj = new THREE.Points(g, mat);
        obj.frustumCulled = false;
        obj.renderOrder = 5;
        return obj;
    }

    function makeStreaks(p) {
        const count = countFor(p.count);
        const pos = new Float32Array(count * 6);
        const end = new Float32Array(count * 2);
        const rnd = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
            const x = Math.random() * p.box[0], y = Math.random() * p.box[1], z = Math.random() * p.box[2], r = Math.random();
            pos.set([x, y, z, x, y, z], i * 6);
            end[i * 2] = 0; end[i * 2 + 1] = 1;
            rnd[i * 2] = r; rnd[i * 2 + 1] = r;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        g.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
        g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(...p.box) },
                uVel: { value: new THREE.Vector3(...p.vel) }, uStreak: { value: p.streak }, uColor: { value: new THREE.Color(p.color) },
                uOpacity: { value: p.opacity }, uFlash: { value: 0 }
            },
            vertexShader: `
                uniform float uTime; uniform vec3 uCam; uniform vec3 uBox; uniform vec3 uVel; uniform float uStreak;
                attribute float aEnd; attribute float aRand; varying float vAlpha;
                void main(){
                    vec3 vel = uVel * (0.85 + aRand * 0.3);
                    vec3 p = position + vel * uTime;
                    vec3 rel = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5;
                    vec3 world = uCam + rel - normalize(vel) * uStreak * aEnd;
                    vec4 mv = viewMatrix * vec4(world, 1.0);
                    gl_Position = projectionMatrix * mv;
                    vAlpha = smoothstep(uBox.x * 0.5, uBox.x * 0.25, length(rel.xz)) * smoothstep(1.0, 6.0, -mv.z) * mix(1.0, 0.25, aEnd);
                }`,
            fragmentShader: `
                uniform vec3 uColor; uniform float uOpacity; uniform float uFlash; varying float vAlpha;
                void main(){ gl_FragColor = vec4(uColor * (1.0 + uFlash * 1.5), vAlpha * uOpacity * (1.0 + uFlash)); }`,
            transparent: true,
            depthWrite: false
        });
        const obj = new THREE.LineSegments(g, mat);
        obj.frustumCulled = false;
        obj.renderOrder = 5;
        return obj;
    }

    function makeMistLayer(color, opacity, height, seed) {
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity },
                uCam: { value: new THREE.Vector3() }, uSeed: { value: seed }, uFlash: { value: 0 }
            },
            vertexShader: `
                varying vec3 vWorld;
                void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
            fragmentShader: `
                uniform float uTime; uniform vec3 uColor; uniform float uOpacity; uniform vec3 uCam; uniform float uSeed; uniform float uFlash;
                varying vec3 vWorld;
                ${NOISE}
                void main(){
                    vec2 p = vWorld.xz * 0.0045 + vec2(uTime * 0.012, uTime * 0.006) + uSeed;
                    float n = wx_fbm(p) * 0.7 + wx_fbm(p * 3.1 - uTime * 0.02) * 0.3;
                    float a = smoothstep(0.38, 0.78, n);
                    float dist = length(vWorld.xz - uCam.xz);
                    a *= smoothstep(720.0, 380.0, dist);
                    // Fade when the camera is inside the layer so it never becomes a flat wall.
                    a *= smoothstep(1.0, 9.0, abs(uCam.y - vWorld.y));
                    gl_FragColor = vec4(uColor * (1.0 + uFlash * 0.8), a * uOpacity);
                }`,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1500, 1, 1), mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.userData.height = height;
        mesh.frustumCulled = false;
        mesh.renderOrder = 4;
        return mesh;
    }

    // ---------- lightning ----------
    function buildBolt(origin) {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color: 0xeef4ff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
        const addChain = (start, steps, length, thickness) => {
            let p = start.clone();
            for (let i = 0; i < steps; i++) {
                const next = p.clone().add(new THREE.Vector3((Math.random() - 0.5) * length * 0.8, -length, (Math.random() - 0.5) * length * 0.8));
                const dir = next.clone().sub(p);
                const seg = new THREE.Mesh(new THREE.CylinderGeometry(thickness, thickness, dir.length(), 4, 1, true), mat);
                seg.position.copy(p).addScaledVector(dir, 0.5);
                seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
                group.add(seg);
                if (Math.random() < 0.18 && thickness > 0.7) addChain(next, 4, length * 0.7, thickness * 0.5);
                p = next;
                if (p.y < 0) break;
            }
        };
        addChain(origin, 14, (origin.y) / 13, 1.6);
        return { group, mat };
    }

    function triggerLightning(cam) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 350 + Math.random() * 550;
        const origin = new THREE.Vector3(cam.position.x + Math.sin(angle) * dist, 320, cam.position.z - Math.abs(Math.cos(angle)) * dist);
        if (Wx.bolt) Wx.scene.remove(Wx.bolt.group);
        Wx.bolt = buildBolt(origin);
        Wx.bolt.life = 0.35;
        Wx.scene.add(Wx.bolt.group);
        Wx.flash = 1;
        if (window.GameAudio) setTimeout(() => GameAudio.play("thunder", dist), Math.min(2500, dist * 2.2));
    }

    // ---------- lava geysers (volcano) ----------
    function buildGeyser() {
        const count = countFor(260);
        const pos = new Float32Array(count * 3);
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0xff8a2a, size: 4.2, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, map: softDot(), sizeAttenuation: true });
        const pts = new THREE.Points(g, mat);
        pts.frustumCulled = false;
        const vel = new Float32Array(count * 3);
        const life = new Float32Array(count);
        const warn = new THREE.Mesh(new THREE.CircleGeometry(16, 28), new THREE.MeshBasicMaterial({ color: 0xff4a1a, transparent: true, opacity: 0, depthWrite: false }));
        warn.rotation.x = -Math.PI / 2;
        const column = new THREE.Mesh(new THREE.CylinderGeometry(4, 9, 1, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        Wx.scene.add(pts, warn, column);
        return { pts, vel, life, count, warn, column, state: "idle", t: 0, x: 0, z: 0, height: 0, hit: false };
    }

    let dotTexture = null;
    function softDot() {
        if (dotTexture) return dotTexture;
        const c = document.createElement("canvas");
        c.width = c.height = 64;
        const ctx = c.getContext("2d");
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.35, "rgba(255,255,255,0.7)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        dotTexture = new THREE.CanvasTexture(c);
        return dotTexture;
    }

    function updateGeysers(delta, focus) {
        Wx.geysers.forEach((gz, idx) => {
            gz.t -= delta;
            if (gz.state === "idle" && gz.t <= 0) {
                gz.state = "warn";
                gz.t = 1.6;
                gz.x = focus.x + (Math.random() - 0.5) * 360;
                gz.z = focus.z - 220 - Math.random() * 480;
                if (window.WorldGfx && Math.random() < 0.6) gz.x = WorldGfx.riverX(gz.z) + (Math.random() - 0.5) * 60;
                gz.warn.position.set(gz.x, 0.5, gz.z);
                gz.column.position.set(gz.x, 0, gz.z);
                gz.hit = false;
                gz.height = 70 + Math.random() * 50;
            } else if (gz.state === "warn") {
                gz.warn.material.opacity = 0.35 + 0.35 * Math.sin(performance.now() * 0.03);
                if (gz.t <= 0) {
                    gz.state = "erupt";
                    gz.t = 3.2;
                    for (let i = 0; i < gz.count; i++) gz.life[i] = -Math.random() * 1.2;
                    if (window.GameAudio && Math.hypot(focus.x - gz.x, focus.z - gz.z) < 500) GameAudio.play("eruption");
                }
            } else if (gz.state === "erupt") {
                gz.warn.material.opacity = 0.6;
                const k = Math.min(1, (3.2 - gz.t) * 3) * Math.min(1, gz.t * 2);
                gz.column.material.opacity = 0.35 * k;
                gz.column.scale.set(1, gz.height * k, 1);
                gz.column.position.y = gz.height * k * 0.5;
                if (gz.t <= 0) { gz.state = "idle"; gz.t = 1.5 + Math.random() * 3 + idx; gz.column.material.opacity = 0; gz.warn.material.opacity = 0; }
                // Flying through the eruption costs shield.
                if (!gz.hit && typeof playerShip !== "undefined" && Math.hypot(playerShip.position.x - gz.x, playerShip.position.z - gz.z) < 12 && playerShip.position.y < gz.height * k) {
                    gz.hit = true;
                    if (window.Combat && typeof isPlaying !== "undefined" && isPlaying) {
                        Combat.addShield(-30);
                        if (Combat.shield <= 0 && typeof triggerCriticalCrash === "function") triggerCriticalCrash("ENGULLIDO POR LA LAVA", "#ff7a3a");
                        if (typeof flashScreen === "function") flashScreen("rgba(255,120,40,1)", 0.35);
                    }
                }
            }
            const pos = gz.pts.geometry.attributes.position.array;
            const erupting = gz.state === "erupt";
            for (let i = 0; i < gz.count; i++) {
                gz.life[i] += delta;
                if (gz.life[i] >= 0 && gz.life[i] < delta * 1.5 && erupting) {
                    pos[i * 3] = gz.x + (Math.random() - 0.5) * 6;
                    pos[i * 3 + 1] = 1;
                    pos[i * 3 + 2] = gz.z + (Math.random() - 0.5) * 6;
                    gz.vel[i * 3] = (Math.random() - 0.5) * 22;
                    gz.vel[i * 3 + 1] = 45 + Math.random() * 45;
                    gz.vel[i * 3 + 2] = (Math.random() - 0.5) * 22;
                }
                if (gz.life[i] > 2.4 && erupting) gz.life[i] = -Math.random() * 0.2;
                if (gz.life[i] >= 0) {
                    gz.vel[i * 3 + 1] -= 32 * delta;
                    pos[i * 3] += gz.vel[i * 3] * delta;
                    pos[i * 3 + 1] = Math.max(-5, pos[i * 3 + 1] + gz.vel[i * 3 + 1] * delta);
                    pos[i * 3 + 2] += gz.vel[i * 3 + 2] * delta;
                } else if (!erupting) {
                    pos[i * 3 + 1] = -50;
                }
            }
            gz.pts.geometry.attributes.position.needsUpdate = true;
        });
    }

    // ---------- dust devils ----------
    function buildDevil() {
        const count = countFor(220);
        const g = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0xd8a870, size: 3.4, transparent: true, opacity: 0.55, depthWrite: false, map: softDot() });
        const pts = new THREE.Points(g, mat);
        pts.frustumCulled = false;
        Wx.scene.add(pts);
        const seeds = new Float32Array(count);
        for (let i = 0; i < count; i++) seeds[i] = Math.random();
        return { pts, seeds, count, x: 0, z: 0, life: 0, drift: new THREE.Vector2() };
    }

    function updateDevils(delta, focus) {
        const t = Wx.time;
        Wx.devils.forEach((d) => {
            d.life -= delta;
            if (d.life <= 0 || Math.hypot(d.x - focus.x, d.z - focus.z) > 900) {
                d.x = focus.x + (Math.random() - 0.5) * 600;
                d.z = focus.z - 200 - Math.random() * 600;
                d.life = 18 + Math.random() * 10;
                d.drift.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
            }
            d.x += d.drift.x * delta;
            d.z += d.drift.y * delta;
            const pos = d.pts.geometry.attributes.position.array;
            for (let i = 0; i < d.count; i++) {
                const s = d.seeds[i];
                const h = ((s * 97.3 + t * 0.25) % 1) * 55;
                const r = 2 + h * 0.28 + Math.sin(s * 40) * 1.5;
                const a = s * 60 + t * (3 + s * 2) - h * 0.08;
                pos[i * 3] = d.x + Math.cos(a) * r;
                pos[i * 3 + 1] = h;
                pos[i * 3 + 2] = d.z + Math.sin(a) * r;
            }
            d.pts.geometry.attributes.position.needsUpdate = true;
        });
    }

    // ---------- birds ----------
    function buildFlock() {
        const flock = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color: 0x2a2a30, side: THREE.DoubleSide });
        const birds = [];
        for (let i = 0; i < 7; i++) {
            const bird = new THREE.Group();
            [-1, 1].forEach((side) => {
                const wingGeom = new THREE.BufferGeometry();
                wingGeom.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.4, side * 2.2, 0, 0.3, 0, 0, 0.8], 3));
                const wing = new THREE.Mesh(wingGeom, mat);
                wing.userData.side = side;
                bird.add(wing);
            });
            const k = i - 3;
            bird.position.set(k * 4, -Math.abs(k) * 0.6, Math.abs(k) * 5);
            bird.userData.phase = Math.random() * 6;
            flock.add(bird);
            birds.push(bird);
        }
        Wx.scene.add(flock);
        return { flock, birds, life: 0, vel: new THREE.Vector3() };
    }

    function updateBirds(delta, focus) {
        const t = Wx.time;
        Wx.birds.forEach((f) => {
            f.life -= delta;
            if (f.life <= 0 || f.flock.position.distanceTo(focus) > 1000) {
                const side = Math.random() < 0.5 ? -1 : 1;
                f.flock.position.set(focus.x - side * 300, 45 + Math.random() * 60, focus.z - 300 - Math.random() * 400);
                f.vel.set(side * (14 + Math.random() * 8), 0, -4);
                f.flock.rotation.y = Math.atan2(-f.vel.x, -f.vel.z);
                f.life = 45;
            }
            f.flock.position.addScaledVector(f.vel, delta);
            f.birds.forEach((b) => {
                const flap = Math.sin(t * 9 + b.userData.phase) * 0.7;
                b.children.forEach((w) => { w.rotation.z = w.userData.side * flap; });
            });
        });
    }

    // ---------- lifecycle ----------
    function clear() {
        Wx.active.forEach((o) => { Wx.scene.remove(o); o.geometry.dispose(); o.material.dispose(); });
        Wx.mists.forEach((m) => { Wx.scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
        Wx.geysers.forEach((g) => { Wx.scene.remove(g.pts, g.warn, g.column); });
        Wx.devils.forEach((d) => Wx.scene.remove(d.pts));
        Wx.birds.forEach((b) => Wx.scene.remove(b.flock));
        if (Wx.bolt) Wx.scene.remove(Wx.bolt.group);
        Wx.active = []; Wx.mists = []; Wx.geysers = []; Wx.devils = []; Wx.birds = []; Wx.bolt = null;
    }

    function init(scene) {
        Wx.scene = scene;
    }

    function setTheme(themeId, quality) {
        if (!Wx.scene) return;
        if (Wx.theme === themeId && Wx.quality === (quality || Wx.quality)) {
            applyEnvironment(Wx.cfg);
            return;
        }
        Wx.theme = themeId;
        Wx.quality = quality || Wx.quality;
        clear();
        const cfg = WEATHER[themeId] || WEATHER.emerald_plains;
        Wx.cfg = cfg;
        cfg.layers.forEach((layer) => {
            const preset = PRESETS[layer.preset];
            const obj = layer.kind === "rain" ? makeStreaks(preset) : makePoints(preset);
            Wx.scene.add(obj);
            Wx.active.push(obj);
        });
        if (cfg.mist) {
            cfg.mist.heights.forEach((h, i) => {
                const m = makeMistLayer(cfg.mist.color, cfg.mist.opacity, h, i * 13.7);
                Wx.scene.add(m);
                Wx.mists.push(m);
            });
        }
        if (cfg.geysers) for (let i = 0; i < 3; i++) { const g = buildGeyser(); g.t = 1 + i * 2.5; Wx.geysers.push(g); }
        if (cfg.dustDevils) for (let i = 0; i < 3; i++) Wx.devils.push(buildDevil());
        if (cfg.birds) for (let i = 0; i < 2; i++) Wx.birds.push(buildFlock());
        Wx.nextBolt = 3 + Math.random() * 4;
        applyEnvironment(cfg);
        if (window.GameAudio && GameAudio.setAmbience) GameAudio.setAmbience({ rain: cfg.rain || 0, wind: cfg.wind || 0, lava: cfg.lava || 0 });
    }

    function applyEnvironment(cfg) {
        if (!cfg || !window.WorldGfx) return;
        WorldGfx.setWeatherFog(cfg.fog, cfg.sun ?? 1);
        WorldGfx.setWeatherSky(cfg.sky || null);
    }

    function update(delta, cam, focus) {
        if (!Wx.cfg) return;
        Wx.time += delta;
        const pr = (typeof renderer !== "undefined" && renderer.getPixelRatio()) || 1;
        Wx.active.forEach((o) => {
            const u = o.material.uniforms;
            u.uTime.value = Wx.time;
            u.uCam.value.copy(cam.position);
            if (u.uPixel) u.uPixel.value = pr;
            if (u.uFlash) u.uFlash.value = Wx.flash;
        });
        Wx.mists.forEach((m) => {
            m.position.set(cam.position.x, m.userData.height, cam.position.z);
            m.material.uniforms.uTime.value = Wx.time;
            m.material.uniforms.uCam.value.copy(cam.position);
            m.material.uniforms.uFlash.value = Wx.flash;
        });
        if (Wx.cfg.lightning) {
            Wx.nextBolt -= delta;
            if (Wx.nextBolt <= 0) {
                triggerLightning(cam);
                Wx.nextBolt = 4 + Math.random() * 7;
                if (Math.random() < 0.35) setTimeout(() => { Wx.flash = 0.8; }, 140);
            }
        }
        if (Wx.bolt) {
            Wx.bolt.life -= delta;
            Wx.bolt.mat.opacity = Wx.bolt.life > 0 ? (Math.random() < 0.7 ? 1 : 0.2) : 0;
            if (Wx.bolt.life <= 0) { Wx.scene.remove(Wx.bolt.group); Wx.bolt = null; }
        }
        Wx.flash = Math.max(0, Wx.flash - delta * 3.2);
        if (window.WorldGfx && WorldGfx.setFlash) WorldGfx.setFlash(Wx.flash);
        if (Wx.geysers.length) updateGeysers(delta, focus);
        if (Wx.devils.length) updateDevils(delta, focus);
        if (Wx.birds.length) updateBirds(delta, focus);
        // Wind gusts push the aircraft sideways in rough weather.
        Wx.gustT += delta;
        const gust = (Wx.cfg.gust || 0) * (0.5 + 0.5 * Math.sin(Wx.gustT * 0.7) * Math.sin(Wx.gustT * 1.9 + 1));
        Wx.windPush.set(gust, 0, gust * 0.3);
    }

    window.Weather = {
        init, setTheme, update,
        get name() { return Wx.cfg ? `${Wx.cfg.icon} ${Wx.cfg.name}` : ""; },
        describe(themeId) { const c = WEATHER[themeId]; return c ? `${c.icon} ${c.name}` : ""; },
        get windPush() { return Wx.windPush; },
        get turbulence() { return Wx.cfg ? (Wx.cfg.gust || 0) / 9 : 0; }
    };
})();
