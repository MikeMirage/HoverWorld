// HoverWorld - World visuals
// Procedural sky, lighting, ground shading, streamed scenery tiles (merged per tile
// so each tile is one or two draw calls), horizon ranges and clouds.
// Gameplay ground stays flat at y = 0; everything here is either decoration or a
// simple cone/cylinder collider exposed through WorldGfx.checkCollision().
(function () {
    const TILE = 240;
    let TILE_RADIUS = 4;
    let fogScale = 1;
    const VALLEY_HALF = 250;

    const PALETTES = {
        emerald_plains: {
            skyTop: 0x2f7fd8, horizon: 0xcfe7f4, bottom: 0x9cc6a0, sun: 0xfff0d2, sunElev: 0.62, sunAz: 0.75,
            ground: 0x5ea84a, groundAlt: 0x7fb853, field: 0xc9b75a, rockGround: 0x7d8c6c,
            rock: 0x7f8a8c, rockDark: 0x5c6567, snow: 0xf4f7fa, foliage: 0x3a8a3c, foliageAlt: 0x5aa23e, trunk: 0x6b4a33,
            wall: 0xf1e8d8, roofs: [0xc8553d, 0x3d6fa8, 0x8a4f3a], water: 0x3f9fd0, bank: 0xcbbf8a,
            cloud: 0xffffff, hemiSky: 0xcfe8ff, hemiGround: 0x5a7a40, fogNear: 220, fogFar: 1150
        },
        ember_badlands: {
            skyTop: 0xc0643a, horizon: 0xf6c890, bottom: 0xc09060, sun: 0xffb46a, sunElev: 0.2, sunAz: 2.2,
            ground: 0xb7743a, groundAlt: 0xcf9452, field: 0xa85a2c, rockGround: 0x8f5532,
            rock: 0xa4532e, rockDark: 0x6e3420, snow: 0xf3d9b0, foliage: 0x7d7232, foliageAlt: 0x9a8a3a, trunk: 0x4a3222,
            wall: 0xe9cfa8, roofs: [0x8f3e22, 0x6a4a32, 0xb0623a], water: 0x6a8a8a, bank: 0xd9b07a,
            cloud: 0xffe0c4, hemiSky: 0xffd8a8, hemiGround: 0x7a4a2a, fogNear: 200, fogFar: 1000
        },
        frost_tundra: {
            skyTop: 0x5d97d6, horizon: 0xe6f0f8, bottom: 0xdfe9f1, sun: 0xffffff, sunElev: 0.38, sunAz: 1.1,
            ground: 0xe8eff5, groundAlt: 0xd2deea, field: 0xc4d4e2, rockGround: 0xa9b6c2,
            rock: 0x6f7d8c, rockDark: 0x4d5866, snow: 0xffffff, foliage: 0x2c5a50, foliageAlt: 0x3a6a5c, trunk: 0x4a3a30,
            wall: 0x8a5a3a, roofs: [0xf4f7fa, 0xe8eef4, 0xdfe7ef], water: 0xa8d8f0, bank: 0xf4f8fb,
            cloud: 0xffffff, hemiSky: 0xe0eeff, hemiGround: 0xb0c0d0, fogNear: 180, fogFar: 1050
        },
        neon_coast: {
            skyTop: 0x1f86e0, horizon: 0xc2f2ff, bottom: 0x7fd6e6, sun: 0xfff6dc, sunElev: 0.55, sunAz: 0.4,
            ground: 0x4caf6e, groundAlt: 0xe6d49a, field: 0x6cc47e, rockGround: 0xd9c78f,
            rock: 0x7a8a86, rockDark: 0x56625f, snow: 0xf4f7fa, foliage: 0x2f9a58, foliageAlt: 0x46b866, trunk: 0x8a6a46,
            wall: 0xffffff, roofs: [0x2fa8d8, 0xff8a5c, 0xf2c94c], water: 0x22c4d8, bank: 0xf2e2a8,
            cloud: 0xffffff, hemiSky: 0xd2f4ff, hemiGround: 0x5aa47a, fogNear: 230, fogFar: 1150
        },
        obsidian_ridge: {
            skyTop: 0x141826, horizon: 0x6a4a5a, bottom: 0x2a1e24, sun: 0xff7a4a, sunElev: 0.12, sunAz: 2.6,
            ground: 0x2e3038, groundAlt: 0x3a3436, field: 0x45363a, rockGround: 0x24252c,
            rock: 0x2c2d36, rockDark: 0x18181f, snow: 0x5a5a66, foliage: 0x3a4436, foliageAlt: 0x4a4a3a, trunk: 0x221c1c,
            wall: 0x4a4a52, roofs: [0x8a2a1a, 0x5a2a22, 0x3a3a44], water: 0xff5a1a, bank: 0x3a2a26, glow: 0xff3a2a,
            cloud: 0x6a5a6a, hemiSky: 0x8a6a7a, hemiGround: 0x2a1a1a, fogNear: 180, fogFar: 950, stars: 0.6
        },
        golden_dunes: {
            skyTop: 0x4b96d6, horizon: 0xf8e4b6, bottom: 0xe8cf98, sun: 0xfff1c8, sunElev: 0.48, sunAz: 1.9,
            ground: 0xdcae68, groundAlt: 0xebc784, field: 0xc99a52, rockGround: 0xc58f55,
            rock: 0xb57a48, rockDark: 0x8a5634, snow: 0xf6e2b8, foliage: 0x6e8a3a, foliageAlt: 0x8aa04a, trunk: 0x7a5a3a,
            wall: 0xead2a0, roofs: [0xc28a4a, 0xa86a3a, 0xd9b070], water: 0x3fb0c0, bank: 0xf2dcae,
            cloud: 0xfff6e6, hemiSky: 0xfff0d0, hemiGround: 0xb08850, fogNear: 220, fogFar: 1100
        },
        moss_ruins: {
            skyTop: 0x3d8f96, horizon: 0xd0ecd8, bottom: 0x8ab89a, sun: 0xfff3d0, sunElev: 0.5, sunAz: 0.9,
            ground: 0x4c8a46, groundAlt: 0x689f50, field: 0x7aa85a, rockGround: 0x6a7a5a,
            rock: 0x7a8476, rockDark: 0x56604f, snow: 0xe8f0e6, foliage: 0x2a6a32, foliageAlt: 0x3f8a3a, trunk: 0x5a4030,
            wall: 0xb8b8a0, roofs: [0x5a6a4a, 0x7a6a50, 0x6a7a5a], water: 0x3a9a8a, bank: 0x8a9a6a,
            cloud: 0xf6fff8, hemiSky: 0xd8f4e8, hemiGround: 0x4a6a3a, fogNear: 170, fogFar: 1000
        },
        crimson_isles: {
            skyTop: 0x5a2f72, horizon: 0xf6b2a6, bottom: 0xc0707a, sun: 0xffc69a, sunElev: 0.22, sunAz: 2.4,
            ground: 0x94485a, groundAlt: 0xb5626a, field: 0xc87a6a, rockGround: 0x7a3a4a,
            rock: 0x6a2e40, rockDark: 0x42182a, snow: 0xffd6d0, foliage: 0xd0506a, foliageAlt: 0xe87a7a, trunk: 0x4a2230,
            wall: 0xf4dcd4, roofs: [0x5a2a5a, 0x8a3a5a, 0x3a2a4a], water: 0xd04a9a, bank: 0xe8a0a0, glow: 0xff3a7a,
            cloud: 0xffe0e6, hemiSky: 0xffd0d8, hemiGround: 0x6a2a3a, fogNear: 200, fogFar: 1050
        },
        storm_plateau: {
            skyTop: 0x2e3648, horizon: 0x96a2b2, bottom: 0x6a7684, sun: 0xdfe8f4, sunElev: 0.45, sunAz: 1.3,
            ground: 0x56665e, groundAlt: 0x6a7868, field: 0x7a8670, rockGround: 0x4e5660,
            rock: 0x4c5560, rockDark: 0x343a44, snow: 0xd6dde6, foliage: 0x2e4a3e, foliageAlt: 0x3e5a48, trunk: 0x3a3030,
            wall: 0x9aa2aa, roofs: [0x3a4450, 0x5a3a3a, 0x2a3440], water: 0x5a7080, bank: 0x7a8278, glow: 0xff3a3a,
            cloud: 0x9aa4b4, hemiSky: 0xaab4c4, hemiGround: 0x3a4440, fogNear: 150, fogFar: 880
        },
        aurora_highlands: {
            skyTop: 0x0a0f30, horizon: 0x4a5aa8, bottom: 0x1a2250, sun: 0xb8ccff, sunElev: 0.3, sunAz: 0.6,
            ground: 0x34488a, groundAlt: 0x46609e, field: 0x5a6ab0, rockGround: 0x2a3466,
            rock: 0x2a3060, rockDark: 0x181c40, snow: 0xdfe8ff, foliage: 0x1f5a6a, foliageAlt: 0x2a7a7a, trunk: 0x2a2440,
            wall: 0x6a7ab0, roofs: [0x2a3466, 0x3a2a66, 0x1a4a66], water: 0x3affd8, bank: 0x4a5ab0, glow: 0x3affd8,
            cloud: 0x5a6ab8, hemiSky: 0x6a7ad0, hemiGround: 0x1a2250, fogNear: 180, fogFar: 1050, stars: 1.0, aurora: 1.0
        }
    };

    const DECOR = {
        emerald_plains: { trees: ["round", "round", "pine"], houses: 0.45, windmills: true, mountain: "peak", fields: 1, river: "water", riverWidth: 22, rocks: 0.5 },
        ember_badlands: { trees: ["dead", "shrub", "shrub"], houses: 0.12, mountain: "mesa", fields: 0, river: "none", rocks: 1.4, treeDensity: 0.35 },
        frost_tundra: { trees: ["pine"], snowyTrees: true, houses: 0.2, mountain: "peak", snowLine: 0.42, fields: 0, river: "ice", riverWidth: 26, rocks: 0.8 },
        neon_coast: { trees: ["palm", "palm", "round"], houses: 0.4, mountain: "peak", fields: 0, river: "water", riverWidth: 70, rocks: 0.6 },
        obsidian_ridge: { trees: ["dead"], crystals: 0.7, houses: 0.05, mountain: "spire", fields: 0, river: "lava", riverWidth: 18, rocks: 1.4, treeDensity: 0.4 },
        golden_dunes: { trees: ["cactus", "cactus", "shrub"], ruins: 0.4, houses: 0.08, mountain: "mesa", fields: 0, river: "none", dunes: 1, rocks: 0.7, treeDensity: 0.45 },
        moss_ruins: { trees: ["round", "round", "pine"], ruins: 0.8, houses: 0.1, mountain: "peak", fields: 0, river: "water", riverWidth: 20, rocks: 0.8, treeDensity: 1.4 },
        crimson_isles: { trees: ["round", "round"], crystals: 0.6, houses: 0.15, mountain: "spire", fields: 0, river: "water", riverWidth: 30, rocks: 0.9 },
        storm_plateau: { trees: ["pine", "pine", "shrub"], pylons: 0.6, houses: 0.15, mountain: "mesa", fields: 0, river: "water", riverWidth: 18, rocks: 1.0 },
        aurora_highlands: { trees: ["pine"], snowyTrees: true, crystals: 0.8, houses: 0.08, mountain: "peak", snowLine: 0.35, fields: 0, river: "glow", riverWidth: 20, rocks: 0.8 }
    };

    // ---------- helpers ----------
    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function hash2(x, z, s) {
        let h = (x * 374761393 + z * 668265263 + s * 2147483647) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    function vnoise(x, z, s = 0) {
        const xi = Math.floor(x), zi = Math.floor(z);
        const xf = x - xi, zf = z - zi;
        const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
        const a = hash2(xi, zi, s), b = hash2(xi + 1, zi, s), c = hash2(xi, zi + 1, s), d = hash2(xi + 1, zi + 1, s);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    function riverX(z) {
        return Math.sin(z * 0.0021) * 110 + Math.sin(z * 0.0047 + 1.3) * 45;
    }
    const C = (hex) => new THREE.Color(hex);

    // Build a non-indexed geometry with flat per-face vertex colors.
    function tpl(geom, colorFn) {
        const g = geom.index ? geom.toNonIndexed() : geom.clone();
        const pos = g.attributes.position;
        const col = new Float32Array(pos.count * 3);
        const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
        const n = new THREE.Vector3(), centroid = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
        for (let i = 0; i < pos.count; i += 3) {
            a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
            centroid.copy(a).add(b).add(c).multiplyScalar(1 / 3);
            n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a)).normalize();
            const color = colorFn(centroid, n, i / 3);
            for (let k = 0; k < 3; k++) {
                col[(i + k) * 3] = color.r; col[(i + k) * 3 + 1] = color.g; col[(i + k) * 3 + 2] = color.b;
            }
        }
        const out = new THREE.BufferGeometry();
        out.setAttribute("position", new THREE.BufferAttribute(pos.array.slice(), 3));
        out.setAttribute("color", new THREE.BufferAttribute(col, 3));
        return out;
    }
    function combine(list) {
        let count = 0;
        list.forEach((g) => { count += g.attributes.position.count; });
        const p = new Float32Array(count * 3), c = new Float32Array(count * 3);
        let o = 0;
        list.forEach((g) => {
            p.set(g.attributes.position.array, o);
            c.set(g.attributes.color.array, o);
            o += g.attributes.position.array.length;
        });
        const out = new THREE.BufferGeometry();
        out.setAttribute("position", new THREE.BufferAttribute(p, 3));
        out.setAttribute("color", new THREE.BufferAttribute(c, 3));
        return out;
    }
    function shade(color, n, amount = 0.18) {
        return color.clone().multiplyScalar(1 - amount + amount * (0.5 + 0.5 * n.y));
    }
    function jitterColor(color, rnd, amount = 0.08) {
        return color.clone().multiplyScalar(1 - amount + rnd() * amount * 2);
    }

    class Builder {
        constructor() { this.p = []; this.c = []; }
        add(template, matrix, tint = 1) {
            const pa = template.attributes.position.array, ca = template.attributes.color.array;
            const e = matrix.elements;
            for (let i = 0; i < pa.length; i += 3) {
                const x = pa[i], y = pa[i + 1], z = pa[i + 2];
                this.p.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
                this.c.push(ca[i] * tint, ca[i + 1] * tint, ca[i + 2] * tint);
            }
        }
        build() {
            if (!this.p.length) return null;
            const g = new THREE.BufferGeometry();
            g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
            g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
            g.computeVertexNormals();
            g.computeBoundingSphere();
            return g;
        }
    }

    // ---------- templates ----------
    function buildTemplates(pal, decor) {
        const T = {};
        const rnd = mulberry32(1337);
        const rock = C(pal.rock), rockDark = C(pal.rockDark), snow = C(pal.snow);
        const foliage = C(pal.foliage), foliageAlt = C(pal.foliageAlt), trunk = C(pal.trunk);
        const groundAlt = C(pal.groundAlt);
        const snowLine = decor.snowLine ?? 0.62;

        // Mountains (unit radius 1, height 1, base at y=0)
        T.mountains = [];
        for (let v = 0; v < 4; v++) {
            const style = decor.mountain;
            const g = new THREE.ConeGeometry(1, 1, style === "mesa" ? 8 : 10, style === "mesa" ? 4 : 6, true);
            g.translate(0, 0.5, 0);
            const pos = g.attributes.position;
            const seed = v * 17.3;
            for (let i = 0; i < pos.count; i++) {
                let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
                const ang = Math.atan2(z, x);
                let r = Math.hypot(x, z);
                const n = vnoise(Math.cos(ang) * 2 + seed, y * 3 + Math.sin(ang) * 2, v + 3);
                if (style === "mesa") {
                    r = y < 0.999 ? Math.max(r, 0.72 * (1 - y * 0.25)) : r * 0.8;
                    r *= 0.85 + n * 0.3;
                    y = Math.min(y, 0.82 + n * 0.05);
                } else if (style === "spire") {
                    r *= Math.pow(1 - y, 0.6) / Math.max(0.0001, 1 - y) * 0.75 * (0.75 + n * 0.5);
                    if (!isFinite(r)) r = 0;
                } else {
                    r *= 0.72 + n * 0.56;
                    y += (n - 0.5) * 0.1 * (1 - y);
                }
                x = Math.cos(ang) * r + y * (v - 1.5) * 0.08;
                z = Math.sin(ang) * r;
                pos.setXYZ(i, x, y, z);
            }
            T.mountains.push(tpl(g, (c, n) => {
                const noise = vnoise(c.x * 6 + v, c.z * 6, 9);
                if (style === "mesa") {
                    if (n.y > 0.7) return groundAlt.clone().multiplyScalar(0.9);
                    const band = Math.floor(c.y * 9 + noise * 0.8) % 3;
                    return (band === 0 ? rock : band === 1 ? rockDark : rock.clone().lerp(groundAlt, 0.35)).clone().multiplyScalar(0.92 + noise * 0.16);
                }
                if (c.y > snowLine + noise * 0.12 && n.y > 0.25) return snow.clone().multiplyScalar(0.94 + noise * 0.06);
                if (c.y < 0.12 + noise * 0.08) return groundAlt.clone().lerp(rock, 0.35).multiplyScalar(0.9);
                const base = n.y < 0.42 ? rockDark : rock;
                return base.clone().multiplyScalar(0.85 + noise * 0.3);
            }));
        }

        // Trees
        const leaf = (n) => shade(rnd() > 0.5 ? foliage : foliageAlt, n, 0.35);
        const snowyLeaf = (n) => decor.snowyTrees && n.y > 0.35 ? snow.clone() : leaf(n);
        {
            const parts = [];
            const t = new THREE.CylinderGeometry(0.18, 0.28, 1.2, 5); t.translate(0, 0.6, 0);
            parts.push(tpl(t, () => trunk));
            [[1.6, 2.2, 1.8], [1.25, 1.9, 2.9], [0.85, 1.6, 3.85]].forEach(([r, h, y]) => {
                const cone = new THREE.ConeGeometry(r, h, 7); cone.translate(0, y, 0);
                parts.push(tpl(cone, (c, n) => snowyLeaf(n)));
            });
            T.pine = combine(parts);
        }
        {
            const parts = [];
            const t = new THREE.CylinderGeometry(0.2, 0.32, 2.0, 5); t.translate(0, 1.0, 0);
            parts.push(tpl(t, () => trunk));
            const b1 = new THREE.IcosahedronGeometry(1.5, 0); b1.scale(1, 0.85, 1); b1.translate(0, 2.8, 0);
            const b2 = new THREE.IcosahedronGeometry(1.05, 0); b2.translate(0.6, 3.6, 0.3);
            const b3 = new THREE.IcosahedronGeometry(0.95, 0); b3.translate(-0.7, 2.5, -0.4);
            [b1, b2, b3].forEach((b) => parts.push(tpl(b, (c, n) => snowyLeaf(n))));
            T.round = combine(parts);
        }
        {
            const parts = [];
            let px = 0, py = 0;
            for (let s = 0; s < 5; s++) {
                const seg = new THREE.CylinderGeometry(0.16, 0.2, 1.0, 5);
                seg.rotateZ(-0.08 * s);
                seg.translate(px, py + 0.5, 0);
                px += Math.sin(0.08 * s) * 1.0; py += Math.cos(0.08 * s) * 1.0;
                parts.push(tpl(seg, (c, n) => shade(trunk, n).multiplyScalar(s % 2 ? 1.1 : 0.95)));
            }
            for (let f = 0; f < 7; f++) {
                const frond = new THREE.ConeGeometry(0.35, 2.6, 4);
                frond.scale(1, 1, 0.25);
                frond.translate(0, 1.3, 0);
                frond.rotateZ(-1.9);
                frond.rotateY((f / 7) * Math.PI * 2);
                frond.translate(px, py, 0);
                parts.push(tpl(frond, (c, n) => leaf(n)));
            }
            T.palm = combine(parts);
        }
        {
            const parts = [];
            const main = new THREE.CylinderGeometry(0.35, 0.4, 3.2, 7); main.translate(0, 1.6, 0);
            const arm1 = new THREE.CylinderGeometry(0.22, 0.25, 1.2, 6); arm1.translate(0.75, 1.9, 0);
            const arm1b = new THREE.CylinderGeometry(0.22, 0.22, 0.6, 6); arm1b.rotateZ(Math.PI / 2); arm1b.translate(0.45, 1.35, 0);
            const arm2 = new THREE.CylinderGeometry(0.2, 0.22, 0.9, 6); arm2.translate(-0.7, 2.3, 0);
            const arm2b = new THREE.CylinderGeometry(0.2, 0.2, 0.55, 6); arm2b.rotateZ(Math.PI / 2); arm2b.translate(-0.42, 1.9, 0);
            [main, arm1, arm1b, arm2, arm2b].forEach((g) => parts.push(tpl(g, (c, n) => shade(foliage, n, 0.3))));
            T.cactus = combine(parts);
        }
        {
            const parts = [];
            const t = new THREE.CylinderGeometry(0.14, 0.3, 3.2, 5); t.translate(0, 1.6, 0);
            parts.push(tpl(t, (c, n) => shade(trunk, n)));
            [[0.8, 2.2, 0.7], [-0.7, 2.6, -0.9], [0.2, 2.9, 1.2]].forEach(([rz, y, ry]) => {
                const br = new THREE.CylinderGeometry(0.06, 0.12, 1.4, 4);
                br.translate(0, 0.7, 0); br.rotateZ(rz); br.rotateY(ry); br.translate(0, y, 0);
                parts.push(tpl(br, (c, n) => shade(trunk, n)));
            });
            T.dead = combine(parts);
        }
        {
            const g = new THREE.IcosahedronGeometry(1, 0); g.scale(1.2, 0.7, 1.1); g.translate(0, 0.45, 0);
            T.shrub = tpl(g, (c, n) => leaf(n));
        }
        // Rocks
        T.rocks = [0, 1, 2].map((v) => {
            const g = new THREE.DodecahedronGeometry(1, 0);
            const pos = g.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const n = vnoise(pos.getX(i) * 2 + v * 5, pos.getY(i) * 2 + pos.getZ(i) * 2, 11);
                pos.setXYZ(i, pos.getX(i) * (0.8 + n * 0.4), pos.getY(i) * (0.55 + n * 0.25), pos.getZ(i) * (0.8 + n * 0.4));
            }
            g.translate(0, 0.25, 0);
            return tpl(g, (c, n) => decor.snowyTrees && n.y > 0.6 ? snow.clone() : shade(n.y > 0.3 ? rock : rockDark, n, 0.3));
        });
        // Houses (unit ~1)
        T.houses = pal.roofs.map((roofHex) => {
            const parts = [];
            const wall = C(pal.wall), roof = C(roofHex);
            const body = new THREE.BoxGeometry(1, 0.75, 1.4); body.translate(0, 0.375, 0);
            parts.push(tpl(body, (c, n) => shade(wall, n, 0.1).multiplyScalar(Math.abs(n.x) > 0.5 ? 0.86 : 1)));
            const r = new THREE.ConeGeometry(0.86, 0.55, 4); r.rotateY(Math.PI / 4); r.scale(1, 1, 1.55); r.translate(0, 1.02, 0);
            parts.push(tpl(r, (c, n) => shade(roof, n, 0.3)));
            const ch = new THREE.BoxGeometry(0.16, 0.4, 0.16); ch.translate(0.25, 1.15, 0.3);
            parts.push(tpl(ch, (c, n) => shade(wall.clone().multiplyScalar(0.7), n)));
            const door = new THREE.BoxGeometry(0.22, 0.38, 0.02); door.translate(0, 0.19, 0.71);
            parts.push(tpl(door, () => roof.clone().multiplyScalar(0.55)));
            return combine(parts);
        });
        // Windmill
        {
            const parts = [];
            const tower = new THREE.CylinderGeometry(0.45, 0.8, 3.4, 8); tower.translate(0, 1.7, 0);
            parts.push(tpl(tower, (c, n) => shade(C(pal.wall), n, 0.2)));
            const cap = new THREE.ConeGeometry(0.62, 0.8, 8); cap.translate(0, 3.8, 0);
            parts.push(tpl(cap, (c, n) => shade(C(pal.roofs[0]), n, 0.25)));
            for (let b = 0; b < 4; b++) {
                const blade = new THREE.BoxGeometry(0.28, 2.0, 0.04);
                blade.translate(0, 1.05, 0); blade.rotateZ(b * Math.PI / 2 + 0.4); blade.translate(0, 3.5, 0.7);
                parts.push(tpl(blade, () => C(0xf2ede0)));
            }
            T.windmill = combine(parts);
        }
        // Ruins column cluster
        {
            const parts = [];
            const stone = C(pal.rock).lerp(C(0xd8d0b8), 0.55);
            const base = new THREE.BoxGeometry(3.2, 0.4, 1.4); base.translate(0, 0.2, 0);
            parts.push(tpl(base, (c, n) => shade(stone, n)));
            [-1.1, 0, 1.1].forEach((x, i) => {
                const h = [2.8, 1.6, 2.3][i];
                const col = new THREE.CylinderGeometry(0.28, 0.32, h, 8); col.translate(x, 0.4 + h / 2, 0);
                parts.push(tpl(col, (c, n) => shade(stone, n, 0.25)));
            });
            const lintel = new THREE.BoxGeometry(1.6, 0.3, 0.6); lintel.translate(-0.55, 3.35, 0);
            parts.push(tpl(lintel, (c, n) => shade(stone, n)));
            const moss = new THREE.IcosahedronGeometry(0.5, 0); moss.scale(1.6, 0.5, 1); moss.translate(0.8, 0.45, 0.6);
            parts.push(tpl(moss, (c, n) => shade(foliage, n)));
            T.ruin = combine(parts);
        }
        // Pylon (storm towers)
        {
            const parts = [];
            const metal = C(0x5a6270);
            [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([x, z]) => {
                const leg = new THREE.CylinderGeometry(0.06, 0.1, 6, 4);
                leg.translate(0, 3, 0); leg.rotateX(z * 0.12); leg.rotateZ(-x * 0.12); leg.translate(x, 0, z);
                parts.push(tpl(leg, () => metal));
            });
            const head = new THREE.BoxGeometry(2.2, 0.15, 0.2); head.translate(0, 5.6, 0);
            parts.push(tpl(head, () => metal));
            T.pylon = combine(parts);
        }
        // Glowing crystals (rendered in the emissive pass)
        {
            const glow = C(pal.glow ?? pal.water);
            const parts = [];
            [[0, 0, 1.0, 0], [0.7, 0.2, 0.6, 0.4], [-0.6, -0.3, 0.7, -0.35]].forEach(([x, z, s, tilt]) => {
                const g = new THREE.OctahedronGeometry(0.6, 0); g.scale(s, s * 3.2, s); g.rotateZ(tilt); g.translate(x, s * 1.6, z);
                parts.push(tpl(g, (c, n) => glow.clone().multiplyScalar(0.7 + 0.3 * Math.abs(n.x))));
            });
            T.crystal = combine(parts);
        }
        // Pylon beacon light (glow pass)
        {
            const g = new THREE.SphereGeometry(0.22, 6, 4); g.translate(0, 5.95, 0);
            T.beaconLight = tpl(g, () => C(pal.glow ?? 0xff3a3a));
        }
        return T;
    }

    // ---------- shaders ----------
    const NOISE_GLSL = `
        float hw_hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float hw_noise(vec2 p){
            vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hw_hash(i), hw_hash(i + vec2(1.0, 0.0)), f.x), mix(hw_hash(i + vec2(0.0, 1.0)), hw_hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        float hw_fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * hw_noise(p); p *= 2.03; a *= 0.5; } return v; }
    `;

    function makeSkyMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTop: { value: new THREE.Color() },
                uHorizon: { value: new THREE.Color() },
                uBottom: { value: new THREE.Color() },
                uSunColor: { value: new THREE.Color() },
                uSunDir: { value: new THREE.Vector3(0, 1, 0) },
                uStars: { value: 0 },
                uAurora: { value: 0 },
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec3 vDir;
                void main(){
                    vDir = position;
                    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    gl_Position = p.xyww;
                }
            `,
            fragmentShader: `
                uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBottom; uniform vec3 uSunColor; uniform vec3 uSunDir;
                uniform float uStars; uniform float uAurora; uniform float uTime;
                varying vec3 vDir;
                ${NOISE_GLSL}
                float hash3(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
                void main(){
                    vec3 d = normalize(vDir);
                    float h = d.y;
                    vec3 col = mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.5));
                    col = mix(col, uBottom, smoothstep(0.0, -0.2, h));
                    float sd = max(dot(d, normalize(uSunDir)), 0.0);
                    col += uSunColor * (pow(sd, 1200.0) * 3.0 + pow(sd, 64.0) * 0.35 + pow(sd, 6.0) * 0.18);
                    // soft high clouds
                    vec2 cp = d.xz / max(h + 0.12, 0.05);
                    float cl = smoothstep(0.55, 0.85, hw_fbm(cp * 1.4 + vec2(uTime * 0.004, 0.0)));
                    col = mix(col, mix(uHorizon, vec3(1.0), 0.6), cl * smoothstep(0.02, 0.25, h) * 0.35 * (1.0 - uStars * 0.6));
                    if (uStars > 0.0) {
                        vec3 cell = floor(d * 380.0);
                        float s = hash3(cell);
                        float twinkle = 0.6 + 0.4 * sin(uTime * 2.5 + s * 80.0);
                        col += vec3(step(0.9965, s) * twinkle * smoothstep(0.04, 0.35, h) * uStars);
                    }
                    if (uAurora > 0.0) {
                        float band = sin(d.x * 4.0 + hw_noise(vec2(d.x * 3.0, uTime * 0.08)) * 4.0 + uTime * 0.15);
                        float curtain = smoothstep(0.5, 1.0, band) * smoothstep(0.08, 0.3, h) * smoothstep(0.75, 0.35, h);
                        float ripple = 0.6 + 0.4 * hw_noise(vec2(d.x * 30.0, h * 6.0 - uTime * 0.6));
                        col += mix(vec3(0.15, 1.0, 0.65), vec3(0.6, 0.35, 1.0), smoothstep(0.2, 0.6, h)) * curtain * ripple * 0.55 * uAurora;
                    }
                    gl_FragColor = vec4(col, 1.0);
                }
            `,
            side: THREE.BackSide,
            depthWrite: false,
            fog: false
        });
    }

    function makeGroundMaterial(uniforms) {
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0 });
        mat.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, uniforms);
            shader.vertexShader = shader.vertexShader
                .replace("#include <common>", "#include <common>\nvarying vec3 vHwWorld;")
                .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHwWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
            shader.fragmentShader = shader.fragmentShader
                .replace("#include <common>", `#include <common>
                    varying vec3 vHwWorld;
                    uniform vec3 uGroundA; uniform vec3 uGroundB; uniform vec3 uField; uniform vec3 uRockGround;
                    uniform vec3 uWater; uniform vec3 uBank;
                    uniform float uTime; uniform float uRiver; uniform float uRiverW; uniform float uFields; uniform float uDunes;
                    uniform float uWaterGlow; uniform float uWaterRough; uniform float uValley;
                    ${NOISE_GLSL}
                    float hwRiverX(float z){ return sin(z * 0.0021) * 110.0 + sin(z * 0.0047 + 1.3) * 45.0; }
                    float hwWater = 0.0;
                `)
                .replace("#include <color_fragment>", `#include <color_fragment>
                    vec2 wp = vHwWorld.xz;
                    float macro = hw_fbm(wp * 0.0035);
                    vec3 g = mix(uGroundA, uGroundB, smoothstep(0.35, 0.72, macro));
                    if (uDunes > 0.5) {
                        float dune = sin(wp.x * 0.03 + hw_fbm(wp * 0.006) * 9.0 + wp.y * 0.008);
                        g = mix(g, uGroundB * 1.08, smoothstep(0.2, 1.0, dune) * 0.6);
                        g *= 0.92 + 0.08 * smoothstep(-1.0, 0.0, dune);
                    }
                    if (uFields > 0.5) {
                        vec2 cellId = floor(wp / 70.0);
                        vec2 lp = fract(wp / 70.0);
                        float ch = hw_hash(cellId);
                        float mask = step(0.55, ch) * smoothstep(0.35, 0.55, hw_fbm(wp * 0.008 + 3.0));
                        float stripes = 0.5 + 0.5 * sin((ch > 0.78 ? lp.x : lp.y) * 70.0);
                        vec3 fieldCol = mix(uField, uGroundB, step(0.7, fract(ch * 7.0))) * (0.9 + 0.1 * stripes);
                        float edge = smoothstep(0.0, 0.05, lp.x) * smoothstep(0.0, 0.05, lp.y) * smoothstep(1.0, 0.95, lp.x) * smoothstep(1.0, 0.95, lp.y);
                        g = mix(g, fieldCol, mask * edge);
                    }
                    float flank = smoothstep(uValley - 30.0, uValley + 160.0, abs(wp.x));
                    g = mix(g, uRockGround, flank * (0.55 + 0.45 * hw_noise(wp * 0.02)));
                    g *= 0.9 + 0.2 * hw_noise(wp * 0.09);
                    g *= 0.96 + 0.08 * hw_noise(wp * 0.7);
                    if (uRiver > 0.5) {
                        float d = abs(wp.x - hwRiverX(wp.y));
                        float bank = smoothstep(uRiverW + 16.0, uRiverW + 3.0, d);
                        hwWater = smoothstep(uRiverW, uRiverW - 4.0, d);
                        g = mix(g, uBank, bank);
                        float ripple = hw_noise(vec2(wp.x * 0.25, wp.y * 0.08 - uTime * 1.2));
                        vec3 wc = uWater * (0.82 + 0.25 * ripple);
                        wc = mix(wc * 0.8, wc, smoothstep(0.0, uRiverW, d));
                        g = mix(g, wc, hwWater);
                    }
                    diffuseColor.rgb *= g;
                `)
                .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
                    roughnessFactor = mix(roughnessFactor, uWaterRough, hwWater);
                `)
                .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
                    totalEmissiveRadiance += diffuseColor.rgb * hwWater * uWaterGlow;
                `);
        };
        return mat;
    }

    // ---------- module state ----------
    const W = {
        ready: false,
        themeId: null,
        pal: null,
        decor: null,
        templates: null,
        tiles: new Map(),
        clearings: [],
        clouds: [],
        time: 0
    };
    let scene, renderer, sky, sun, hemi, ground, groundUniforms, horizonGroup, solidMat, glowMat, cloudMat;
    const tmpMatrix = new THREE.Matrix4();
    const tmpQuat = new THREE.Quaternion();
    const tmpEuler = new THREE.Euler();
    const tmpScale = new THREE.Vector3();
    const tmpPos = new THREE.Vector3();
    const UP = new THREE.Vector3(0, 1, 0);

    function isMobileLike() {
        return Math.min(window.innerWidth, window.innerHeight) < 600 || /Android|iPhone|iPad/i.test(navigator.userAgent);
    }

    function init(sceneRef, rendererRef) {
        scene = sceneRef;
        renderer = rendererRef;
        const mobile = isMobileLike();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), makeSkyMaterial());
        sky.renderOrder = -10;
        sky.frustumCulled = false;
        scene.add(sky);

        hemi = new THREE.HemisphereLight(0xffffff, 0x445533, 0.62);
        scene.add(hemi);
        scene.add(new THREE.AmbientLight(0xffffff, 0.12));

        sun = new THREE.DirectionalLight(0xffffff, 0.95);
        sun.castShadow = true;
        const s = 170;
        sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
        sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
        sun.shadow.camera.near = 10; sun.shadow.camera.far = 900;
        sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
        sun.shadow.bias = -0.0008;
        sun.shadow.normalBias = 0.6;
        scene.add(sun);
        scene.add(sun.target);

        groundUniforms = {
            uGroundA: { value: new THREE.Color() }, uGroundB: { value: new THREE.Color() },
            uField: { value: new THREE.Color() }, uRockGround: { value: new THREE.Color() },
            uWater: { value: new THREE.Color() }, uBank: { value: new THREE.Color() },
            uTime: { value: 0 }, uRiver: { value: 1 }, uRiverW: { value: 22 }, uFields: { value: 1 },
            uDunes: { value: 0 }, uWaterGlow: { value: 0 }, uWaterRough: { value: 0.2 }, uValley: { value: VALLEY_HALF }
        };
        ground = new THREE.Mesh(new THREE.PlaneGeometry(4200, 4200, 1, 1), makeGroundMaterial(groundUniforms));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        solidMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0 });
        glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });
        cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x777777, flatShading: true, transparent: true, opacity: 0.95 });

        horizonGroup = new THREE.Group();
        scene.add(horizonGroup);
        W.ready = true;
    }

    function buildHorizon() {
        while (horizonGroup.children.length) {
            const c = horizonGroup.children.pop();
            c.geometry.dispose();
            c.material.dispose();
        }
        const pal = W.pal;
        const layers = [
            { radius: 1380, minH: 70, maxH: 230, mix: 0.62, seed: 3 },
            { radius: 1220, minH: 40, maxH: 150, mix: 0.45, seed: 7 }
        ];
        layers.forEach((layer) => {
            const segs = 160;
            const positions = [];
            for (let i = 0; i < segs; i++) {
                const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
                const h0 = layer.minH + (layer.maxH - layer.minH) * Math.pow(vnoise(i * 0.35, 0, layer.seed) * 0.7 + vnoise(i * 1.3, 4, layer.seed) * 0.3, 1.4);
                const h1 = layer.minH + (layer.maxH - layer.minH) * Math.pow(vnoise((i + 1) * 0.35, 0, layer.seed) * 0.7 + vnoise((i + 1) * 1.3, 4, layer.seed) * 0.3, 1.4);
                const x0 = Math.cos(a0) * layer.radius, z0 = Math.sin(a0) * layer.radius;
                const x1 = Math.cos(a1) * layer.radius, z1 = Math.sin(a1) * layer.radius;
                positions.push(x0, -20, z0, x1, -20, z1, x1, h1, z1);
                positions.push(x0, -20, z0, x1, h1, z1, x0, h0, z0);
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
            const colorTop = C(pal.rock).lerp(C(pal.horizon), layer.mix);
            if (W.decor.mountain === "peak") colorTop.lerp(C(pal.snow), 0.12);
            const colors = [];
            const bottom = C(pal.horizon);
            for (let i = 1; i < positions.length; i += 3) {
                const t = THREE.MathUtils.clamp((positions[i] + 20) / 200, 0, 1);
                const col = bottom.clone().lerp(colorTop, 0.35 + t * 0.65);
                colors.push(col.r, col.g, col.b);
            }
            g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
            const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide, depthWrite: false }));
            m.renderOrder = -5;
            m.frustumCulled = false;
            horizonGroup.add(m);
        });
    }

    function buildClouds() {
        W.clouds.forEach((c) => { scene.remove(c.mesh); c.mesh.geometry.dispose(); c.mesh.material.dispose(); });
        W.clouds = [];
        const rnd = mulberry32(99);
        const cloudColor = C(W.pal.cloud);
        for (let i = 0; i < 26; i++) {
            const parts = [];
            const puffs = 5 + Math.floor(rnd() * 5);
            for (let p = 0; p < puffs; p++) {
                const r = 6 + rnd() * 9;
                const g = new THREE.IcosahedronGeometry(r, 1);
                const x = (p - puffs / 2) * 8 + rnd() * 6, y = rnd() * 4 + (1 - Math.abs(p - puffs / 2) / puffs) * 6, z = (rnd() - 0.5) * 14;
                g.scale(1, 0.72, 1);
                g.translate(x, y, z);
                parts.push(tpl(g, (c, n) => cloudColor.clone().multiplyScalar(0.8 + 0.2 * Math.max(0, n.y) + (c.y < 2 ? -0.08 : 0))));
            }
            const geom = combine(parts);
            geom.computeVertexNormals();
            geom.computeBoundingSphere();
            const mat = cloudMat.clone();
            mat.vertexColors = true;
            mat.color.setHex(0xffffff);
            mat.emissive = C(W.pal.cloud).multiplyScalar(0.35);
            const mesh = new THREE.Mesh(geom, mat);
            const scale = 1.1 + rnd() * 1.4;
            mesh.scale.set(scale, scale * (0.7 + rnd() * 0.3), scale);
            const cloud = { mesh, speed: 2 + rnd() * 3, alt: 215 + rnd() * 160 };
            placeCloud(cloud, new THREE.Vector3(0, 0, 0), rnd() * Math.PI * 2, 120 + rnd() * 900);
            scene.add(mesh);
            W.clouds.push(cloud);
        }
    }

    function placeCloud(cloud, center, angle, dist) {
        cloud.mesh.position.set(center.x + Math.sin(angle) * dist, cloud.alt, center.z - Math.cos(angle) * dist);
        cloud.mesh.rotation.y = angle * 3.1;
    }

    function applyTheme(themeId) {
        if (!W.ready) return;
        const pal = PALETTES[themeId] || PALETTES.emerald_plains;
        const decor = DECOR[themeId] || DECOR.emerald_plains;
        const changed = W.themeId !== themeId;
        W.themeId = themeId;
        W.pal = pal;
        W.decor = decor;

        const u = sky.material.uniforms;
        u.uTop.value.setHex(pal.skyTop);
        u.uHorizon.value.setHex(pal.horizon);
        u.uBottom.value.setHex(pal.bottom);
        u.uSunColor.value.setHex(pal.sun);
        u.uStars.value = pal.stars || 0;
        u.uAurora.value = pal.aurora || 0;
        const el = pal.sunElev, az = pal.sunAz;
        W.sunDir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)).normalize();
        u.uSunDir.value.copy(W.sunDir);

        scene.background = C(pal.horizon);
        scene.fog = new THREE.Fog(pal.horizon, pal.fogNear * fogScale, pal.fogFar * fogScale);

        sun.color.setHex(pal.sun);
        sun.intensity = pal.stars ? 0.7 : 0.95;
        hemi.color.setHex(pal.hemiSky);
        hemi.groundColor.setHex(pal.hemiGround);
        hemi.intensity = pal.stars ? 0.75 : 0.62;

        groundUniforms.uGroundA.value.setHex(pal.ground);
        groundUniforms.uGroundB.value.setHex(pal.groundAlt);
        groundUniforms.uField.value.setHex(pal.field);
        groundUniforms.uRockGround.value.setHex(pal.rockGround);
        groundUniforms.uWater.value.setHex(pal.water);
        groundUniforms.uBank.value.setHex(pal.bank);
        groundUniforms.uRiver.value = decor.river === "none" ? 0 : 1;
        groundUniforms.uRiverW.value = decor.riverWidth || 22;
        groundUniforms.uFields.value = decor.fields || 0;
        groundUniforms.uDunes.value = decor.dunes || 0;
        groundUniforms.uWaterGlow.value = decor.river === "lava" ? 1.1 : decor.river === "glow" ? 0.7 : 0;
        groundUniforms.uWaterRough.value = decor.river === "ice" ? 0.35 : decor.river === "lava" ? 0.8 : 0.12;

        if (changed || !W.templates) {
            W.templates = buildTemplates(pal, decor);
            buildHorizon();
            buildClouds();
            clearTiles();
        }
    }

    function clearTiles() {
        W.tiles.forEach((tile) => disposeTile(tile));
        W.tiles.clear();
    }

    function disposeTile(tile) {
        tile.meshes.forEach((m) => { scene.remove(m); m.geometry.dispose(); });
    }

    function inClearing(x, z, pad = 0) {
        for (const c of W.clearings) {
            if ((x - c.x) * (x - c.x) + (z - c.z) * (z - c.z) < (c.r + pad) * (c.r + pad)) return true;
        }
        return false;
    }

    function buildTile(tx, tz) {
        const T = W.templates, decor = W.decor;
        const rnd = mulberry32(Math.floor(hash2(tx, tz, 71) * 4294967295));
        const solid = new Builder(), glow = new Builder();
        const colliders = [];
        const x0 = tx * TILE, z0 = tz * TILE;

        const place = (template, x, z, scale, rotY = rnd() * Math.PI * 2, builder = solid, tint = 0.9 + rnd() * 0.2, sy = scale, y = 0) => {
            tmpEuler.set(0, rotY, 0);
            tmpQuat.setFromEuler(tmpEuler);
            tmpScale.set(scale, sy, scale);
            tmpPos.set(x, y, z);
            tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
            builder.add(template, tmpMatrix, tint);
        };
        const nearRiver = (x, z, pad) => decor.river !== "none" && Math.abs(x - riverX(z)) < (decor.riverWidth || 22) + pad;

        // Mountains / mesas outside the valley
        const outer = Math.max(Math.abs(x0), Math.abs(x0 + TILE));
        if (outer > VALLEY_HALF) {
            const count = 2 + Math.floor(rnd() * 3);
            for (let i = 0; i < count; i++) {
                const x = x0 + rnd() * TILE, z = z0 + rnd() * TILE;
                const dist = Math.abs(x) - VALLEY_HALF;
                if (dist < 20) continue;
                const style = decor.mountain;
                let r = style === "mesa" ? 45 + rnd() * 60 : 55 + rnd() * 75;
                r = Math.min(r, dist + 30);
                let h = style === "mesa" ? 40 + rnd() * 60 + dist * 0.12 : style === "spire" ? 110 + rnd() * 120 + dist * 0.2 : 70 + rnd() * 90 + dist * 0.25;
                h = Math.min(h, 320);
                place(T.mountains[Math.floor(rnd() * T.mountains.length)], x, z, r, rnd() * Math.PI * 2, solid, 0.9 + rnd() * 0.15, h);
                colliders.push({ x, z, r: r * (style === "spire" ? 0.6 : 0.82), h: h * (style === "mesa" ? 0.82 : 1), type: style === "mesa" ? "mesa" : "cone" });
            }
        }

        // Vegetation
        const density = (decor.treeDensity ?? 1);
        const forest = vnoise(x0 * 0.004 + 3, z0 * 0.004, 21);
        const treeCount = Math.floor((10 + forest * 40) * density);
        for (let i = 0; i < treeCount; i++) {
            let x = x0 + rnd() * TILE, z = z0 + rnd() * TILE;
            const local = vnoise(x * 0.012, z * 0.012, 5);
            if (local < 0.42 - forest * 0.2) continue;
            if (nearRiver(x, z, 6) || inClearing(x, z)) continue;
            const kind = decor.trees[Math.floor(rnd() * decor.trees.length)];
            const scale = kind === "shrub" ? 1.6 + rnd() * 2 : kind === "cactus" ? 2.2 + rnd() * 1.6 : kind === "palm" ? 2.6 + rnd() * 1.4 : 2.4 + rnd() * 2.2;
            place(T[kind], x, z, scale);
        }
        // Rocks
        const rockCount = Math.floor((3 + rnd() * 6) * (decor.rocks ?? 1));
        for (let i = 0; i < rockCount; i++) {
            const x = x0 + rnd() * TILE, z = z0 + rnd() * TILE;
            if (nearRiver(x, z, 2) || inClearing(x, z)) continue;
            place(T.rocks[i % 3], x, z, 1.5 + rnd() * 5);
        }
        // Villages near the river inside the valley
        if (decor.houses && Math.abs(x0 + TILE / 2) < VALLEY_HALF + 60 && rnd() < decor.houses) {
            const cz = z0 + TILE * (0.2 + rnd() * 0.6);
            const cx = (decor.river !== "none" ? riverX(cz) : 0) + (rnd() < 0.5 ? -1 : 1) * ((decor.riverWidth || 20) + 25 + rnd() * 40);
            const houses = 3 + Math.floor(rnd() * 5);
            for (let i = 0; i < houses; i++) {
                const hx = cx + (rnd() - 0.5) * 70, hz = cz + (rnd() - 0.5) * 70;
                if (hx < x0 - 30 || hx > x0 + TILE + 30 || nearRiver(hx, hz, 6) || inClearing(hx, hz)) continue;
                place(T.houses[Math.floor(rnd() * T.houses.length)], hx, hz, 6 + rnd() * 3, Math.floor(rnd() * 4) * Math.PI / 2 + (rnd() - 0.5) * 0.3, solid, 1);
            }
            if (decor.windmills && rnd() < 0.6) place(T.windmill, cx + 45, cz + 10, 4.2, rnd() * 6, solid, 1);
        }
        if (decor.ruins && rnd() < decor.ruins) {
            const n = 1 + Math.floor(rnd() * 3);
            for (let i = 0; i < n; i++) {
                const x = x0 + rnd() * TILE, z = z0 + rnd() * TILE;
                if (nearRiver(x, z, 8) || inClearing(x, z)) continue;
                place(T.ruin, x, z, 3 + rnd() * 2);
            }
        }
        if (decor.crystals && rnd() < decor.crystals) {
            const n = 2 + Math.floor(rnd() * 4);
            const cx = x0 + rnd() * TILE, cz = z0 + rnd() * TILE;
            for (let i = 0; i < n; i++) {
                const x = cx + (rnd() - 0.5) * 50, z = cz + (rnd() - 0.5) * 50;
                if (inClearing(x, z)) continue;
                place(T.crystal, x, z, 3 + rnd() * 4, rnd() * 6, glow, 0.8 + rnd() * 0.3);
            }
        }
        if (decor.pylons && rnd() < decor.pylons) {
            const z = z0 + rnd() * TILE;
            [-1, 1].forEach((side) => {
                const x = side * (VALLEY_HALF - 40 - rnd() * 30);
                if (x < x0 || x > x0 + TILE || inClearing(x, z)) return;
                place(T.pylon, x, z, 3.2, 0, solid, 1);
                place(T.beaconLight, x, z, 3.2, 0, glow, 1);
            });
        }

        const meshes = [];
        const sg = solid.build();
        if (sg) {
            const m = new THREE.Mesh(sg, solidMat);
            m.castShadow = true;
            m.receiveShadow = true;
            scene.add(m);
            meshes.push(m);
        }
        const gg = glow.build();
        if (gg) {
            const m = new THREE.Mesh(gg, glowMat);
            scene.add(m);
            meshes.push(m);
        }
        return { tx, tz, meshes, colliders };
    }

    function streamTiles(focus, budget) {
        const ptx = Math.floor(focus.x / TILE), ptz = Math.floor(focus.z / TILE);
        W.tiles.forEach((tile, key) => {
            if (Math.abs(tile.tx - ptx) > TILE_RADIUS + 1 || Math.abs(tile.tz - ptz) > TILE_RADIUS + 1) {
                disposeTile(tile);
                W.tiles.delete(key);
            }
        });
        const missing = [];
        for (let dz = -TILE_RADIUS; dz <= TILE_RADIUS; dz++) {
            for (let dx = -TILE_RADIUS; dx <= TILE_RADIUS; dx++) {
                const key = `${ptx + dx},${ptz + dz}`;
                if (!W.tiles.has(key)) missing.push({ key, tx: ptx + dx, tz: ptz + dz, d: dx * dx + dz * dz });
            }
        }
        missing.sort((a, b) => a.d - b.d);
        for (let i = 0; i < missing.length && i < budget; i++) {
            const m = missing[i];
            W.tiles.set(m.key, buildTile(m.tx, m.tz));
        }
    }

    function update(delta, focus, cam) {
        if (!W.ready || !W.templates) return;
        W.time += delta;
        sky.position.copy(cam.position);
        sky.material.uniforms.uTime.value = W.time;
        groundUniforms.uTime.value = W.time;
        horizonGroup.position.set(cam.position.x, 0, cam.position.z);
        ground.position.set(Math.round(focus.x / 60) * 60, 0, Math.round(focus.z / 60) * 60);

        sun.position.copy(focus).addScaledVector(W.sunDir, 420);
        sun.target.position.copy(focus);
        // Snap the shadow camera to texels to avoid shimmering.
        const texel = (340 / sun.shadow.mapSize.x);
        sun.position.x = Math.round(sun.position.x / texel) * texel;
        sun.position.z = Math.round(sun.position.z / texel) * texel;
        sun.target.position.x = sun.position.x - W.sunDir.x * 420;
        sun.target.position.z = sun.position.z - W.sunDir.z * 420;

        streamTiles(focus, W.tiles.size === 0 ? 99 : 2);
        updateFlare(cam, delta);

        W.clouds.forEach((cloud) => {
            cloud.mesh.position.x += cloud.speed * delta;
            const dx = cloud.mesh.position.x - focus.x, dz = cloud.mesh.position.z - focus.z;
            if (dx * dx + dz * dz > 1150 * 1150) {
                const heading = Math.atan2(-(cam.position.x - focus.x), (cam.position.z - focus.z));
                placeCloud(cloud, focus, heading + (Math.random() - 0.5) * 2.4, 800 + Math.random() * 300);
            }
            const camDist = cloud.mesh.position.distanceTo(cam.position);
            cloud.mesh.material.opacity = THREE.MathUtils.clamp((camDist - 25) / 90, 0, 0.95);
            cloud.mesh.visible = cloud.mesh.material.opacity > 0.02;
        });
    }


    // ---------- lens flare (DOM overlay, occlusion by raycast) ----------
    const flare = { root: null, parts: [], visibility: 0, target: 0, frame: 0, ray: new THREE.Raycaster() };
    const FLARE_PARTS = [
        { t: 0, size: 320, cls: "core" },
        { t: 0, size: 620, cls: "streak" },
        { t: 0.32, size: 46, cls: "ghost g1" },
        { t: 0.58, size: 22, cls: "ghost g2" },
        { t: 0.86, size: 90, cls: "ring" },
        { t: 1.18, size: 34, cls: "ghost g3" },
        { t: 1.45, size: 150, cls: "ring faint" },
        { t: 1.75, size: 18, cls: "ghost g1" }
    ];
    function buildFlare() {
        const style = document.createElement("style");
        style.textContent = `
            #lens-flare { position: absolute; inset: 0; pointer-events: none; z-index: 1; mix-blend-mode: screen; overflow: hidden; }
            #lens-flare span { position: absolute; border-radius: 50%; transform: translate(-50%, -50%); will-change: left, top, opacity; }
            #lens-flare .core { background: radial-gradient(circle, rgba(255,250,235,0.85) 0%, rgba(255,230,180,0.35) 18%, rgba(255,200,140,0.08) 45%, rgba(255,200,140,0) 70%); }
            #lens-flare .streak { height: 6px !important; border-radius: 6px; background: linear-gradient(90deg, rgba(255,220,180,0) 0%, rgba(255,235,210,0.55) 50%, rgba(255,220,180,0) 100%); }
            #lens-flare .ghost { background: radial-gradient(circle, rgba(170,220,255,0.28) 0%, rgba(170,220,255,0.12) 60%, rgba(170,220,255,0) 72%); }
            #lens-flare .ghost.g2 { background: radial-gradient(circle, rgba(255,190,120,0.32) 0%, rgba(255,190,120,0) 70%); }
            #lens-flare .ghost.g3 { background: radial-gradient(circle, rgba(160,255,200,0.22) 0%, rgba(160,255,200,0) 70%); }
            #lens-flare .ring { background: radial-gradient(circle, rgba(255,255,255,0) 58%, rgba(200,230,255,0.16) 66%, rgba(255,210,170,0.1) 72%, rgba(255,255,255,0) 78%); }
            #lens-flare .ring.faint { opacity: 0.6; }
        `;
        document.head.appendChild(style);
        flare.root = document.createElement("div");
        flare.root.id = "lens-flare";
        FLARE_PARTS.forEach((def) => {
            const el = document.createElement("span");
            el.className = def.cls;
            el.style.width = `${def.size}px`;
            el.style.height = `${def.size}px`;
            flare.root.appendChild(el);
            flare.parts.push({ el, def });
        });
        const host = document.getElementById("ui-layer") || document.body;
        host.insertBefore(flare.root, host.firstChild);
    }

    const flareTmp = new THREE.Vector3();
    function updateFlare(cam, delta) {
        if (!flare.root) buildFlare();
        const sunPos = flareTmp.copy(cam.position).addScaledVector(W.sunDir, 1000);
        const ndc = sunPos.clone().project(cam);
        const onScreen = ndc.z < 1 && Math.abs(ndc.x) < 1.25 && Math.abs(ndc.y) < 1.25;
        flare.frame += 1;
        if (onScreen && flare.frame % 4 === 0) {
            flare.ray.set(cam.position, W.sunDir);
            flare.ray.far = 1600;
            const targets = [];
            W.tiles.forEach((tile) => tile.meshes.forEach((m) => targets.push(m)));
            horizonGroup.children.forEach((m) => targets.push(m));
            W.clouds.forEach((c) => { if (c.mesh.visible) targets.push(c.mesh); });
            const hits = flare.ray.intersectObjects(targets, false);
            flare.target = hits.length ? (hits[0].object.material === cloudMat || W.clouds.some((c) => c.mesh === hits[0].object) ? 0.25 : 0) : 1;
        } else if (!onScreen) {
            flare.target = 0;
        }
        const edge = onScreen ? THREE.MathUtils.clamp(1.25 - Math.max(Math.abs(ndc.x), Math.abs(ndc.y)), 0, 0.5) * 2 : 0;
        flare.visibility += (flare.target * edge - flare.visibility) * Math.min(1, delta * 6);
        const strength = flare.visibility * (W.pal.stars ? 0.45 : 1) * (W.sunDir.y > 0 ? 1 : 0);
        flare.root.style.display = strength > 0.01 ? "block" : "none";
        if (strength <= 0.01) return;
        const w = window.innerWidth, h = window.innerHeight;
        const sx = (ndc.x * 0.5 + 0.5) * w, sy = (-ndc.y * 0.5 + 0.5) * h;
        const cx = w / 2, cy = h / 2;
        flare.parts.forEach(({ el, def }) => {
            el.style.left = `${sx + (cx - sx) * def.t}px`;
            el.style.top = `${sy + (cy - sy) * def.t}px`;
            el.style.opacity = (def.cls === "core" || def.cls === "streak" ? strength : strength * 0.85).toFixed(3);
        });
    }

    function checkCollision(pos) {
        if (!W.ready) return null;
        const ptx = Math.floor(pos.x / TILE), ptz = Math.floor(pos.z / TILE);
        for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tile = W.tiles.get(`${ptx + dx},${ptz + dz}`);
                if (!tile) continue;
                for (const c of tile.colliders) {
                    if (pos.y > c.h) continue;
                    const d = Math.hypot(pos.x - c.x, pos.z - c.z);
                    const allowed = c.type === "mesa" ? c.r : c.r * (1 - pos.y / c.h);
                    if (d < allowed) return c.type === "mesa" ? "COLISION CON MESETA" : "COLISION CON MONTAÑA";
                }
            }
        }
        return null;
    }

    // Smallest horizontal clearance between pos and any nearby terrain collider
    // (negative = inside). Used for near-miss style bonuses.
    function probeClearance(pos) {
        if (!W.ready) return Infinity;
        let best = Infinity;
        const ptx = Math.floor(pos.x / TILE), ptz = Math.floor(pos.z / TILE);
        for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tile = W.tiles.get(`${ptx + dx},${ptz + dz}`);
                if (!tile) continue;
                for (const c of tile.colliders) {
                    if (pos.y > c.h + 6) continue;
                    const d = Math.hypot(pos.x - c.x, pos.z - c.z);
                    const allowed = c.type === "mesa" ? c.r : c.r * Math.max(0, 1 - pos.y / c.h);
                    best = Math.min(best, d - allowed);
                }
            }
        }
        return best;
    }

    function addClearing(x, z, r) {
        W.clearings.push({ x, z, r });
        W.tiles.forEach((tile, key) => {
            const cx = tile.tx * TILE + TILE / 2, cz = tile.tz * TILE + TILE / 2;
            if (Math.abs(cx - x) < r + TILE && Math.abs(cz - z) < r + TILE) {
                disposeTile(tile);
                W.tiles.delete(key);
            }
        });
    }

    function reset() {
        W.clearings = [];
        clearTiles();
    }

    // Detail presets: radius 4 (~1 km) on high, 3 (~0.8 km) with closer fog on low.
    function setDetail(level) {
        TILE_RADIUS = level === "low" ? 3 : 4;
        fogScale = level === "low" ? 0.78 : 1;
        if (W.pal && scene.fog) {
            scene.fog.near = W.pal.fogNear * fogScale;
            scene.fog.far = W.pal.fogFar * fogScale;
        }
    }

    function getPalette() {
        return W.pal;
    }

    window.WorldGfx = { init, applyTheme, update, setDetail, checkCollision, probeClearance, addClearing, reset, riverX, getPalette, VALLEY_HALF };
})();
