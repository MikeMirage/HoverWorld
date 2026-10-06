// HoverWorld - Per-biome weather & ambience.
// GPU-wrapped precipitation volumes (rain streaks, snow, sand, ash, embers,
// pollen, spores, fireflies), volumetric mist layers, lightning storms, lava
// geysers, dust devils and bird flocks. Everything follows the camera.
(function () {
    // ground: shader effects on the terrain (cloudShadow, wet puddles, snowGlint, sandFlow, lava cracks)
    const WEATHER = {
        emerald_plains: {
            sun: 1, name: "Día soleado", icon: "☀️", layers: [],
            ground: { cloudShadow: 0.8, cloudCover: 0.3, wind: [1, 0.3] },
            birds: true, fog: 1, wind: 0.15, gust: 0
        },
        ember_badlands: {
            sky: { top: 0xc8875a, horizon: 0xeab98a, amount: 0.45 }, sun: 0.8, name: "Calima", icon: "🌫️",
            layers: [{ kind: "points", preset: "dust" }],
            ground: { cloudShadow: 0.3, sandFlow: 0.5, cloudCover: 0.15, wind: [1, 0.25] },
            dustDevils: true, mist: { color: 0xe8b07a, opacity: 0.14, heights: [10] }, fog: 0.82, wind: 0.5, gust: 4
        },
        frost_tundra: {
            sky: { top: 0x9aaabc, horizon: 0xe4eaf0, amount: 0.55 }, sun: 0.65, name: "Nevada", icon: "❄️",
            layers: [{ kind: "points", preset: "snow" }],
            ground: { cloudShadow: 0.35, snowGlint: 1, cloudCover: 0.6, wind: [1, 0.4] },
            mist: { color: 0xf2f6fa, opacity: 0.2, heights: [8] }, fog: 0.72, wind: 0.6, gust: 3
        },
        neon_coast: {
            sky: { top: 0x7c9cb4, horizon: 0xc8dce6, amount: 0.45 }, sun: 0.55, name: "Lluvia ligera", icon: "🌦️",
            layers: [{ kind: "rain", preset: "drizzle" }],
            ground: { cloudShadow: 0.4, wet: 0.7, cloudCover: 0.6, wind: [0.6, 1] },
            birds: true, mist: { color: 0xd8f2f8, opacity: 0.14, heights: [6] }, fog: 0.86, wind: 0.3, gust: 1.5, rain: 0.35
        },
        obsidian_ridge: {
            sky: { top: 0x2a0f10, horizon: 0x8a3a2a, amount: 0.45 }, sun: 0.8, name: "Erupción volcánica", icon: "🌋",
            layers: [{ kind: "points", preset: "embers" }],
            ground: { cloudShadow: 0.5, lava: 1, cloudCover: 0.55, wind: [0.4, 1] },
            geysers: true, mist: { color: 0x5a3030, opacity: 0.18, heights: [14] }, fog: 0.85, wind: 0.2, gust: 1, lava: 1
        },
        golden_dunes: {
            sky: { top: 0xc9a06a, horizon: 0xe8c58e, amount: 0.75 }, sun: 0.5, name: "Tormenta de arena", icon: "🏜️",
            layers: [{ kind: "rain", preset: "sandStreak" }, { kind: "points", preset: "sand" }],
            ground: { cloudShadow: 0.2, sandFlow: 1, cloudCover: 0.1, wind: [1, 0.25] },
            mist: { color: 0xe6c48a, opacity: 0.26, heights: [8, 24] }, fog: 0.55, wind: 1, gust: 9, sandstorm: true
        },
        moss_ruins: {
            sky: { top: 0x9fbab0, horizon: 0xe2eee6, amount: 0.55 }, sun: 0.55, name: "Bruma", icon: "🌁",
            layers: [{ kind: "points", preset: "fireflies" }],
            ground: { cloudShadow: 0.3, wet: 0.25, cloudCover: 0.5, wind: [0.5, 1] },
            mist: { color: 0xdcefe2, opacity: 0.32, heights: [5, 14, 28] }, fog: 0.62, wind: 0.1, gust: 0
        },
        crimson_isles: {
            sun: 0.85, name: "Esporas", icon: "🌸",
            layers: [{ kind: "points", preset: "spores" }],
            ground: { cloudShadow: 0.6, cloudCover: 0.35, wind: [1, 0.6] },
            mist: { color: 0xf4c0c0, opacity: 0.14, heights: [10] }, fog: 0.85, wind: 0.25, gust: 1
        },
        storm_plateau: {
            sky: { top: 0x232a36, horizon: 0x707c8c, amount: 0.6 }, sun: 0.3, name: "Tormenta eléctrica", icon: "⛈️",
            layers: [{ kind: "rain", preset: "storm" }],
            ground: { cloudShadow: 0.25, wet: 1, cloudCover: 1, wind: [1, 0.5] },
            lightning: true, mist: { color: 0x8a96a8, opacity: 0.2, heights: [16] }, fog: 0.7, wind: 0.8, gust: 6, rain: 1
        },
        aurora_highlands: {
            sun: 1, name: "Nieve y aurora", icon: "🌌",
            layers: [{ kind: "points", preset: "snowLight" }],
            ground: { cloudShadow: 0, snowGlint: 1.3, cloudCover: 0.1, wind: [1, 0.2] },
            fog: 0.9, wind: 0.25, gust: 0.5
        }
    };

    // Point / streak presets: vel in m/s, box = wrapped volume around the camera.
    const PRESETS = {
        pollen: { count: 700, color: 0xfff6c8, size: 1.1, vel: [1.5, 0.3, 0], sway: 2, opacity: 0.7, box: [260, 120, 260] },
        dust: { count: 900, color: 0xe2b27a, size: 1.4, vel: [14, -0.5, 4], sway: 1.5, opacity: 0.45, box: [320, 140, 320] },
        snow: { count: 2400, color: 0xffffff, size: 2.4, vel: [3, -9, 1], sway: 2.5, opacity: 0.9, box: [300, 180, 300] },
        snowFine: { count: 3000, color: 0xeef6ff, size: 1.1, vel: [5, -6, 2], sway: 1.5, opacity: 0.7, box: [180, 120, 180] },
        snowLight: { count: 1100, color: 0xf2f6ff, size: 1.8, vel: [1.5, -5, 0.5], sway: 2, opacity: 0.8, box: [260, 160, 260] },
        sparkle: { count: 500, color: 0xa8ffe8, size: 1.6, vel: [0, 0.5, 0], sway: 3, opacity: 0.9, box: [240, 120, 240], additive: true, twinkle: true },
        ash: { count: 3200, color: 0x8a7a7a, size: 1.9, vel: [2, -4, 1], sway: 2, opacity: 0.8, box: [300, 170, 300] },
        embers: { count: 260, color: 0xff7a2a, size: 1.5, vel: [1, 5, 0], sway: 3, opacity: 0.9, box: [260, 140, 260], additive: true, twinkle: true },
        sand: { count: 2200, color: 0xd8b070, size: 1.6, vel: [55, -1, 14], sway: 2, opacity: 0.55, box: [200, 90, 200] },
        fireflies: { count: 220, color: 0xd8ff7a, size: 1.7, vel: [0, 0.2, 0], sway: 4, opacity: 1, box: [260, 22, 260], additive: true, twinkle: true, band: [2, 26] },
        spores: { count: 500, color: 0xffb8d0, size: 1.5, vel: [2, 1.2, 0.5], sway: 3.5, opacity: 0.75, box: [260, 140, 260] },
        drizzle: { count: 3200, color: 0xe2f0ff, vel: [4, -60, 1], streak: 4.5, opacity: 0.45, box: [220, 150, 220] },
        storm: { count: 5000, color: 0xd6e2f2, vel: [12, -85, 3], streak: 6, opacity: 0.36, box: [240, 170, 240] },
        sandStreak: { count: 2600, color: 0xf0d098, vel: [80, -2, 18], streak: 10, opacity: 0.28, box: [220, 90, 220] }
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

    // ---------- lightning (procedural bolt textures live in WorldGfx) ----------
    function triggerLightning(cam) {
        const angle = (Math.random() - 0.5) * 2.2;
        const dist = 380 + Math.random() * 520;
        const origin = new THREE.Vector3(cam.position.x + Math.sin(angle) * dist, 0, cam.position.z - Math.cos(angle) * dist);
        if (window.WorldGfx && WorldGfx.spawnLightning) WorldGfx.spawnLightning(origin, 300 + Math.random() * 80);
        Wx.flash = 0.55;
        if (window.GameAudio) setTimeout(() => GameAudio.play("thunder", dist), Math.min(2500, dist * 2.2));
    }

    // ---------- shader columns: lava geysers and dust devils ----------
    function columnMaterial(kind) {
        return new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 }, uSeed: { value: Math.random() * 10 } },
            vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
            fragmentShader: `
                uniform float uTime; uniform float uIntensity; uniform float uSeed;
                varying vec2 vUv;
                ${NOISE}
                void main(){
                    float y = vUv.y;
                    ${kind === "fire" ? `
                    vec2 q = vec2(vUv.x * 7.0 + uSeed, y * 2.6 - uTime * 2.2);
                    float n = wx_fbm(q) + wx_fbm(q * 2.3 + 4.0) * 0.35;
                    float body = smoothstep(0.42, 0.9, n + (1.0 - y) * 0.55);
                    vec3 col = mix(vec3(1.0, 0.86, 0.45), vec3(1.0, 0.34, 0.05), smoothstep(0.0, 0.55, y));
                    col = mix(col, vec3(0.18, 0.12, 0.12), smoothstep(0.55, 0.95, y));
                    float a = body * smoothstep(1.0, 0.65, y) * smoothstep(0.0, 0.04, y) * uIntensity;
                    gl_FragColor = vec4(col * (1.0 + (1.0 - y) * 0.6), a);
                    ` : `
                    vec2 q = vec2(vUv.x * 5.0 + uTime * 1.5 + y * 2.5 + uSeed, y * 3.0 - uTime * 0.7);
                    float n = wx_fbm(q);
                    float a = smoothstep(0.45, 0.82, n) * pow(sin(y * 3.14159), 0.6) * 0.42 * uIntensity;
                    gl_FragColor = vec4(vec3(0.86, 0.68, 0.46) * (0.85 + y * 0.3), a);
                    `}
                }`,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
    }

    function glowDecalMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 } },
            vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
            fragmentShader: `
                uniform float uTime; uniform float uIntensity; varying vec2 vUv;
                void main(){
                    vec2 p = vUv * 2.0 - 1.0; float r = length(p);
                    float core = smoothstep(1.0, 0.0, r);
                    float rim = smoothstep(0.08, 0.0, abs(r - (0.55 + 0.25 * fract(uTime * 1.4))));
                    vec3 col = vec3(1.0, 0.42, 0.08) * (core * core * 1.2 + rim * 0.6);
                    gl_FragColor = vec4(col * uIntensity, 1.0);
                }`,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    }

    function buildGeyser() {
        const column = new THREE.Mesh(new THREE.CylinderGeometry(10, 4, 1, 20, 1, true), columnMaterial("fire"));
        column.geometry.translate(0, 0.5, 0);
        column.frustumCulled = false;
        const decal = new THREE.Mesh(new THREE.CircleGeometry(22, 32), glowDecalMaterial());
        decal.rotation.x = -Math.PI / 2;
        decal.renderOrder = 3;
        Wx.scene.add(column, decal);
        return { column, decal, state: "idle", t: 0, x: 0, z: 0, height: 0, hit: false };
    }

    function updateGeysers(delta, focus) {
        Wx.geysers.forEach((gz, idx) => {
            gz.t -= delta;
            const cu = gz.column.material.uniforms, du = gz.decal.material.uniforms;
            cu.uTime.value = Wx.time;
            du.uTime.value = Wx.time;
            if (gz.state === "idle" && gz.t <= 0) {
                gz.state = "warn";
                gz.t = 1.6;
                gz.z = focus.z - 220 - Math.random() * 480;
                gz.x = window.WorldGfx && Math.random() < 0.6 ? WorldGfx.riverX(gz.z) + (Math.random() - 0.5) * 60 : focus.x + (Math.random() - 0.5) * 360;
                gz.decal.position.set(gz.x, 0.6, gz.z);
                gz.column.position.set(gz.x, 0, gz.z);
                gz.hit = false;
                gz.height = 80 + Math.random() * 50;
            } else if (gz.state === "warn") {
                du.uIntensity.value = 0.5 + 0.3 * Math.sin(Wx.time * 18);
                if (gz.t <= 0) {
                    gz.state = "erupt";
                    gz.t = 3.4;
                    if (window.GameAudio && Math.hypot(focus.x - gz.x, focus.z - gz.z) < 500) GameAudio.play("eruption");
                }
            } else if (gz.state === "erupt") {
                const k = Math.min(1, (3.4 - gz.t) * 2.5) * Math.min(1, gz.t * 1.5);
                du.uIntensity.value = 0.9 * k + 0.2;
                cu.uIntensity.value = k;
                gz.column.scale.set(0.6 + k * 0.4, gz.height * Math.max(0.05, k), 0.6 + k * 0.4);
                if (gz.t <= 0) { gz.state = "idle"; gz.t = 2 + Math.random() * 3 + idx; cu.uIntensity.value = 0; du.uIntensity.value = 0; }
                if (!gz.hit && typeof playerShip !== "undefined" && Math.hypot(playerShip.position.x - gz.x, playerShip.position.z - gz.z) < 11 && playerShip.position.y < gz.height * k) {
                    gz.hit = true;
                    if (window.Combat && typeof isPlaying !== "undefined" && isPlaying) {
                        Combat.addShield(-30);
                        if (Combat.shield <= 0 && typeof triggerCriticalCrash === "function") triggerCriticalCrash("ENGULLIDO POR LA LAVA", "#ff7a3a");
                        if (typeof flashScreen === "function") flashScreen("rgba(255,120,40,1)", 0.3);
                    }
                }
            }
        });
    }

    function buildDevil() {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(15, 2.5, 60, 24, 1, true), columnMaterial("dust"));
        mesh.geometry.translate(0, 30, 0);
        mesh.frustumCulled = false;
        mesh.material.uniforms.uIntensity.value = 1;
        Wx.scene.add(mesh);
        return { mesh, x: 0, z: 0, life: 0, drift: new THREE.Vector2() };
    }

    function updateDevils(delta, focus) {
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
            d.mesh.position.set(d.x, 0, d.z);
            d.mesh.rotation.y += delta * 1.5;
            d.mesh.material.uniforms.uTime.value = Wx.time;
            d.mesh.material.uniforms.uIntensity.value = Math.min(1, d.life / 3);
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
        Wx.geysers.forEach((g) => { Wx.scene.remove(g.column, g.decal); });
        Wx.devils.forEach((d) => Wx.scene.remove(d.mesh));
        Wx.birds.forEach((b) => Wx.scene.remove(b.flock));
        Wx.active = []; Wx.mists = []; Wx.geysers = []; Wx.devils = []; Wx.birds = [];
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
        if (WorldGfx.setGroundFx) WorldGfx.setGroundFx(cfg.ground || {});
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
                if (Math.random() < 0.35) setTimeout(() => triggerLightning(cam), 160 + Math.random() * 200);
            }
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
