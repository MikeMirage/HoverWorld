// HoverWorld - Combat & Star Fox style set pieces.
// Player lasers, shield, drone formations, authored obstacle sequences
// (pillar slaloms, gate runs, canyon squeezes) and the Dreadnought boss chase.
// Runs inside the main game's global scope (scene, playerShip, score, ...).
(function () {
    const C = {
        ready: false,
        bolts: [],
        shots: [],
        fx: [],
        fighters: [],
        externalTargets: null,
        quiet: false,
        dogfight: null,
        survive: null,
        drones: [],
        hazards: [],
        pieces: [],
        mines: [],
        missiles: [],
        boss: null,
        shield: 100,
        maxShield: 100,
        loadout: { maxShield: 100, regen: 0, fireCooldown: 0.15, damage: 1, spread: false },
        lastHitAt: 0,
        fireCooldown: 0,
        firing: false,
        tier: 1,
        pieceChunks: new Set(),
        timeScale: 1,
        slowMoTimer: 0,
        hitFlash: 0
    };
    const tmpV = new THREE.Vector3();
    const tmpV2 = new THREE.Vector3();
    const FORWARD = new THREE.Vector3(0, 0, -1);
    let shared = null;

    // ---------- shared resources ----------
    function rimMaterial(color, rimColor, opts = {}) {
        const mat = new THREE.MeshStandardMaterial({
            color, roughness: opts.roughness ?? 0.35, metalness: opts.metalness ?? 0.2,
            emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1, flatShading: !!opts.flat
        });
        const uniforms = { uRimColor: { value: new THREE.Color(rimColor) }, uRimPower: { value: opts.rimPower ?? 2.6 }, uRimStrength: { value: opts.rimStrength ?? 1.1 } };
        mat.userData.rim = uniforms;
        mat.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, uniforms);
            shader.fragmentShader = shader.fragmentShader
                .replace("#include <common>", "#include <common>\nuniform vec3 uRimColor; uniform float uRimPower; uniform float uRimStrength;")
                .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
                    float hwRim = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
                    totalEmissiveRadiance += uRimColor * pow(hwRim, uRimPower) * uRimStrength;`);
        };
        return mat;
    }

    function buildShared() {
        // Billboard fireball: noisy hot core that cools into smoke, plus a shock ring.
        const fireballMat = () => new THREE.ShaderMaterial({
            uniforms: { uT: { value: 0 }, uSeed: { value: 0 } },
            vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
            fragmentShader: `
                uniform float uT; uniform float uSeed; varying vec2 vUv;
                float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                float n(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
                    return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
                float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++){ v += a * n(p); p *= 2.05; a *= 0.5; } return v; }
                void main(){
                    vec2 p = vUv * 2.0 - 1.0; float r = length(p);
                    float t = uT;
                    float nz = fbm(p * 2.4 + vec2(uSeed, uSeed * 0.7) + vec2(0.0, -t * 1.4));
                    float radius = mix(0.3, 0.88, sqrt(t));
                    float body = smoothstep(radius, radius * 0.45, r + (nz - 0.5) * 0.55);
                    float heat = smoothstep(0.55, 0.0, t) * smoothstep(radius * 0.85, 0.0, r + (nz - 0.5) * 0.35);
                    vec3 fire = mix(vec3(0.95, 0.32, 0.06), vec3(1.0, 0.9, 0.55), heat);
                    vec3 smoke = mix(vec3(0.22, 0.19, 0.17), vec3(0.32, 0.3, 0.3), nz);
                    vec3 col = mix(fire * (1.2 + heat), smoke, smoothstep(0.22, 0.8, t));
                    float a = body * (1.0 - smoothstep(0.72, 1.0, t));
                    float ring = smoothstep(0.035, 0.0, abs(r - (0.15 + t * 0.95))) * (1.0 - t) * smoothstep(0.0, 0.05, t);
                    col += vec3(1.0, 0.85, 0.6) * ring * 1.2;
                    gl_FragColor = vec4(col, clamp(max(a, ring * 0.7), 0.0, 1.0));
                }`,
            transparent: true, depthWrite: false
        });
        shared = {
            boltGeom: new THREE.BoxGeometry(0.22, 0.22, 7),
            boltMat: new THREE.MeshBasicMaterial({ color: 0x7dffcf, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }),
            shotGeom: new THREE.IcosahedronGeometry(0.9, 1),
            shotMat: new THREE.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }),
            shotCoreMat: new THREE.MeshBasicMaterial({ color: 0xffe0a0 }),
            fireballGeom: new THREE.PlaneGeometry(1, 1),
            fireballMat,
            droneBody: rimMaterial(0x2b313b, 0xff5a3a, { metalness: 0.5, roughness: 0.4, flat: true, rimStrength: 0.8 }),
            droneWing: new THREE.MeshStandardMaterial({ color: 0xb8402c, roughness: 0.5, metalness: 0.3, flatShading: true }),
            droneEye: new THREE.MeshBasicMaterial({ color: 0xff3a2a }),
            hullMat: rimMaterial(0x8a94a4, 0xffc890, { metalness: 0.25, roughness: 0.5, flat: true, rimStrength: 0.35 }),
            hullDark: new THREE.MeshStandardMaterial({ color: 0x4a5260, roughness: 0.55, metalness: 0.3, flatShading: true }),
            windowMat: new THREE.MeshBasicMaterial({ color: 0xffd890 }),
            targetMat: new THREE.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }),
            hullAccent: new THREE.MeshStandardMaterial({ color: 0xb8402c, roughness: 0.5, metalness: 0.3, flatShading: true }),
            podMat: rimMaterial(0x9aa2b0, 0xff9a60, { metalness: 0.3, roughness: 0.4, flat: true, rimStrength: 1.0 }),
            engineMat: new THREE.MeshBasicMaterial({ color: 0xff8a3a }),
            coreMat: rimMaterial(0xff2a4a, 0xffd0d8, { emissive: 0xff1030, emissiveIntensity: 0.8, roughness: 0.2, flat: true, rimStrength: 1.4 }),
            mineMat: rimMaterial(0x30343c, 0xff4040, { metalness: 0.6, roughness: 0.4, flat: true, rimStrength: 1.2 }),
            mineLight: new THREE.MeshBasicMaterial({ color: 0xff3030 }),
            missileMat: new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.4, metalness: 0.4 }),
            flameMat: new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
            gateMetal: rimMaterial(0x5a6270, 0x8fe6ff, { metalness: 0.55, roughness: 0.35, flat: true, rimStrength: 0.7 }),
            gateLight: new THREE.MeshBasicMaterial({ color: 0x8fe6ff }),
            gateLightDone: new THREE.MeshBasicMaterial({ color: 0x7dff9f })
        };
    }

    function init() {
        if (C.ready) return;
        buildShared();
        for (let i = 0; i < 48; i++) {
            const m = new THREE.Mesh(shared.boltGeom, shared.boltMat);
            m.visible = false;
            scene.add(m);
            C.bolts.push({ mesh: m, active: false, vel: new THREE.Vector3(), life: 0 });
        }
        for (let i = 0; i < 90; i++) {
            const m = new THREE.Mesh(shared.shotGeom, shared.shotMat);
            const core = new THREE.Mesh(shared.shotGeom, shared.shotCoreMat);
            core.scale.setScalar(0.45);
            m.add(core);
            m.visible = false;
            scene.add(m);
            C.shots.push({ mesh: m, active: false, vel: new THREE.Vector3(), life: 0, damage: 20 });
        }
        for (let i = 0; i < 14; i++) {
            const m = new THREE.Mesh(shared.fireballGeom, shared.fireballMat());
            m.visible = false;
            m.frustumCulled = false;
            scene.add(m);
            C.fx.push({ mesh: m, active: false, t: 0, dur: 1, size: 1 });
        }
        C.ready = true;
    }

    // ---------- helpers ----------
    function rand(seed) {
        const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    function explode(position, size = 1, withLight = false) {
        const e = C.fx.find((f) => !f.active) || C.fx[0];
        e.active = true;
        e.t = 0;
        e.dur = 1.1 + size * 0.25;
        e.size = size;
        e.mesh.position.copy(position);
        e.mesh.visible = true;
        e.mesh.material.uniforms.uSeed.value = Math.random() * 50;
        if (withLight && typeof impactLight !== "undefined") {
            impactLight.position.copy(position);
            impactLight.intensity = Math.min(5, 1.6 * size);
            impactLight.distance = 22 * size;
        }
        if (typeof spawnPickupBurst === "function") spawnPickupBurst(position, 0xffa040, Math.round(8 + size * 4));
    }

    // Lingering smoke plume (noise shader cylinder) for big impacts.
    let smoke = null;
    function spawnSmoke(position, duration = 7) {
        if (!smoke) {
            const mat = new THREE.ShaderMaterial({
                uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 } },
                vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
                fragmentShader: `
                    uniform float uTime; uniform float uIntensity; varying vec2 vUv;
                    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                    float n(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
                        return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
                    float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * n(p); p *= 2.1; a *= 0.5; } return v; }
                    void main(){
                        float y = vUv.y;
                        float d = fbm(vec2(vUv.x * 6.0 + y * 1.5, y * 3.0 - uTime * 0.45));
                        float a = smoothstep(0.35, 0.75, d) * smoothstep(1.0, 0.55, y) * smoothstep(0.0, 0.08, y) * 0.75 * uIntensity;
                        vec3 col = mix(vec3(0.35, 0.18, 0.08), vec3(0.16, 0.15, 0.16), smoothstep(0.0, 0.35, y));
                        col += vec3(1.0, 0.45, 0.1) * smoothstep(0.2, 0.0, y) * 0.8;
                        gl_FragColor = vec4(col, a);
                    }`,
                transparent: true, depthWrite: false, side: THREE.DoubleSide
            });
            const geom = new THREE.CylinderGeometry(22, 5, 90, 20, 1, true);
            geom.translate(0, 45, 0);
            smoke = { mesh: new THREE.Mesh(geom, mat), t: 0, dur: 1 };
            smoke.mesh.frustumCulled = false;
            scene.add(smoke.mesh);
        }
        smoke.mesh.position.set(position.x, 0, position.z);
        smoke.t = 0;
        smoke.dur = duration;
        smoke.mesh.visible = true;
    }

    // Big cinematic impact: layered fireballs, smoke plume and light.
    function bigExplosion(position, size = 3) {
        position.y = Math.max(position.y, size * 4.5);
        explode(position, size, true);
        explode(position.clone().add(new THREE.Vector3(3, 2, -2)), size * 0.6);
        setTimeout(() => explode(position.clone().add(new THREE.Vector3(-2, 4, 3)), size * 0.5), 120);
        spawnSmoke(position, 8);
    }

    function updateFx(delta) {
        if (smoke && smoke.mesh.visible) {
            smoke.t += delta;
            smoke.mesh.material.uniforms.uTime.value += delta;
            const k = Math.min(1, smoke.t * 1.5) * Math.min(1, (smoke.dur - smoke.t) / 2);
            smoke.mesh.material.uniforms.uIntensity.value = Math.max(0, k);
            smoke.mesh.scale.set(0.6 + smoke.t * 0.08, 0.4 + Math.min(1, smoke.t * 0.5) * 0.8, 0.6 + smoke.t * 0.08);
            if (smoke.t >= smoke.dur) smoke.mesh.visible = false;
        }
        C.fx.forEach((e) => {
            if (!e.active) return;
            e.t += delta;
            const p = e.t / e.dur;
            if (p >= 1) { e.active = false; e.mesh.visible = false; return; }
            e.mesh.material.uniforms.uT.value = p;
            e.mesh.quaternion.copy(camera.quaternion);
            e.mesh.scale.setScalar(e.size * 14 * (0.75 + p * 0.5));
        });
        if (typeof impactLight !== "undefined" && impactLight.intensity > 0) impactLight.intensity = Math.max(0, impactLight.intensity - delta * 14);
    }

    function fireShot(origin, dir, speed, damage = 20) {
        const s = C.shots.find((x) => !x.active);
        if (!s) return;
        s.active = true;
        s.life = 4;
        s.damage = damage;
        s.mesh.position.copy(origin);
        s.vel.copy(dir).normalize().multiplyScalar(speed);
        s.mesh.visible = true;
        s.mesh.scale.setScalar(damage > 25 ? 1.5 : 1);
    }

    function aimAtPlayer(from, speed, spread = 0) {
        // Lead the target a little so straight flight is punished but weaving works.
        const t = from.distanceTo(playerShip.position) / speed;
        const lead = playerShip.position.clone().addScaledVector(shipVelocity, t * 0.6);
        const dir = lead.sub(from).normalize();
        if (spread) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
        return dir;
    }

    function damagePlayer(amount, label) {
        if (!isPlaying || isSkidding || isControlledLanding) return;
        C.shield = Math.max(0, C.shield - amount);
        C.lastHitAt = performance.now();
        C.hitFlash = 1;
        shakeIntensity = Math.max(shakeIntensity, 3);
        if (typeof flashScreen === "function") flashScreen("rgba(255,60,40,1)", 0.28);
        if (typeof haptic === "function") haptic(45);
        GameAudio.play("playerHit");
        if (runStats) runStats.combo = 0;
        if (C.shield <= 0) triggerCriticalCrash(label || "DERRIBADO", "#ff5a4f");
    }

    // ---------- player lasers ----------
    function findLock(dir) {
        let best = null, bestDot = Math.cos(THREE.MathUtils.degToRad(C.boss ? 11 : 7));
        targetsForAssist().forEach((pos) => {
            tmpV.copy(pos).sub(playerShip.position);
            const d = tmpV.length();
            if (d > 650) return;
            const dot = tmpV.normalize().dot(dir);
            if (dot > bestDot) { bestDot = dot; best = pos; }
        });
        return best;
    }

    function firePlayer() {
        const euler = makeFlightEuler(flightState.pitch, flightState.yaw, 0);
        const dir = FORWARD.clone().applyEuler(euler);
        // Aim assist: bend toward the nearest target inside a narrow cone (wider vs. the boss).
        let best = null, bestDot = Math.cos(THREE.MathUtils.degToRad(C.boss ? 11 : 7));
        targetsForAssist().forEach((pos) => {
            tmpV.copy(pos).sub(playerShip.position);
            const d = tmpV.length();
            if (d > 650) return;
            const dot = tmpV.normalize().dot(dir);
            if (dot > bestDot) { bestDot = dot; best = pos; }
        });
        if (best) dir.copy(best).sub(playerShip.position).normalize();
        const muzzles = C.loadout.spread ? [-1, 0, 1] : [-1, 1];
        muzzles.forEach((side) => {
            const b = C.bolts.find((x) => !x.active);
            if (!b) return;
            b.active = true;
            b.life = 1.1;
            b.mesh.position.copy(playerShip.position).add(new THREE.Vector3(side * 3.2, side === 0 ? 0.6 : -0.2, -2).applyEuler(euler));
            b.vel.copy(dir).multiplyScalar(flightSpeed + 700);
            b.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
            b.mesh.visible = true;
        });
        GameAudio.play("laser");
    }

    function targetsForAssist() {
        const list = [];
        if (C.externalTargets) C.externalTargets().forEach((t) => list.push(t.pos));
        C.fighters.forEach((f) => { if (f.alive) list.push(f.mesh.position); });
        C.drones.forEach((d) => { if (d.alive) list.push(d.mesh.position); });
        C.mines.forEach((m) => list.push(m.mesh.position));
        C.missiles.forEach((m) => list.push(m.mesh.position));
        if (C.boss && C.boss.alive) Bosses.targets(C.boss).forEach((p) => list.push(p));
        return list;
    }

    function updateBolts(delta) {
        C.bolts.forEach((b) => {
            if (!b.active) return;
            b.life -= delta;
            b.mesh.position.addScaledVector(b.vel, delta);
            if (b.life <= 0 || b.mesh.position.y < 0) { b.active = false; b.mesh.visible = false; return; }
            if (boltHits(b)) { b.active = false; b.mesh.visible = false; }
        });
    }

    function segmentHit(b, center, radius) {
        // Bolts move fast, so test the swept segment from last frame.
        const p = b.mesh.position;
        tmpV2.copy(b.vel).multiplyScalar(1 / 60);
        const a = tmpV.copy(p).sub(tmpV2);
        const ab = tmpV2;
        const t = THREE.MathUtils.clamp(center.clone().sub(a).dot(ab) / Math.max(ab.lengthSq(), 1e-6), 0, 1);
        return a.addScaledVector(ab, t).distanceToSquared(center) < radius * radius;
    }

    function boltHits(b) {
        if (C.externalTargets) {
            for (const t of C.externalTargets()) {
                if (segmentHit(b, t.pos, t.radius)) {
                    t.hit();
                    return true;
                }
            }
        }
        for (const f of C.fighters) {
            if (f.alive && segmentHit(b, f.mesh.position, 8)) {
                f.hp -= C.loadout.damage;
                if (f.hp <= 0) killFighter(f);
                else { GameAudio.play("hit"); f.flash = 0.15; }
                return true;
            }
        }
        for (const d of C.drones) {
            if (d.alive && segmentHit(b, d.mesh.position, 8)) {
                d.hp -= C.loadout.damage;
                if (d.hp <= 0) killDrone(d);
                else GameAudio.play("hit");
                return true;
            }
        }
        for (let i = C.mines.length - 1; i >= 0; i--) {
            const m = C.mines[i];
            if (segmentHit(b, m.mesh.position, 3.6)) {
                explode(m.mesh.position, 0.8);
                scene.remove(m.mesh);
                C.mines.splice(i, 1);
                awardStylePoints("MINA", 25, m.mesh.position, "#ffb070");
                GameAudio.play("explode");
                return true;
            }
        }
        for (let i = C.missiles.length - 1; i >= 0; i--) {
            const m = C.missiles[i];
            if (segmentHit(b, m.mesh.position, 3)) {
                explode(m.mesh.position, 0.7);
                scene.remove(m.mesh);
                C.missiles.splice(i, 1);
                awardStylePoints("MISIL", 30, m.mesh.position, "#ffb070");
                GameAudio.play("explode");
                return true;
            }
        }
        if (C.boss && C.boss.alive && Bosses.boltHit(C.boss, b, segmentHit)) return true;
        return false;
    }

    // ---------- drones ----------
    function buildDroneMesh() {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.ConeGeometry(1.6, 6, 6), shared.droneBody);
        body.rotation.x = -Math.PI / 2;
        g.add(body);
        [-1, 1].forEach((side) => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(5, 0.25, 2.4), shared.droneWing);
            wing.position.set(side * 3, 0, 1.2);
            wing.rotation.z = side * 0.25;
            wing.rotation.y = side * -0.35;
            g.add(wing);
            const tip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 1.2), shared.droneBody);
            tip.position.set(side * 5.3, 0.6, 1.8);
            g.add(tip);
        });
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), shared.droneEye);
        eye.position.set(0, 0.5, -1.8);
        g.add(eye);
        g.children.forEach((c) => { c.castShadow = true; });
        g.scale.setScalar(1.7);
        return g;
    }

    function spawnDroneWave(center, armed, pattern = "v") {
        const count = 5;
        for (let i = 0; i < count; i++) {
            const k = i - (count - 1) / 2;
            const offset = pattern === "v"
                ? new THREE.Vector3(k * 22, Math.abs(k) * 5, Math.abs(k) * 22)
                : new THREE.Vector3(k * 24, Math.sin(i) * 6, 0);
            const mesh = buildDroneMesh();
            mesh.position.copy(center).add(offset);
            mesh.rotation.y = Math.PI;
            scene.add(mesh);
            C.drones.push({
                mesh, alive: true, hp: C.tier >= 3 ? 2 : 1, armed,
                base: mesh.position.clone(), phase: i * 0.9, fireTimer: 0.8 + i * 0.35, fired: 0
            });
        }
    }

    function killDrone(d) {
        d.alive = false;
        explode(d.mesh.position, 1.1);
        scene.remove(d.mesh);
        awardStylePoints("DERRIBO", 50, d.mesh.position, "#ff9f70");
        GameAudio.play("explode");
        shakeIntensity += 0.4;
    }

    function updateDrones(delta, t) {
        for (let i = C.drones.length - 1; i >= 0; i--) {
            const d = C.drones[i];
            if (!d.alive) { C.drones.splice(i, 1); continue; }
            const toPlayer = d.mesh.position.z - playerShip.position.z;
            // Drones cruise toward the player while weaving, then peel off past.
            d.mesh.position.z += 45 * delta;
            d.mesh.position.x = d.base.x + Math.sin(t * 1.4 + d.phase) * 12;
            const targetY = THREE.MathUtils.clamp(playerShip.position.y, 20, 120);
            d.mesh.position.y += (targetY + Math.sin(t * 2 + d.phase) * 6 - d.mesh.position.y) * Math.min(1, delta * 0.8);
            d.mesh.rotation.z = Math.cos(t * 1.4 + d.phase) * 0.5;
            if (d.armed && toPlayer < -60 && toPlayer > -420) {
                d.fireTimer -= delta;
                if (d.fireTimer <= 0 && d.fired < 2) {
                    d.fired += 1;
                    d.fireTimer = 1.6 + Math.random();
                    fireShot(d.mesh.position, aimAtPlayer(d.mesh.position, 140), 140, 15);
                    GameAudio.play("enemyShot");
                }
            }
            if (d.mesh.position.distanceTo(playerShip.position) < 8) {
                killDrone(d);
                damagePlayer(30, "COLISION CON DRON");
                continue;
            }
            if (toPlayer > 120) {
                scene.remove(d.mesh);
                C.drones.splice(i, 1);
            }
        }
    }

    // ---------- enemy projectiles ----------
    function updateShots(delta) {
        C.shots.forEach((s) => {
            if (!s.active) return;
            s.life -= delta;
            s.mesh.position.addScaledVector(s.vel, delta);
            s.mesh.rotation.x += delta * 8;
            if (s.life <= 0 || s.mesh.position.y < 0) { s.active = false; s.mesh.visible = false; return; }
            if (s.mesh.position.distanceTo(playerShip.position) < 3.8) {
                s.active = false;
                s.mesh.visible = false;
                damagePlayer(s.damage, "DERRIBADO");
            }
        });
    }

    // ---------- hazards & set pieces ----------
    function addHazard(h) {
        C.hazards.push(h);
        return h;
    }

    function rockMaterial() {
        const pal = WorldGfx.getPalette() || {};
        return new THREE.MeshStandardMaterial({ color: pal.rock ?? 0x7f8a8c, roughness: 0.95, flatShading: true });
    }

    function buildPillar(x, z, height, radius, mat) {
        const geom = new THREE.CylinderGeometry(radius * 0.7, radius, height, 7, 4);
        const pos = geom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const n = 0.85 + rand(pos.getY(i) * 3.1 + i * 0.37 + x) * 0.3;
            pos.setX(i, pos.getX(i) * n);
            pos.setZ(i, pos.getZ(i) * n);
        }
        geom.computeVertexNormals();
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, height / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const pal = WorldGfx.getPalette() || {};
        const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 0.9, 0), new THREE.MeshStandardMaterial({ color: pal.foliage ?? 0x3a8a3c, flatShading: true, roughness: 0.9 }));
        cap.scale.set(1.2, 0.45, 1.2);
        cap.position.y = height / 2;
        mesh.add(cap);
        scene.add(mesh);
        return mesh;
    }

    function spawnSlalom(baseZ, laneX) {
        const mat = rockMaterial();
        const meshes = [];
        for (let i = 0; i < 6; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const x = laneX + side * 30;
            const z = baseZ - i * 70;
            const h = 85 + rand(baseZ + i) * 40;
            const r = 9 + rand(baseZ * 0.3 + i) * 3;
            meshes.push(buildPillar(x, z, h, r, mat));
            addHazard({ type: "cyl", x, z, r: r * 0.95, h, label: "COLISION CON PILAR", group: baseZ });
            if (i % 2 === 1 && i < 5 && typeof createBoostRingObject === "function") {
                const ringPos = new THREE.Vector3(laneX - side * 6, 34 + (i % 2) * 6, z - 35);
                const ring = createBoostRingObject(ringPos, side * 0.35);
                scene.add(ring.mesh);
                worldObjects.push(ring);
            }
        }
        C.pieces.push({ meshes, z: baseZ - 400, group: baseZ });
    }

    function buildGate(x, y, z, width, height) {
        const g = new THREE.Group();
        // Posts run all the way to the ground so gates read as built structures, not floating frames.
        const bottom = y - height / 2;
        const postLen = bottom + height + 3;
        const postGeom = new THREE.BoxGeometry(3, postLen, 3);
        [-1, 1].forEach((side) => {
            const post = new THREE.Mesh(postGeom, shared.gateMetal);
            post.position.set(side * (width / 2 + 1.5), postLen / 2 - bottom, 0);
            post.castShadow = true;
            g.add(post);
            const foot = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 6), shared.hullDark);
            foot.position.set(side * (width / 2 + 1.5), 1 - bottom, 0);
            g.add(foot);
            for (let k = 1; k < Math.floor(postLen / 12); k++) {
                const brace = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 3.6), shared.hullAccent);
                brace.position.set(side * (width / 2 + 1.5), k * 12 - bottom, 0);
                g.add(brace);
            }
        });
        const lowBar = new THREE.Mesh(new THREE.BoxGeometry(width + 6, 1.2, 2), shared.gateMetal);
        lowBar.position.y = -0.6;
        g.add(lowBar);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(width + 6, 3, 3), shared.gateMetal);
        bar.position.y = height + 1.5;
        bar.castShadow = true;
        g.add(bar);
        const lights = [];
        for (let i = 0; i < 6; i++) {
            const l = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), shared.gateLight);
            const tt = i / 5;
            l.position.set(-width / 2 + tt * width, height - 0.4, 1.7);
            g.add(l);
            lights.push(l);
        }
        g.position.set(x, y - height / 2, z);
        scene.add(g);
        // Ground pylon so the gate does not float.
        return { group: g, lights };
    }

    function spawnGateRun(baseZ, laneX) {
        const meshes = [];
        for (let i = 0; i < 4; i++) {
            const x = laneX + Math.sin(i * 1.3 + baseZ) * 40;
            const y = 32 + Math.sin(i * 0.9) * 10;
            const z = baseZ - i * 90;
            const width = 30, height = 24;
            const gate = buildGate(x, y, z, width, height);
            meshes.push(gate.group);
            const bottom = y - height / 2;
            addHazard({ type: "box", x: x - width / 2 - 1.5, y0: 0, y1: bottom + height + 3, z, hw: 1.8, hd: 2, label: "COLISION CON PUERTA", group: baseZ });
            addHazard({ type: "box", x: x + width / 2 + 1.5, y0: 0, y1: bottom + height + 3, z, hw: 1.8, hd: 2, label: "COLISION CON PUERTA", group: baseZ });
            addHazard({ type: "box", x, xw: width / 2 + 3, y0: bottom + height, y1: bottom + height + 3, z, hw: width / 2 + 3, hd: 2, label: "COLISION CON PUERTA", group: baseZ });
            C.pieces.push({ meshes: [], z, gate: { x, y, z, width, height, lights: gate.lights, passed: false }, group: baseZ });
        }
        C.pieces.push({ meshes, z: baseZ - 300, group: baseZ });
    }

    function spawnCanyon(baseZ, laneX) {
        const mat = rockMaterial();
        const meshes = [];
        for (let i = 0; i < 9; i++) {
            const z = baseZ - i * 40;
            const squeeze = 26 + Math.sin(i * 0.6) * 4;
            [-1, 1].forEach((side) => {
                const x = laneX + side * (squeeze + 10);
                const h = 70 + rand(i * 3 + side + baseZ) * 30;
                const mesh = buildPillar(x, z, h, 13, mat);
                meshes.push(mesh);
                addHazard({ type: "cyl", x, z, r: 12, h, label: "COLISION CON CAÑÓN", group: baseZ });
            });
            if (i === 4 && typeof createBoostRingObject === "function") {
                const ring = createBoostRingObject(new THREE.Vector3(laneX, 26 + Math.sin(i) * 4, z), 0);
                scene.add(ring.mesh);
                worldObjects.push(ring);
            }
        }
        C.pieces.push({ meshes, z: baseZ - 380, group: baseZ });
    }

    function spawnSetPiecesAhead(playerChunk, chunkDepth) {
        if (C.boss || C.noPieces) return;
        for (let chunk = playerChunk + 3; chunk <= playerChunk + 4; chunk++) {
            if (C.pieceChunks.has(chunk) || chunk % 3 !== 0) continue;
            C.pieceChunks.add(chunk);
            const r = rand(chunk * 7.7 + C.tier);
            if (r < 0.35 || C.quiet) continue;
            const baseZ = -(chunk * chunkDepth) - 40;
            const L = WorldGfx.lane(baseZ - 150);
            const laneX = L.x + THREE.MathUtils.clamp((Math.floor(rand(chunk * 3.3) * 5) - 2) * 35, -(L.halfWidth - 60), L.halfWidth - 60);
            let roll = rand(chunk * 1.9 + 4);
            // Rock pillars only make sense in natural terrain.
            const kind = WorldGfx.getKind();
            const natural = kind === "valley" || kind === "cave";
            if (!natural && roll < 0.3) roll = 0.3 + roll;
            const canCanyon = C.tier >= 2 && natural;
            if (roll < 0.3) spawnSlalom(baseZ, laneX);
            else if (roll < 0.55) spawnGateRun(baseZ, laneX);
            else if (roll < 0.8 || !canCanyon) spawnDroneWave(new THREE.Vector3(laneX, Math.min(60, L.ceiling - 22), baseZ - 120), C.tier >= 2);
            else spawnCanyon(baseZ, laneX);
        }
    }

    function updatePieces() {
        for (let i = C.pieces.length - 1; i >= 0; i--) {
            const p = C.pieces[i];
            if (p.gate && !p.gate.passed) {
                const g = p.gate;
                const dz = Math.abs(playerShip.position.z - g.z);
                if (dz < 4 && Math.abs(playerShip.position.x - g.x) < g.width / 2 && Math.abs(playerShip.position.y - g.y) < g.height / 2) {
                    g.passed = true;
                    g.lights.forEach((l) => { l.material = shared.gateLightDone; });
                    awardStylePoints("PUERTA", 40, playerShip.position, "#8fe6ff");
                    GameAudio.play("checkpoint");
                }
            }
            if (p.z > playerShip.position.z + 200) {
                p.meshes.forEach((m) => {
                    scene.remove(m);
                    m.traverse((o) => { if (o.geometry && o.geometry !== shared.boltGeom) o.geometry.dispose(); });
                });
                C.pieces.splice(i, 1);
                C.hazards = C.hazards.filter((h) => h.group !== p.group || h.z < playerShip.position.z + 150);
            }
        }
    }

    function checkHazards(pos) {
        for (const h of C.hazards) {
            if (h.type === "cyl") {
                if (pos.y < h.h && Math.hypot(pos.x - h.x, pos.z - h.z) < h.r) return h.label;
            } else if (h.type === "box") {
                if (Math.abs(pos.z - h.z) < h.hd + 1.5 && Math.abs(pos.x - h.x) < h.hw + 1.5 && pos.y > h.y0 - 1 && pos.y < h.y1 + 1) return h.label;
            }
        }
        return null;
    }

    // Removes obstacles that would overlap mission objectives.
    function clearHazardsNear(pos, radius) {
        const removeGroups = new Set();
        C.hazards.forEach((h) => {
            if (Math.hypot(pos.x - h.x, pos.z - h.z) < radius) removeGroups.add(h.group);
        });
        if (!removeGroups.size) return;
        C.hazards = C.hazards.filter((h) => !removeGroups.has(h.group));
        for (let i = C.pieces.length - 1; i >= 0; i--) {
            if (!removeGroups.has(C.pieces[i].group)) continue;
            C.pieces[i].meshes.forEach((m) => scene.remove(m));
            C.pieces.splice(i, 1);
        }
    }


    // ---------- enemy fighters (dogfight missions) ----------
    function buildFighterMesh() {
        const g = buildDroneMesh();
        g.scale.setScalar(2.1);
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, 1.8), shared.droneWing);
        fin.position.set(0, 1.1, 2.2);
        g.add(fin);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.6, 8, 1, true), shared.flameMat);
        flame.rotation.x = -Math.PI / 2;
        flame.position.z = 4.3;
        g.add(flame);
        return g;
    }

    function spawnFighter() {
        const mesh = buildFighterMesh();
        const p = playerShip.position;
        const side = Math.random() < 0.5 ? -1 : 1;
        mesh.position.set(p.x + side * (60 + Math.random() * 80), THREE.MathUtils.clamp(p.y + 10, 40, 110), p.z - 380 - Math.random() * 120);
        if (window.fitToLane) fitToLane(mesh.position, 20, 1e9);
        scene.add(mesh);
        const f = { mesh, alive: true, hp: 2 + Math.floor(C.tier / 2), t: Math.random() * 10, fireTimer: 2 + Math.random() * 2, flash: 0, vel: new THREE.Vector3(0, 0, -60), missionObject: null };
        if (C.dogfight && C.dogfight.onSpawn) f.missionObject = C.dogfight.onSpawn(f);
        C.fighters.push(f);
        return f;
    }

    function killFighter(f) {
        f.alive = false;
        explode(f.mesh.position, 1.6, true);
        scene.remove(f.mesh);
        GameAudio.play("explode");
        shakeIntensity += 0.6;
        awardStylePoints("DERRIBO", 120, f.mesh.position, "#ff9f70");
        if (C.dogfight) {
            C.dogfight.kills += 1;
            if (C.dogfight.onKill) C.dogfight.onKill(f);
        }
    }

    function updateFighters(delta) {
        const df = C.dogfight;
        if (df && df.kills + C.fighters.filter((f) => f.alive).length < df.total && C.fighters.filter((f) => f.alive).length < 2) {
            df.spawnTimer -= delta;
            if (df.spawnTimer <= 0) { df.spawnTimer = 2.5; spawnFighter(); }
        }
        const p = playerShip.position;
        const playerFwd = new THREE.Vector3(0, 0, -1).applyEuler(makeFlightEuler(0, flightState.yaw, 0));
        for (let i = C.fighters.length - 1; i >= 0; i--) {
            const f = C.fighters[i];
            if (!f.alive) { C.fighters.splice(i, 1); continue; }
            f.t += delta;
            // Evasive target point ahead of the player: weave so the chase stays readable.
            const ahead = 150 + Math.sin(f.t * 0.5) * 50;
            const target = p.clone().addScaledVector(playerFwd, ahead)
                .add(new THREE.Vector3(Math.sin(f.t * 0.8) * 45, Math.sin(f.t * 1.1) * 14, 0));
            target.y = THREE.MathUtils.clamp(target.y, 25, 120);
            if (window.fitToLane) fitToLane(target, 22, 1e9);
            const desired = target.sub(f.mesh.position);
            const dist = desired.length();
            const speed = THREE.MathUtils.clamp(flightSpeed * (dist > 260 ? 0.6 : dist < 90 ? 1.35 : 1.0), 40, 180);
            f.vel.lerp(desired.normalize().multiplyScalar(speed), Math.min(1, delta * 1.2));
            f.mesh.position.addScaledVector(f.vel, delta);
            const look = f.mesh.position.clone().add(f.vel);
            f.mesh.lookAt(look);
            f.mesh.rotateY(Math.PI);
            f.mesh.rotateZ(Math.sin(f.t * 0.8) * 0.5);
            // Tail gunner: occasional shots back at the pursuer.
            f.fireTimer -= delta;
            const toPlayer = p.distanceTo(f.mesh.position);
            if (f.fireTimer <= 0 && toPlayer < 320) {
                f.fireTimer = 2.8 + Math.random() * 1.5 - C.tier * 0.15;
                fireShot(f.mesh.position, aimAtPlayer(f.mesh.position, 130), 130, 12);
                GameAudio.play("enemyShot");
            }
            if (toPlayer < 9) { killFighter(f); damagePlayer(30, "COLISION CON CAZA"); }
        }
    }

    function startDogfight(total, handlers = {}) {
        C.dogfight = { total, kills: 0, spawnTimer: 0.5, onKill: handlers.onKill, onSpawn: handlers.onSpawn };
    }

    function stopDogfight() {
        C.dogfight = null;
        C.fighters.forEach((f) => { if (f.alive) { scene.remove(f.mesh); } });
        C.fighters = [];
    }

    // ---------- hostile airspace (survive missions) ----------
    function setSurvive(active) {
        C.survive = active ? { waveTimer: 1 } : null;
    }

    function updateSurvive(delta) {
        if (!C.survive) return;
        C.survive.waveTimer -= delta;
        if (C.survive.waveTimer <= 0) {
            C.survive.waveTimer = Math.max(2.6, 4.2 - C.tier * 0.25);
            const p = playerShip.position;
            const fwd = new THREE.Vector3(0, 0, -1).applyEuler(makeFlightEuler(0, flightState.yaw, 0));
            const center = p.clone().addScaledVector(fwd, 420).add(new THREE.Vector3((Math.random() - 0.5) * 80, 0, 0));
            center.y = THREE.MathUtils.clamp(p.y + 8, 35, 110);
            if (window.fitToLane) fitToLane(center, 50, 1e9);
            spawnDroneWave(center, true, Math.random() < 0.5 ? "v" : "line");
        }
    }

    // ---------- boss (engine lives in bosses.js) ----------
    function spawnBoss(atZ, missionObject, defId) {
        if (C.boss || !window.Bosses) return C.boss;
        C.boss = Bosses.create(defId || "dreadnought", atZ, missionObject, C.tier);
        return C.boss;
    }

    function dropMine(pos) {
        const g = new THREE.Group();
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2, 0), shared.mineMat);
        g.add(core);
        for (let i = 0; i < 6; i++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.8, 5), shared.mineMat);
            const dir = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]][i];
            spike.position.set(dir[0] * 2.2, dir[1] * 2.2, dir[2] * 2.2);
            spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir));
            g.add(spike);
        }
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), shared.mineLight);
        light.position.y = 2.1;
        g.add(light);
        g.position.copy(pos);
        scene.add(g);
        C.mines.push({ mesh: g, light, life: 14 });
    }

    function launchMissile(pos) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 8), shared.missileMat);
        body.rotation.x = Math.PI / 2;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 8), shared.hullAccent);
        tip.rotation.x = -Math.PI / 2;
        tip.position.z = -2.6;
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.4, 8, 1, true), shared.flameMat);
        flame.rotation.x = -Math.PI / 2;
        flame.position.z = 3.2;
        g.add(body, tip, flame);
        g.position.copy(pos);
        scene.add(g);
        C.missiles.push({ mesh: g, vel: new THREE.Vector3(0, 0, 60), life: 7 });
    }

    function updateMinesMissiles(delta, t) {
        for (let i = C.mines.length - 1; i >= 0; i--) {
            const m = C.mines[i];
            m.life -= delta;
            m.mesh.rotation.y += delta;
            m.light.visible = Math.sin(t * 10 + i) > 0;
            if (m.mesh.position.distanceTo(playerShip.position) < 5.5) {
                explode(m.mesh.position, 1.2, true);
                scene.remove(m.mesh);
                C.mines.splice(i, 1);
                damagePlayer(35, "MINA");
                GameAudio.play("explode");
                continue;
            }
            if (m.life <= 0 || m.mesh.position.z > playerShip.position.z + 120) {
                scene.remove(m.mesh);
                C.mines.splice(i, 1);
            }
        }
        for (let i = C.missiles.length - 1; i >= 0; i--) {
            const m = C.missiles[i];
            m.life -= delta;
            const desired = playerShip.position.clone().sub(m.mesh.position).normalize().multiplyScalar(125);
            m.vel.lerp(desired, Math.min(1, delta * 0.7));
            m.mesh.position.addScaledVector(m.vel, delta);
            m.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), m.vel.clone().normalize());
            if (m.mesh.position.distanceTo(playerShip.position) < 4.5) {
                explode(m.mesh.position, 1.2, true);
                scene.remove(m.mesh);
                C.missiles.splice(i, 1);
                damagePlayer(30, "MISIL");
                continue;
            }
            if (m.life <= 0) {
                explode(m.mesh.position, 0.6);
                scene.remove(m.mesh);
                C.missiles.splice(i, 1);
            }
        }
    }

    // ---------- HUD ----------
    let hud = null;
    function getHud() {
        if (hud) return hud;
        hud = {
            boss: document.getElementById("boss-hud"),
            bossFill: document.getElementById("boss-hp-fill"),
            bossLabel: document.getElementById("boss-hp-label"),
            bossName: document.querySelector("#boss-hud .boss-name"),
            shieldFill: document.getElementById("shield-bar-fill"),
            damage: document.getElementById("damage-vignette")
        };
        return hud;
    }

    function updateBossHud() {
        const h = getHud();
        if (!h.boss) return;
        const info = C.boss && window.Bosses ? Bosses.hud(C.boss) : null;
        h.boss.classList.toggle("visible", !!(info && info.visible));
        if (!info) return;
        h.bossFill.style.width = `${info.fill * 100}%`;
        h.bossLabel.textContent = info.label;
        if (h.bossName) h.bossName.textContent = info.name;
    }

    function updateHud(delta) {
        const h = getHud();
        if (h.shieldFill) h.shieldFill.style.width = `${(C.shield / C.maxShield) * 100}%`;
        C.hitFlash = Math.max(0, C.hitFlash - delta * 2.5);
        if (h.damage) h.damage.style.opacity = (C.hitFlash * 0.8 + (C.shield < 35 ? 0.25 + Math.sin(performance.now() * 0.008) * 0.12 : 0)).toFixed(3);
        if (C.boss) updateBossHud();
    }

    // ---------- public ----------
    function reset(tier) {
        init();
        C.tier = tier || 1;
        C.maxShield = C.loadout.maxShield;
        C.shield = C.maxShield;
        C.fireCooldown = 0;
        C.firing = false;
        C.timeScale = 1;
        C.slowMoTimer = 0;
        C.hitFlash = 0;
        C.pieceChunks = new Set();
        C.bolts.forEach((b) => { b.active = false; b.mesh.visible = false; });
        C.shots.forEach((s) => { s.active = false; s.mesh.visible = false; });
        C.fx.forEach((f) => { f.active = false; f.mesh.visible = false; });
        C.drones.forEach((d) => scene.remove(d.mesh));
        C.mines.forEach((m) => scene.remove(m.mesh));
        C.missiles.forEach((m) => scene.remove(m.mesh));
        C.pieces.forEach((p) => p.meshes.forEach((m) => scene.remove(m)));
        if (C.boss && window.Bosses) Bosses.dispose(C.boss);
        C.fighters.forEach((f) => scene.remove(f.mesh));
        C.drones = []; C.mines = []; C.missiles = []; C.pieces = []; C.hazards = []; C.boss = null;
        C.fighters = []; C.dogfight = null; C.survive = null; C.quiet = false;
        updateBossHud();
        updateHud(0);
    }

    function update(delta) {
        if (!C.ready) return;
        const t = performance.now() * 0.001;
        updateFx(delta);
        if (C.slowMoTimer > 0) {
            C.slowMoTimer -= delta / Math.max(C.timeScale, 0.01);
            C.timeScale = C.slowMoTimer > 0 ? 0.35 : 1;
        }
        if (!isPlaying) return;
        C.fireCooldown -= delta;
        C.lock = findLock(FORWARD.clone().applyEuler(makeFlightEuler(flightState.pitch, flightState.yaw, 0)));
        const wantsFire = C.firing || (C.autoFire && C.lock);
        if (wantsFire && C.fireCooldown <= 0 && !isSkidding && !isControlledLanding) {
            C.fireCooldown = C.loadout.fireCooldown;
            firePlayer();
        }
        updateBolts(delta);
        updateShots(delta);
        updateDrones(delta, t);
        updateFighters(delta);
        updateSurvive(delta);
        updatePieces();
        if (C.boss) {
            Bosses.update(C.boss, delta);
            if (C.boss.finished) C.boss = null;
        }
        updateMinesMissiles(delta, t);
        if (C.loadout.regen > 0 && C.shield > 0 && C.shield < C.maxShield && performance.now() - C.lastHitAt > 3500) {
            C.shield = Math.min(C.maxShield, C.shield + C.loadout.regen * delta);
        }
        updateHud(delta);
        if (isPlaying && !isSkidding && !isControlledLanding) {
            const hit = checkHazards(playerShip.position);
            if (hit) triggerCriticalCrash(hit, "#ff7a5c");
        }
    }

    // Internals shared with bosses.js.
    const internals = {
        get C() { return C; }, get shared() { return shared; },
        explode, fireShot, aimAtPlayer, damagePlayer, dropMine, launchMissile, spawnDroneWave, rimMaterial, spawnSmoke,
        spawnEscort() { return spawnFighter(); },
        setSlowMo(t) { C.slowMoTimer = t; },
        tmpV, updateBossHud
    };

    window.Combat = {
        _k: internals,
        init, reset, update, spawnSetPiecesAhead, spawnBoss, clearHazardsNear, rimMaterial,
        setFiring(v) { C.firing = v; },
        setExternalTargets(fn) { C.externalTargets = fn; },
        setQuiet(v) { C.quiet = !!v; },
        setPiecesEnabled(v) { C.noPieces = !v; },
        setAutoFire(v) { C.autoFire = !!v; },
        setLoadout(l) { Object.assign(C.loadout, l); C.maxShield = C.loadout.maxShield; C.shield = Math.min(C.shield, C.maxShield); },
        get autoFire() { return !!C.autoFire; },
        startDogfight, stopDogfight, setSurvive,
        get fighters() { return C.fighters; },
        isBossActive() { return !!C.boss; },
        get timeScale() { return C.timeScale; },
        get shield() { return C.shield; },
        addShield(v) { C.shield = Math.min(C.maxShield, C.shield + v); },
        explode, bigExplosion,
        get lock() { return C.lock || null; },
        stats() { return { drones: C.drones.length, hazards: C.hazards.length, pieces: C.pieces.length, shots: C.shots.filter((x) => x.active).length, boss: !!C.boss }; }
    };
})();
