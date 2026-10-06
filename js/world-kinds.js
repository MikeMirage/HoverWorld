// HoverWorld - Extra world kinds and decor kits.
// Registers caves/tunnels, sky worlds, toy-scale interiors, cities with landmarks
// and valley decor kits (war zone, pyramids, temples, castles, ocean, synthwave)
// into WorldGfx. Geometry is merged per tile; colliders are simple primitives.
(function () {
    const G = window.WorldGfx;
    if (!G) return;
    const H = {};

    // ---------- small geometry helpers (filled once WorldGfx hands us its helpers) ----------
    function unitBox(color, shadeAmt = 0.18) {
        const g = new THREE.BoxGeometry(1, 1, 1);
        g.translate(0, 0.5, 0);
        return H.tpl(g, (c, n) => H.shade(H.C(color), n, shadeAmt).multiplyScalar(Math.abs(n.x) > 0.5 ? 0.88 : 1));
    }
    function unitCyl(color, segs = 10, top = 1, bottom = 1) {
        const g = new THREE.CylinderGeometry(top, bottom, 1, segs);
        g.translate(0, 0.5, 0);
        return H.tpl(g, (c, n) => H.shade(H.C(color), n, 0.25));
    }
    function unitCone(color, segs = 8) {
        const g = new THREE.ConeGeometry(1, 1, segs);
        g.translate(0, 0.5, 0);
        return H.tpl(g, (c, n) => H.shade(H.C(color), n, 0.3));
    }
    function unitSphere(color, detail = 1) {
        const g = new THREE.IcosahedronGeometry(1, detail);
        return H.tpl(g, (c, n) => H.shade(H.C(color), n, 0.3));
    }
    function part(template, matrixFn) { return { template, matrixFn }; }
    // Compose several transformed templates into one template.
    function compose(list) {
        const out = [];
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
        list.forEach(({ t, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0] }) => {
            e.set(rot[0], rot[1], rot[2]);
            q.setFromEuler(e);
            p.set(pos[0], pos[1], pos[2]);
            sc.set(scale[0], scale[1], scale[2]);
            m.compose(p, q, sc);
            const g = t.clone();
            g.applyMatrix4(m);
            out.push(g);
        });
        return H.combine(out);
    }

    // =====================================================================
    // Landmarks
    // =====================================================================
    function buildLandmarks(pal) {
        const L = {};
        const iron = unitBox(0x5a4a3a), ironDark = unitBox(0x3a3028);
        // Eiffel tower (~220 m): four splayed legs, two decks, tapering spire.
        {
            const parts = [];
            [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
                for (let k = 0; k < 6; k++) {
                    const y = k * 10;
                    const off = 36 - k * 4.2;
                    parts.push({ t: iron, pos: [sx * off, y, sz * off], scale: [7 - k * 0.6, 10.5, 7 - k * 0.6], rot: [sz * 0.12, 0, -sx * 0.12] });
                }
            });
            parts.push({ t: ironDark, pos: [0, 58, 0], scale: [56, 4, 56] });
            for (let k = 0; k < 10; k++) {
                const y = 62 + k * 9;
                const w = 30 - k * 2.2;
                parts.push({ t: iron, pos: [0, y, 0], scale: [w, 9.2, w] });
            }
            parts.push({ t: ironDark, pos: [0, 120, 0], scale: [22, 3, 22] });
            for (let k = 0; k < 8; k++) {
                const y = 123 + k * 11;
                const w = 9 - k * 1.0;
                parts.push({ t: iron, pos: [0, y, 0], scale: [Math.max(1.4, w), 11.2, Math.max(1.4, w)] });
            }
            parts.push({ t: unitCyl(0xd8d0c0, 6), pos: [0, 211, 0], scale: [0.6, 14, 0.6] });
            L.eiffel = { template: compose(parts), colliders: (x, z) => [
                ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => ({ type: "cyl", x: x + sx * 30, z: z + sz * 30, r: 9, y0: 0, y1: 60, label: "CHOQUE CON LA TORRE EIFFEL" })),
                { type: "cyl", x, z, r: 18, y0: 56, y1: 122, label: "CHOQUE CON LA TORRE EIFFEL" },
                { type: "cyl", x, z, r: 7, y0: 120, y1: 230, label: "CHOQUE CON LA TORRE EIFFEL" }
            ] };
        }
        // Burj Khalifa (~420 m stepped spire).
        {
            const glass = unitBox(0xb8c8d8, 0.25), steel = unitBox(0x8a96a4);
            const parts = [];
            const tiers = [[34, 70], [28, 60], [22, 60], [17, 55], [12, 50], [8, 45], [5, 40]];
            let y = 0;
            tiers.forEach(([w, h], i) => {
                parts.push({ t: i % 2 ? steel : glass, pos: [0, y, 0], scale: [w, h, w * 0.8] });
                parts.push({ t: glass, pos: [w * 0.45, y, -w * 0.3], scale: [w * 0.6, h * 0.9, w * 0.5] });
                y += h;
            });
            parts.push({ t: unitCyl(0xdfe6ee, 6, 0.4, 1.4), pos: [0, y, 0], scale: [1, 60, 1] });
            L.burj = { template: compose(parts), colliders: (x, z) => [{ type: "cyl", x, z, r: 30, y0: 0, y1: 480, label: "CHOQUE CON EL BURJ KHALIFA" }] };
        }
        // Oriental Pearl tower (spheres on columns).
        {
            const pink = unitSphere(0xe0508a, 1), col = unitCyl(0xd8d8e0, 10);
            const parts = [];
            [[-1, 0], [0.5, 0.86], [0.5, -0.86]].forEach(([cx, cz]) => parts.push({ t: col, pos: [cx * 14, 0, cz * 14], scale: [3.5, 80, 3.5] }));
            parts.push({ t: pink, pos: [0, 80, 0], scale: [26, 26, 26] });
            parts.push({ t: col, pos: [0, 100, 0], scale: [5, 110, 5] });
            parts.push({ t: pink, pos: [0, 200, 0], scale: [15, 15, 15] });
            parts.push({ t: pink, pos: [0, 240, 0], scale: [6, 6, 6] });
            parts.push({ t: unitCyl(0xe8e8f0, 6, 0.3, 1.2), pos: [0, 246, 0], scale: [1, 50, 1] });
            L.pearl = { template: compose(parts), colliders: (x, z) => [
                { type: "cyl", x, z, r: 24, y0: 0, y1: 110, label: "CHOQUE CON LA PERLA ORIENTAL" },
                { type: "cyl", x, z, r: 15, y0: 110, y1: 300, label: "CHOQUE CON LA PERLA ORIENTAL" }] };
        }
        // Shanghai Tower: twisted stack.
        {
            const glass = unitBox(0x8fb4cc, 0.2);
            const parts = [];
            for (let k = 0; k < 18; k++) parts.push({ t: glass, pos: [0, k * 20, 0], scale: [32 - k * 1.1, 20.5, 32 - k * 1.1], rot: [0, k * 0.09, 0] });
            L.shanghaiTower = { template: compose(parts), colliders: (x, z) => [{ type: "cyl", x, z, r: 24, y0: 0, y1: 370, label: "CHOQUE CON LA TORRE DE SHANGHÁI" }] };
        }
        // Tokyo tower (red/white lattice, Eiffel-like).
        {
            const red = unitBox(0xd8402c), white = unitBox(0xf0ece4);
            const parts = [];
            [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
                for (let k = 0; k < 5; k++) parts.push({ t: k % 2 ? white : red, pos: [sx * (24 - k * 3.6), k * 10, sz * (24 - k * 3.6)], scale: [5, 10.5, 5] });
            });
            for (let k = 0; k < 14; k++) parts.push({ t: k % 2 ? white : red, pos: [0, 50 + k * 10, 0], scale: [22 - k * 1.4, 10.4, 22 - k * 1.4] });
            parts.push({ t: unitBox(0x3a4450), pos: [0, 96, 0], scale: [26, 6, 26] });
            L.tokyoTower = { template: compose(parts), colliders: (x, z) => [
                ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => ({ type: "cyl", x: x + sx * 20, z: z + sz * 20, r: 7, y0: 0, y1: 50, label: "CHOQUE CON LA TORRE DE TOKIO" })),
                { type: "cyl", x, z, r: 14, y0: 48, y1: 200, label: "CHOQUE CON LA TORRE DE TOKIO" }] };
        }
        // Empire State style art-deco tower.
        {
            const stone = unitBox(0xbdb6a6), dark = unitBox(0x7a7468);
            const parts = [
                { t: stone, pos: [0, 0, 0], scale: [60, 40, 46] },
                { t: stone, pos: [0, 40, 0], scale: [44, 120, 34] },
                { t: dark, pos: [0, 160, 0], scale: [30, 40, 24] },
                { t: stone, pos: [0, 200, 0], scale: [18, 30, 16] },
                { t: unitCyl(0xd8d2c4, 8, 2, 5), pos: [0, 230, 0], scale: [1, 26, 1] },
                { t: unitCyl(0xe8e8e8, 6, 0.3, 0.8), pos: [0, 256, 0], scale: [1, 36, 1] }
            ];
            L.empire = { template: compose(parts), colliders: (x, z) => [{ type: "box", x, z, hw: 32, hd: 25, y0: 0, y1: 300, label: "CHOQUE CON EL EMPIRE STATE" }] };
        }
        // Venice campanile + domed basilica.
        {
            const brick = unitBox(0xb0563a), stone = unitBox(0xe6dcc4), dome = unitSphere(0x8aa6a0, 1);
            const parts = [
                { t: brick, pos: [0, 0, 0], scale: [14, 70, 14] },
                { t: stone, pos: [0, 70, 0], scale: [16, 14, 16] },
                { t: unitCone(0x6a8a80, 4), pos: [0, 84, 0], scale: [10, 26, 10], rot: [0, Math.PI / 4, 0] },
                { t: stone, pos: [50, 0, 0], scale: [60, 30, 46] },
                { t: dome, pos: [50, 34, 0], scale: [14, 12, 14] },
                { t: dome, pos: [30, 30, 0], scale: [9, 8, 9] },
                { t: dome, pos: [70, 30, 0], scale: [9, 8, 9] }
            ];
            L.campanile = { template: compose(parts), colliders: (x, z) => [
                { type: "box", x, z, hw: 8, hd: 8, y0: 0, y1: 110, label: "CHOQUE CON EL CAMPANILE" },
                { type: "box", x: x + 50, z, hw: 31, hd: 24, y0: 0, y1: 48, label: "CHOQUE CON SAN MARCOS" }] };
        }
        // Rio: Sugarloaf-like hill with Christ statue.
        {
            const rock = H.tpl((() => { const g = new THREE.SphereGeometry(1, 12, 10); g.scale(1, 1.6, 1); g.translate(0, 0.6, 0); return g; })(), (c, n) => (n.y > 0.75 ? H.C(0x3f8a3c) : H.shade(H.C(0x6a6458), n, 0.3)));
            const stoneW = unitBox(0xf0ece4);
            const parts = [
                { t: rock, pos: [0, 0, 0], scale: [70, 90, 70] },
                { t: stoneW, pos: [0, 232, 0], scale: [4, 22, 4] },
                { t: stoneW, pos: [0, 248, 0], scale: [26, 3.5, 3.5] },
                { t: unitSphere(0xf0ece4, 0), pos: [0, 257, 0], scale: [2.6, 2.6, 2.6] }
            ];
            L.cristo = { template: compose(parts), colliders: (x, z) => [{ type: "cone", x, z, r: 72, h: 240, label: "CHOQUE CON EL CORCOVADO" }] };
        }
        // Great pyramid.
        {
            const g = new THREE.ConeGeometry(1, 1, 4);
            g.translate(0, 0.5, 0);
            g.rotateY(Math.PI / 4);
            L.pyramid = { template: H.tpl(g, (c, n) => H.shade(H.C(0xd9b27a), n, 0.35).multiplyScalar(0.95 + Math.sin(c.y * 60) * 0.05)) };
        }
        // Mayan step temple.
        {
            const stone = unitBox(0x8a9478), moss = unitBox(0x4a7a3c);
            const parts = [];
            for (let k = 0; k < 6; k++) parts.push({ t: k % 2 ? moss : stone, pos: [0, k * 9, 0], scale: [90 - k * 13, 9, 90 - k * 13] });
            parts.push({ t: stone, pos: [0, 54, 0], scale: [16, 14, 16] });
            parts.push({ t: unitBox(0xb8c0a0), pos: [0, 0, 44], scale: [14, 54, 10], rot: [-0.7, 0, 0] });
            L.temple = { template: compose(parts) };
        }
        // Castle: curtain wall with corner towers and keep.
        {
            const stone = unitBox(0x9a968c), roof = unitCone(0x3a4a7a, 8), towerT = unitCyl(0x8a8678, 10);
            const parts = [
                { t: stone, pos: [0, 0, -40], scale: [90, 22, 6] }, { t: stone, pos: [0, 0, 40], scale: [90, 22, 6] },
                { t: stone, pos: [-45, 0, 0], scale: [6, 22, 86] }, { t: stone, pos: [45, 0, 0], scale: [6, 22, 86] },
                { t: stone, pos: [0, 0, 0], scale: [30, 46, 30] }, { t: roof, pos: [0, 46, 0], scale: [22, 20, 22] }
            ];
            [[-45, -40], [45, -40], [-45, 40], [45, 40]].forEach(([x, z]) => {
                parts.push({ t: towerT, pos: [x, 0, z], scale: [8, 34, 8] });
                parts.push({ t: roof, pos: [x, 34, z], scale: [10, 16, 10] });
            });
            L.castle = { template: compose(parts) };
        }
        return L;
    }

    // =====================================================================
    // Shared decor templates per kind
    // =====================================================================
    function buildDecorTemplates(pal, decor) {
        const T = {};
        T.box = [0, 1, 2, 3, 4, 5].map((i) => unitBox((decor.buildingColors || [0xc8c0b0, 0xa8b0bc, 0xd8c8a8, 0x9aa4b0, 0xb8a090, 0xe0d8c8])[i % (decor.buildingColors || [1, 2, 3, 4, 5, 6]).length]));
        T.roofBox = unitBox(decor.roofColor || 0x5a5e66);
        T.glowBox = unitBox(0xffffff, 0);
        T.neon = (decor.neonColors || [0xff3aa0, 0x3affe0, 0xffd23a]).map((c) => unitBox(c, 0));
        T.cyl = unitCyl(pal.rock);
        T.rockSphere = unitSphere(pal.rock, 1);
        T.crystal = (() => {
            const parts = [];
            [[0, 0, 1, 0], [0.7, 0.2, 0.6, 0.4], [-0.6, -0.3, 0.7, -0.35]].forEach(([x, z, s, tilt]) => {
                const g = new THREE.OctahedronGeometry(0.6, 0);
                g.scale(s, s * 3.2, s); g.rotateZ(tilt); g.translate(x, s * 1.6, z);
                parts.push(H.tpl(g, (c, n) => H.C(pal.glow ?? pal.water).multiplyScalar(0.7 + 0.3 * Math.abs(n.x))));
            });
            return H.combine(parts);
        })();
        T.stalactite = (() => { const g = new THREE.ConeGeometry(1, 1, 6); g.rotateX(Math.PI); g.translate(0, -0.5, 0); return H.tpl(g, (c, n) => H.shade(H.C(pal.rock), n, 0.35).lerp(H.C(pal.snow), c.y > -0.3 ? 0.4 : 0)); })();
        T.stalagmite = (() => { const g = new THREE.ConeGeometry(1, 1, 6); g.translate(0, 0.5, 0); return H.tpl(g, (c, n) => H.shade(H.C(pal.rock), n, 0.35)); })();
        return T;
    }

    // =====================================================================
    // Kind: cave / tunnel (ice cave, volcano core, enemy base)
    // =====================================================================
    function caveLane(z, decor) {
        const s = decor.straight ? 0.25 : 1;
        return {
            x: (Math.sin(z * 0.0016) * 90 + Math.sin(z * 0.0041 + 1.0) * 35) * s,
            halfWidth: (decor.width || 95) + Math.sin(z * 0.0031) * 22,
            ceiling: (decor.ceiling || 85) + Math.sin(z * 0.0025 + 2.0) * 18,
            enclosed: true
        };
    }

    // One wall/ceiling slice between z and z+dz, pushed into builder as raw triangles.
    function pushQuad(builder, a, b, c, d, color) {
        // Both windings so the enclosure reads from either side.
        const tris = [a, b, c, a, c, d, a, c, b, a, d, c];
        for (const p of tris) {
            builder.p.push(p[0], p[1], p[2]);
            builder.c.push(color.r, color.g, color.b);
        }
    }

    G.registerKind("cave", {
        enclosed: true,
        noSunShadow: true,
        horizon: "none",
        wallLabel: "CHOQUE CON LA PARED",
        ceilingLabel: "CHOQUE CON EL TECHO",
        lane: caveLane,
        buildTemplates(pal, decor, helpers) { Object.assign(H, helpers); return buildDecorTemplates(pal, decor); },
        buildTile(ctx) {
            const { tx, z0, TILE, builders, colliders, rnd, decor, pal, placeFull, T } = ctx;
            const step = 12;
            const wallA = H.C(pal.rock), wallB = H.C(pal.rockDark), ceilC = H.C(decor.ceilingColor || pal.rockDark);
            for (let z = z0; z < z0 + TILE; z += step) {
                const L0 = caveLane(z, decor), L1 = caveLane(z + step, decor);
                if (Math.floor(L0.x / TILE) !== tx) continue;
                const rows = 5;
                [-1, 1].forEach((side) => {
                    for (let r = 0; r < rows; r++) {
                        const y0 = (r / rows), y1 = ((r + 1) / rows);
                        const bump = (zz, yy) => (H.vnoise(zz * 0.05, yy * 6 + side * 9, 4) - 0.5) * 18;
                        const xa = L0.x + side * (L0.halfWidth + 4) + side * bump(z, y0), xb = L1.x + side * (L1.halfWidth + 4) + side * bump(z + step, y0);
                        const xc = L1.x + side * (L1.halfWidth + 4) + side * bump(z + step, y1), xd = L0.x + side * (L0.halfWidth + 4) + side * bump(z, y1);
                        const ya0 = y0 * (L0.ceiling + 6), yb0 = y0 * (L1.ceiling + 6), yb1 = y1 * (L1.ceiling + 6), ya1 = y1 * (L0.ceiling + 6);
                        const col = (r % 2 ? wallA : wallB).clone().multiplyScalar(0.8 + H.vnoise(z * 0.02, r, 2) * 0.35);
                        pushQuad(builders.ceil, [xa, ya0, z], [xb, yb0, z + step], [xc, yb1, z + step], [xd, ya1, z], col);
                    }
                });
                // Ceiling: three strips across with a slight vault.
                const cols = 4;
                for (let k = 0; k < cols; k++) {
                    const u0 = k / cols, u1 = (k + 1) / cols;
                    const vault = (u) => Math.sin(u * Math.PI) * 10;
                    const xa = THREE.MathUtils.lerp(L0.x - L0.halfWidth - 4, L0.x + L0.halfWidth + 4, u0);
                    const xb = THREE.MathUtils.lerp(L1.x - L1.halfWidth - 4, L1.x + L1.halfWidth + 4, u0);
                    const xc = THREE.MathUtils.lerp(L1.x - L1.halfWidth - 4, L1.x + L1.halfWidth + 4, u1);
                    const xd = THREE.MathUtils.lerp(L0.x - L0.halfWidth - 4, L0.x + L0.halfWidth + 4, u1);
                    const col = ceilC.clone().multiplyScalar(0.75 + H.vnoise(z * 0.03, k, 7) * 0.4);
                    pushQuad(builders.ceil, [xa, L0.ceiling + 6 + vault(u0), z], [xb, L1.ceiling + 6 + vault(u0), z + step], [xc, L1.ceiling + 6 + vault(u1), z + step], [xd, L0.ceiling + 6 + vault(u1), z], col);
                }
                // Decor + obstacles inside the tunnel.
                if (rnd() < (decor.stalactites ?? 0.35)) {
                    const x = L0.x + (rnd() - 0.5) * L0.halfWidth * 1.6;
                    const len = 12 + rnd() * (L0.ceiling * 0.45);
                    const r = 3 + rnd() * 5;
                    placeFull(T.stalactite, x, L0.ceiling + 6, z, r, len, r, rnd() * 6, builders.solid);
                    colliders.push({ type: "icone", x, z, r: r * 0.85, y0: L0.ceiling + 6 - len, y1: L0.ceiling + 6, label: decor.stalactiteLabel || "CHOQUE CON UNA ESTALACTITA" });
                }
                if (rnd() < (decor.stalagmites ?? 0.25)) {
                    const side = rnd() < 0.5 ? -1 : 1;
                    const x = L0.x + side * (20 + rnd() * (L0.halfWidth - 30));
                    const h = 10 + rnd() * 30, r = 4 + rnd() * 5;
                    placeFull(T.stalagmite, x, 0, z, r, h, r, rnd() * 6, builders.solid);
                    colliders.push({ type: "cone", x, z, r, h, label: decor.stalagmiteLabel || "CHOQUE CON UNA ROCA" });
                }
                if (rnd() < (decor.glowDensity ?? 0.5)) {
                    const side = rnd() < 0.5 ? -1 : 1;
                    const x = L0.x + side * (L0.halfWidth - 2 - rnd() * 8);
                    const y = rnd() < 0.5 ? 0 : rnd() * L0.ceiling * 0.7;
                    const sc = 2 + rnd() * 4;
                    placeFull(T.crystal, x, y, z, sc, sc, sc, rnd() * 6, builders.glow, 1, 0, side * 0.6);
                }
                if (decor.lights && Math.floor(z / step) % 6 === 0) {
                    [-1, 1].forEach((side) => placeFull(T.glowBox, L0.x + side * (L0.halfWidth - 1), L0.ceiling * 0.55, z, 1.2, 1.2, 10, 0, builders.glow));
                    placeFull(T.glowBox, L0.x, L0.ceiling + 4, z, 30, 0.6, 2, 0, builders.glow);
                }
            }
        }
    });

    // =====================================================================
    // Kind: sky (sea of clouds / orbit)
    // =====================================================================
    G.registerKind("sky", {
        horizon: "none",
        lane: () => ({ x: 0, halfWidth: 230, ceiling: 150, enclosed: false }),
        buildTemplates(pal, decor, helpers) {
            Object.assign(H, helpers);
            const T = buildDecorTemplates(pal, decor);
            // Floating island: inverted rocky cone with a grassy cap and a little tree.
            const rock = (() => { const g = new THREE.ConeGeometry(1, 1.4, 9, 3); g.rotateX(Math.PI); g.translate(0, -0.7, 0);
                const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const n = H.vnoise(pos.getX(i) * 3, pos.getY(i) * 3 + pos.getZ(i) * 3, 3); pos.setX(i, pos.getX(i) * (0.8 + n * 0.4)); pos.setZ(i, pos.getZ(i) * (0.8 + n * 0.4)); }
                return H.tpl(g, (c, n) => H.shade(H.C(pal.rock), n, 0.35)); })();
            const cap = (() => { const g = new THREE.CylinderGeometry(1.02, 1, 0.18, 9); return H.tpl(g, (c, n) => H.shade(H.C(decor.capColor || pal.foliage), n, 0.25)); })();
            T.island = compose([{ t: rock, pos: [0, 0, 0] }, { t: cap, pos: [0, 0.05, 0] }, { t: unitSphere(pal.foliageAlt || pal.foliage, 0), pos: [0.3, 0.45, 0.2], scale: [0.25, 0.32, 0.25] }, { t: unitCyl(pal.trunk || 0x6b4a33, 5), pos: [0.3, 0.1, 0.2], scale: [0.04, 0.25, 0.04] }]);
            T.asteroid = (() => { const g = new THREE.DodecahedronGeometry(1, 1); const pos = g.attributes.position;
                for (let i = 0; i < pos.count; i++) { const n = H.vnoise(pos.getX(i) * 2.2, pos.getY(i) * 2.2 + pos.getZ(i) * 2, 9); pos.setXYZ(i, pos.getX(i) * (0.75 + n * 0.5), pos.getY(i) * (0.75 + n * 0.5), pos.getZ(i) * (0.75 + n * 0.5)); }
                return H.tpl(g, (c, n) => H.shade(H.C(pal.rock), n, 0.4)); })();
            T.module = compose([{ t: unitCyl(0xd8dce4, 12), pos: [0, -0.5, 0], scale: [1, 1, 1], rot: [Math.PI / 2, 0, 0] },
                { t: unitBox(0x2a4a8a, 0.1), pos: [2.2, -0.05, 0], scale: [3, 0.1, 1.4] }, { t: unitBox(0x2a4a8a, 0.1), pos: [-2.2, -0.05, 0], scale: [3, 0.1, 1.4] }]);
            // Unlit puffs shaded by normal so they read as soft clouds, not grey boulders.
            T.cloudPillar = (() => { const g = new THREE.IcosahedronGeometry(1, 2); const lo = H.C(decor.space ? 0x8a8a9a : 0xd6e2f2), hi = H.C(0xffffff);
                return H.tpl(g, (c, n) => lo.clone().lerp(hi, THREE.MathUtils.clamp(n.y * 0.6 + 0.55 + n.z * 0.1, 0, 1))); })();
            return T;
        },
        buildTile(ctx) {
            const { x0, z0, TILE, builders, colliders, rnd, decor, placeFull, T, inClearing } = ctx;
            const n = decor.space ? 3 + Math.floor(rnd() * 4) : 1 + Math.floor(rnd() * 3);
            for (let i = 0; i < n; i++) {
                const x = x0 + rnd() * TILE, z = z0 + rnd() * TILE;
                if (inClearing(x, z, 30)) continue;
                if (decor.space) {
                    const r = 6 + rnd() * 22, y = 20 + rnd() * 120;
                    placeFull(T.asteroid, x, y, z, r, r * (0.7 + rnd() * 0.5), r, rnd() * 6, builders.solid, 1, rnd() * 3, rnd() * 3);
                    colliders.push({ type: "cyl", x, z, r: r * 0.85, y0: y - r * 0.8, y1: y + r * 0.8, label: "CHOQUE CON UN ASTEROIDE" });
                } else {
                    const r = 18 + rnd() * 30, y = 30 + rnd() * 90;
                    if (Math.abs(x) < 40 && rnd() < 0.6) continue;
                    placeFull(T.island, x, y, z, r, r, r, rnd() * 6, builders.solid);
                    colliders.push({ type: "cyl", x, z, r: r * 0.9, y0: y - r * 1.2, y1: y + 6, label: "CHOQUE CON UNA ISLA FLOTANTE" });
                }
            }
            if (decor.space && rnd() < 0.25) {
                const x = x0 + rnd() * TILE, z = z0 + rnd() * TILE, y = 60 + rnd() * 60;
                placeFull(T.module, x, y, z, 6, 6, 18, rnd() * 6, builders.solid);
                colliders.push({ type: "cyl", x, z, r: 14, y0: y - 8, y1: y + 8, label: "CHOQUE CON LA ESTACIÓN" });
            }
            if (!decor.space) {
                // Soft cloud towers to weave through (no collision).
                const c = Math.floor(rnd() * 3);
                for (let i = 0; i < c; i++) {
                    const x = x0 + rnd() * TILE, z = z0 + rnd() * TILE, base = rnd() * 20;
                    for (let k = 0; k < 4; k++) placeFull(T.cloudPillar, x + (rnd() - 0.5) * 20, base + k * 22, z + (rnd() - 0.5) * 20, 22 - k * 3, 16, 22 - k * 3, 0, builders.glow);
                }
            }
        }
    });

    // =====================================================================
    // Kind: interior (giant house / toy factory) - toy-scale furniture
    // =====================================================================
    function interiorLane() { return { x: 0, halfWidth: 255, ceiling: 172, enclosed: true }; }
    G.registerKind("interior", {
        enclosed: true,
        noSunShadow: true,
        horizon: "none",
        wallLabel: "CHOQUE CON LA PARED",
        ceilingLabel: "CHOQUE CON EL TECHO",
        lane: interiorLane,
        buildTemplates(pal, decor, helpers) {
            Object.assign(H, helpers);
            const T = buildDecorTemplates(pal, decor);
            const wood = unitBox(0x9a6a3a), woodDark = unitBox(0x6a4424), fabric = unitBox(decor.fabric || 0x3a6aa8), fabric2 = unitBox(decor.fabric2 || 0xc84a3a);
            T.table = compose([{ t: wood, pos: [0, 36, 0], scale: [110, 4, 70] }, ...[[-50, -30], [50, -30], [-50, 30], [50, 30]].map(([x, z]) => ({ t: woodDark, pos: [x, 0, z], scale: [5, 36, 5] }))]);
            T.chair = compose([{ t: wood, pos: [0, 22, 0], scale: [24, 3, 24] }, { t: wood, pos: [0, 25, -11], scale: [24, 30, 3] }, ...[[-10, -10], [10, -10], [-10, 10], [10, 10]].map(([x, z]) => ({ t: woodDark, pos: [x, 0, z], scale: [3, 22, 3] }))]);
            T.sofa = compose([{ t: fabric, pos: [0, 0, 0], scale: [120, 22, 45] }, { t: fabric, pos: [0, 22, -18], scale: [120, 30, 10] }, { t: fabric, pos: [-58, 22, 0], scale: [10, 14, 45] }, { t: fabric, pos: [58, 22, 0], scale: [10, 14, 45] }]);
            T.shelf = compose([{ t: woodDark, pos: [0, 0, 0], scale: [80, 140, 4] }, ...[0, 35, 70, 105, 138].map((y) => ({ t: wood, pos: [0, y, 10], scale: [80, 3, 22] })),
                ...[0, 1, 2, 3].map((k) => ({ t: [fabric, fabric2, unitBox(0x3a8a5a), unitBox(0xd8b040)][k], pos: [-30 + k * 18, 3 + k * 35, 12], scale: [12, 26, 18] }))]);
            T.blocks = compose([{ t: unitBox(0xd8402c), pos: [0, 0, 0], scale: [14, 14, 14] }, { t: unitBox(0x2f6ad8), pos: [15, 0, 2], scale: [14, 14, 14] }, { t: unitBox(0xf2c23a), pos: [7, 14, 1], scale: [14, 14, 14], rot: [0, 0.4, 0] }, { t: unitBox(0x3aa84a), pos: [7, 28, 0], scale: [12, 12, 12], rot: [0, -0.3, 0] }]);
            T.duck = compose([{ t: unitSphere(0xf8d23a, 1), pos: [0, 9, 0], scale: [13, 9, 10] }, { t: unitSphere(0xf8d23a, 1), pos: [-9, 21, 0], scale: [7, 7, 7] }, { t: unitBox(0xf0802a), pos: [-17, 20, 0], scale: [6, 2, 4] }]);
            T.ball = unitSphere(0xe84a8a, 2);
            T.lamp = compose([{ t: unitCyl(0x8a8a8a, 10), pos: [0, 0, 0], scale: [14, 3, 14] }, { t: unitCyl(0x8a8a8a, 6), pos: [0, 3, 0], scale: [1.4, 110, 1.4] }, { t: unitCyl(0xf4e8c8, 12, 0.6, 1), pos: [0, 105, 0], scale: [20, 24, 20] }]);
            T.plant = compose([{ t: unitCyl(0xb0603a, 10, 1, 0.75), pos: [0, 0, 0], scale: [12, 18, 12] }, { t: unitSphere(0x3a8a3c, 0), pos: [0, 30, 0], scale: [16, 18, 16] }, { t: unitSphere(0x4aa04a, 0), pos: [6, 42, 3], scale: [10, 12, 10] }]);
            T.wallPanel = unitBox(decor.wallColor || 0xe8dcc0, 0.06);
            T.wallTrim = unitBox(decor.trimColor || 0xf8f4ec, 0.06);
            T.window = unitBox(0xbfe8ff, 0);
            T.frame = unitBox(0x9a6a3a);
            T.ceilingPanel = unitBox(decor.ceilingTint || 0xf4f0e8, 0.04);
            T.beam = unitBox(0xb07a48);
            T.train = compose([{ t: unitBox(0xd8402c), pos: [0, 4, 0], scale: [20, 12, 40] }, { t: unitCyl(0x2a2a2a, 8), pos: [0, 16, -12], scale: [3, 8, 3] }, { t: unitBox(0x2f6ad8), pos: [0, 16, 8], scale: [16, 10, 14] }]);
            return T;
        },
        buildTile(ctx) {
            const { x0, z0, tx, TILE, builders, colliders, rnd, decor, placeFull, T, inClearing } = ctx;
            const L = interiorLane();
            const wallX = L.halfWidth + 6;
            // Walls and ceiling are built by the tile that owns x = 0.
            if (Math.floor(0 / TILE) === tx || (x0 <= 0 && x0 + TILE > 0)) {
                [-1, 1].forEach((side) => {
                    placeFull(T.wallPanel, side * wallX, 0, z0 + TILE / 2, 8, L.ceiling + 10, TILE, 0, builders.ceil);
                    placeFull(T.wallTrim, side * (wallX - 4), 0, z0 + TILE / 2, 3, 10, TILE, 0, builders.ceil);
                    if (Math.abs(z0 % 480) < 1 || rnd() < 0.5) {
                        const wz = z0 + TILE / 2;
                        placeFull(T.frame, side * (wallX - 4.5), 60, wz, 2, 82, 92, 0, builders.ceil);
                        placeFull(T.window, side * (wallX - 5.2), 64, wz, 1, 74, 84, 0, builders.glow);
                    }
                });
                placeFull(T.ceilingPanel, 0, L.ceiling + 4, z0 + TILE / 2, wallX * 2, 6, TILE, 0, builders.ceil);
                placeFull(T.beam, 0, L.ceiling - 4, z0 + 20, wallX * 2, 8, 10, 0, builders.ceil);
                placeFull(T.glowBox, 0, L.ceiling - 6, z0 + TILE / 2, 40, 2, 40, 0, builders.glow);
                // Room divider with a doorway every few tiles: fly through the door!
                const tz = Math.round(z0 / TILE);
                if (tz % 3 === 0 && tz !== 0) {
                    const dz = z0 + 40, doorHalf = 70, doorTop = 115;
                    const doorX = (((tz * 37) % 3) - 1) * 90;
                    const leftW = (doorX - doorHalf) + wallX, rightW = wallX - (doorX + doorHalf);
                    placeFull(T.wallPanel, -wallX + leftW / 2, 0, dz, leftW, L.ceiling + 10, 8, 0, builders.ceil);
                    placeFull(T.wallPanel, wallX - rightW / 2, 0, dz, rightW, L.ceiling + 10, 8, 0, builders.ceil);
                    placeFull(T.wallPanel, doorX, doorTop, dz, doorHalf * 2, L.ceiling - doorTop + 10, 8, 0, builders.ceil);
                    placeFull(T.frame, doorX - doorHalf, 0, dz, 4, doorTop, 10, 0, builders.solid);
                    placeFull(T.frame, doorX + doorHalf, 0, dz, 4, doorTop, 10, 0, builders.solid);
                    placeFull(T.frame, doorX, doorTop - 2, dz, doorHalf * 2 + 4, 4, 10, 0, builders.solid);
                    colliders.push({ type: "box", x: -wallX + leftW / 2, z: dz, hw: leftW / 2, hd: 5, y0: 0, y1: 300, label: "CHOQUE CON LA PARED" });
                    colliders.push({ type: "box", x: wallX - rightW / 2, z: dz, hw: rightW / 2, hd: 5, y0: 0, y1: 300, label: "CHOQUE CON LA PARED" });
                    colliders.push({ type: "box", x: doorX, z: dz, hw: doorHalf + 2, hd: 5, y0: doorTop, y1: 300, label: "CHOQUE CON EL DINTEL" });
                }
            }
            // Furniture
            const items = decor.factory
                ? [["train", 0.3], ["blocks", 0.6], ["ball", 0.3], ["shelf", 0.4], ["table", 0.5], ["duck", 0.3]]
                : [["table", 0.5], ["chair", 0.6], ["sofa", 0.35], ["shelf", 0.35], ["blocks", 0.45], ["duck", 0.25], ["ball", 0.35], ["lamp", 0.3], ["plant", 0.35]];
            const sizes = { table: [55, 40, 35], chair: [12, 55, 12], sofa: [60, 52, 23], shelf: [40, 140, 14], blocks: [16, 40, 10], duck: [14, 28, 10], ball: [14, 28, 14], lamp: [10, 130, 10], plant: [16, 55, 16], train: [10, 26, 20] };
            const count = 2 + Math.floor(rnd() * 3);
            for (let i = 0; i < count; i++) {
                const [name, chance] = items[Math.floor(rnd() * items.length)];
                if (rnd() > chance + 0.3) continue;
                let x = x0 + rnd() * TILE, z = z0 + rnd() * TILE;
                if (Math.abs(x) > L.halfWidth - 30 || inClearing(x, z, 40)) continue;
                const against = name === "shelf" || name === "sofa";
                if (against) x = (x < 0 ? -1 : 1) * (L.halfWidth - 20);
                const s = sizes[name];
                const rot = against ? (x < 0 ? Math.PI / 2 : -Math.PI / 2) : Math.floor(rnd() * 4) * Math.PI / 2;
                if (name === "ball") {
                    placeFull(T.ball, x, 14, z, 14, 14, 14, rnd() * 6, builders.solid);
                    colliders.push({ type: "cyl", x, z, r: 14, y0: 0, y1: 28, label: "CHOQUE CON UNA PELOTA" });
                    continue;
                }
                placeFull(T[name], x, 0, z, 1, 1, 1, rot, builders.solid);
                const swap = Math.abs(Math.sin(rot)) > 0.5;
                colliders.push({ type: "box", x, z, hw: swap ? s[2] : s[0], hd: swap ? s[0] : s[2], y0: 0, y1: s[1], label: "CHOQUE CON LOS MUEBLES" });
            }
        }
    });

    // =====================================================================
    // Kind: city (Paris, Dubai, Shanghai, Tokyo, New York, Venice, Rio)
    // =====================================================================
    function cityLane(z, decor) {
        return { x: decor.river && decor.river !== "none" ? H.riverX(z) * (decor.riverFollow ?? 1) : 0, halfWidth: decor.laneHalf || 110, ceiling: 150, enclosed: false };
    }
    let traffic = null;
    G.registerKind("city", {
        horizon: "skyline",
        lane: cityLane,
        buildTemplates(pal, decor, helpers) {
            Object.assign(H, helpers);
            const T = buildDecorTemplates(pal, decor);
            Object.assign(T, buildLandmarks(pal));
            T.mansard = (() => { const g = new THREE.CylinderGeometry(0.72, 1, 1, 4); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); return H.tpl(g, (c, n) => H.shade(H.C(0x4a525e), n, 0.3)); })();
            T.tree = compose([{ t: unitCyl(0x6b4a33, 5), pos: [0, 0, 0], scale: [0.6, 5, 0.6] }, { t: unitSphere(0x3f8a3c, 0), pos: [0, 7, 0], scale: [4, 4, 4] }]);
            T.palm = compose([{ t: unitCyl(0x8a6a46, 5), pos: [0, 0, 0], scale: [0.6, 12, 0.6] }, { t: unitSphere(0x3a9a4a, 0), pos: [0, 13, 0], scale: [5, 1.6, 5] }]);
            if (traffic) { traffic.dispose(); traffic = null; }
            return T;
        },
        buildTile(ctx) {
            const { x0, z0, tx, tz, TILE, builders, colliders, rnd, decor, placeFull, T, inClearing } = ctx;
            const style = decor.cityStyle || "paris";
            const L = cityLane(z0 + TILE / 2, decor);
            // Blocks on a 90 m grid that matches the ground shader's streets.
            for (let bx = Math.ceil((x0 - 9) / 90) * 90 + 9; bx < x0 + TILE; bx += 90) {
                for (let bz = Math.ceil((z0 - 9) / 90) * 90 + 9; bz < z0 + TILE; bz += 90) {
                    const lx = cityLane(bz, decor);
                    if (Math.abs(bx - lx.x) < lx.halfWidth + 25 || inClearing(bx, bz, 50)) continue;
                    const r = H.hash2(Math.round(bx), Math.round(bz), 17);
                    if (style === "venice" && r < 0.25) continue;
                    // 1-4 buildings per block.
                    const n = style === "paris" || style === "venice" ? 2 : 1 + Math.floor(r * 3);
                    for (let k = 0; k < n; k++) {
                        const w = n === 1 ? 60 : 30 - rnd() * 6, d = n <= 2 ? 60 : 30 - rnd() * 6;
                        const ox = n === 1 ? 0 : (k % 2 ? 1 : -1) * 16, oz = n <= 2 ? 0 : (k < 2 ? -16 : 16);
                        const x = bx + ox, z = bz + oz;
                        let h;
                        if (style === "paris") h = 26 + rnd() * 16;
                        else if (style === "venice") h = 14 + rnd() * 14;
                        else if (style === "rio") h = 12 + rnd() * 40 + (rnd() < 0.15 ? 60 : 0);
                        else if (style === "dubai") h = 50 + Math.pow(rnd(), 2) * 220;
                        else if (style === "shanghai") h = 40 + Math.pow(rnd(), 1.6) * 200;
                        else if (style === "tokyo") h = 30 + Math.pow(rnd(), 1.5) * 140;
                        else h = 50 + Math.pow(rnd(), 1.5) * 180;
                        const t = T.box[Math.floor(rnd() * T.box.length)];
                        placeFull(t, x, 0, z, w, h, d, 0, builders.city);
                        if (style === "paris") placeFull(T.mansard, x, h, z, w * 0.72, 8, d * 0.72, 0, builders.solid);
                        else if (h > 80 && rnd() < 0.5) placeFull(T.roofBox, x, h, z, w * 0.5, 6 + rnd() * 14, d * 0.5, 0, builders.solid);
                        if ((style === "tokyo" || style === "shanghai") && rnd() < 0.6) {
                            const neon = T.neon[Math.floor(rnd() * T.neon.length)];
                            placeFull(neon, x + (rnd() < 0.5 ? -1 : 1) * (w / 2 + 0.6), 10 + rnd() * Math.min(h - 20, 60), z, 1, 14 + rnd() * 20, 6 + rnd() * 10, 0, builders.glow);
                        }
                        if (style === "dubai" && rnd() < 0.4) placeFull(T.glowBox, x, h + 0.3, z, w * 0.3, 1.2, d * 0.3, 0, builders.glow);
                        colliders.push({ type: "box", x, z, hw: w / 2, hd: d / 2, y0: 0, y1: h + 4, label: "CHOQUE CON UN EDIFICIO" });
                    }
                    if (style === "paris" || style === "rio" || style === "dubai") {
                        const tt = style === "paris" ? T.tree : T.palm;
                        for (let k = 0; k < 3; k++) placeFull(tt, bx - 38 + rnd() * 4, 0, bz - 30 + k * 30, 1.6, 1.6, 1.6, rnd() * 6, builders.solid);
                    }
                }
            }
            // Landmark every few tiles, placed over or beside the lane.
            const lm = decor.landmark;
            if (lm && T[lm] && tz % (decor.landmarkEvery || 5) === 0 && tz < 0) {
                const z = z0 + TILE / 2;
                const ln = cityLane(z, decor);
                const over = lm === "eiffel" || lm === "tokyoTower";
                const x = over ? ln.x : ln.x + (tz % 2 ? 1 : -1) * (ln.halfWidth + (lm === "cristo" ? 140 : 70));
                if (Math.floor(x / TILE) === tx) {
                    placeFull(T[lm].template, x, 0, z, 1, 1, 1, 0, lm === "burj" || lm === "shanghaiTower" || lm === "empire" ? builders.city : builders.solid);
                    if (T[lm].colliders) T[lm].colliders(x, z).forEach((c) => colliders.push(c));
                    if (decor.landmark2 && T[decor.landmark2]) {
                        const x2 = ln.x - (tz % 2 ? 1 : -1) * (ln.halfWidth + 80);
                        placeFull(T[decor.landmark2].template, x2, 0, z + 120, 1, 1, 1, 0, builders.city);
                        if (T[decor.landmark2].colliders) T[decor.landmark2].colliders(x2, z + 120).forEach((c) => colliders.push(c));
                    }
                }
            }
        },
        update(delta, focus) {
            const decor = WorldGfx.__decor();
            if (!decor || decor.kind !== "city") return;
            if (!traffic) traffic = makeTraffic(decor);
            traffic.update(delta, focus);
        },
        dispose() {
            if (traffic) { traffic.dispose(); traffic = null; }
        }
    });

    // Cars on the avenues beside the lane and boats on the river.
    function makeTraffic(decor) {
        const scene = H.scene();
        const carColors = [0xd8402c, 0xf2f2f2, 0x2f6ad8, 0x2a2a2a, 0xf2c23a, 0x8a8a8a];
        const cars = [];
        const bodyGeom = new THREE.BoxGeometry(4, 2.2, 8);
        const cabGeom = new THREE.BoxGeometry(3.6, 1.6, 4);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3020 });
        for (let i = 0; i < 46; i++) {
            const g = new THREE.Group();
            const body = new THREE.Mesh(bodyGeom, new THREE.MeshStandardMaterial({ color: carColors[i % carColors.length], roughness: 0.4, metalness: 0.3 }));
            body.position.y = 1.6;
            const cab = new THREE.Mesh(cabGeom, new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.1, metalness: 0.5 }));
            cab.position.set(0, 3.3, 0.5);
            const hl = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 0.2), lightMat); hl.position.set(0, 1.8, -4.05);
            const tl = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 0.2), tailMat); tl.position.set(0, 1.8, 4.05);
            g.add(body, cab, hl, tl);
            g.userData = { lane: i % 4, speed: 18 + Math.random() * 14, dir: i % 2 ? 1 : -1 };
            scene.add(g);
            cars.push(g);
        }
        const boats = [];
        if (decor.river && decor.river !== "none") {
            for (let i = 0; i < 8; i++) {
                const g = new THREE.Group();
                const hull = new THREE.Mesh(new THREE.BoxGeometry(7, 2.5, 26), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 }));
                hull.position.y = 1;
                const deck = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 14), new THREE.MeshStandardMaterial({ color: decor.boatColor || 0x2f6ad8, roughness: 0.5 }));
                deck.position.set(0, 3.5, 2);
                g.add(hull, deck);
                g.userData = { speed: 6 + Math.random() * 6, dir: i % 2 ? 1 : -1, off: (Math.random() - 0.5) * 30 };
                scene.add(g);
                boats.push(g);
            }
        }
        const place = (car, focus, initial) => {
            const laneCenter = cityLane(focus.z, decor).x;
            const avenue = laneCenter + (car.userData.lane < 2 ? -1 : 1) * ((decor.laneHalf || 110) + 12) + (car.userData.lane % 2 ? 4 : -4);
            car.position.set(avenue, 0, focus.z - (initial ? Math.random() * 1200 - 200 : 900 + Math.random() * 300));
            car.rotation.y = car.userData.dir > 0 ? Math.PI : 0;
        };
        cars.forEach((c) => place(c, { z: 0 }, true));
        boats.forEach((b) => { b.position.set(H.riverX(-Math.random() * 1000) + b.userData.off, 0, -Math.random() * 1000); });
        return {
            update(delta, focus) {
                cars.forEach((car) => {
                    const lc = cityLane(car.position.z, decor).x;
                    const avenue = lc + (car.userData.lane < 2 ? -1 : 1) * ((decor.laneHalf || 110) + 12) + (car.userData.lane % 2 ? 4 : -4);
                    car.position.x += (avenue - car.position.x) * Math.min(1, delta * 2);
                    car.position.z += car.userData.speed * car.userData.dir * delta;
                    if (car.position.z > focus.z + 220 || car.position.z < focus.z - 1300) place(car, focus, false);
                });
                boats.forEach((b) => {
                    b.position.z += b.userData.speed * b.userData.dir * delta;
                    b.position.x = H.riverX(b.position.z) + b.userData.off;
                    b.rotation.y = b.userData.dir > 0 ? Math.PI : 0;
                    if (b.position.z > focus.z + 220 || b.position.z < focus.z - 1300) b.position.z = focus.z - 400 - Math.random() * 800;
                });
            },
            dispose() {
                cars.concat(boats).forEach((m) => scene.remove(m));
            }
        };
    }

    // =====================================================================
    // Valley decor kits
    // =====================================================================
    G.registerKit("war", {
        buildTemplates(pal, decor, helpers) {
            Object.assign(H, helpers);
            const T = {};
            const steel = unitBox(0x4a5240), dark = unitBox(0x2a2e26);
            T.tank = compose([{ t: steel, pos: [0, 1, 0], scale: [8, 3, 12] }, { t: dark, pos: [0, 0, 0], scale: [9, 1.6, 12.5] }, { t: steel, pos: [0, 4, 0.5], scale: [5, 2.4, 5] }, { t: unitCyl(0x3a4232, 6), pos: [0, 5.2, -2], scale: [0.5, 8, 0.5], rot: [Math.PI / 2, 0, 0] }]);
            T.ruin = compose([{ t: unitBox(0x8a8478), pos: [0, 0, 0], scale: [24, 14, 3] }, { t: unitBox(0x7a746a), pos: [-10, 0, 10], scale: [3, 20, 22] }, { t: unitBox(0x6a645a), pos: [4, 0, 4], scale: [10, 4, 10], rot: [0.3, 0.4, 0.1] }]);
            T.crater = (() => { const g = new THREE.CylinderGeometry(1, 0.7, 0.2, 12, 1, true); return H.tpl(g, () => H.C(0x2a2622)); })();
            T.barbed = compose([0, 1, 2, 3].map((k) => ({ t: unitBox(0x5a5048), pos: [k * 6, 0, 0], scale: [0.5, 3, 0.5] })).concat([{ t: unitBox(0x6a6058), pos: [9, 2, 0], scale: [20, 0.3, 0.3] }]));
            T.fire = (() => { const g = new THREE.ConeGeometry(1, 2.4, 6); g.translate(0, 1.2, 0); return H.tpl(g, (c) => H.C(c.y > 1.2 ? 0xffd040 : 0xff5a10)); })();
            return T;
        },
        buildTile(ctx) {
            const { x0, z0, TILE, rnd, place, placeFull, builders, colliders, T, inClearing } = ctx;
            for (let i = 0; i < 4; i++) {
                const x = x0 + rnd() * TILE, z = z0 + rnd() * TILE;
                if (Math.abs(x) > 260 || inClearing(x, z, 20)) continue;
                const k = rnd();
                if (k < 0.3) place(T.tank, x, z, 1.4 + rnd() * 0.4);
                else if (k < 0.6) {
                    placeFull(T.ruin, x, 0, z, 1.6, 1.6, 1.6, rnd() * 6);
                    colliders.push({ type: "box", x, z, hw: 22, hd: 22, y0: 0, y1: 30, label: "CHOQUE CON LAS RUINAS" });
                    if (rnd() < 0.5) placeFull(T.fire, x + 4, 0, z + 2, 3, 3 + rnd() * 3, 3, 0, builders.glow);
                } else if (k < 0.85) placeFull(T.crater, x, 0.2, z, 10 + rnd() * 12, 1, 10 + rnd() * 12, 0);
                else place(T.barbed, x, z, 1.5);
            }
        }
    });

    G.registerKit("pyramids", {
        buildTemplates(pal, decor, helpers) { Object.assign(H, helpers); return Object.assign({ obelisk: unitBox(0xd9b27a) }, buildLandmarks(pal)); },
        buildTile(ctx) {
            const { x0, z0, tz, TILE, rnd, placeFull, colliders, T, inClearing } = ctx;
            if (tz % 3 === 0 && tz < 0) {
                const side = tz % 2 ? 1 : -1;
                const x = side * (150 + rnd() * 60), z = z0 + TILE / 2;
                if (x >= x0 && x < x0 + TILE && !inClearing(x, z, 120)) {
                    const s = 110 + rnd() * 60;
                    placeFull(T.pyramid.template, x, 0, z, s, s * 0.85, s, Math.PI / 4);
                    colliders.push({ type: "cone", x, z, r: s * 0.62, h: s * 0.85, label: "CHOQUE CON UNA PIRÁMIDE" });
                }
            }
            if (rnd() < 0.3) {
                const x = x0 + rnd() * TILE, z = z0 + rnd() * TILE;
                if (Math.abs(x) < 240 && !inClearing(x, z, 20)) {
                    placeFull(T.obelisk, x, 0, z, 4, 34, 4, 0);
                    colliders.push({ type: "box", x, z, hw: 2.5, hd: 2.5, y0: 0, y1: 34, label: "CHOQUE CON UN OBELISCO" });
                }
            }
        }
    });

    G.registerKit("temples", {
        buildTemplates(pal, decor, helpers) { Object.assign(H, helpers); return buildLandmarks(pal); },
        buildTile(ctx) {
            const { x0, z0, tz, TILE, rnd, placeFull, colliders, T, inClearing } = ctx;
            if (tz % 2 === 0 && tz < 0 && rnd() < 0.8) {
                const side = rnd() < 0.5 ? -1 : 1;
                const x = side * (120 + rnd() * 90), z = z0 + rnd() * TILE;
                if (x >= x0 && x < x0 + TILE && !inClearing(x, z, 70)) {
                    placeFull(T.temple.template, x, 0, z, 1, 1, 1, Math.floor(rnd() * 4) * Math.PI / 2);
                    colliders.push({ type: "box", x, z, hw: 45, hd: 45, y0: 0, y1: 70, label: "CHOQUE CON EL TEMPLO" });
                }
            }
        }
    });

    G.registerKit("castles", {
        buildTemplates(pal, decor, helpers) { Object.assign(H, helpers); return buildLandmarks(pal); },
        buildTile(ctx) {
            const { x0, z0, tz, TILE, rnd, placeFull, colliders, T, inClearing } = ctx;
            if (tz % 4 === 0 && tz < 0) {
                const side = tz % 8 === 0 ? 1 : -1;
                const x = side * (130 + rnd() * 50), z = z0 + TILE / 2;
                if (x >= x0 && x < x0 + TILE && !inClearing(x, z, 80)) {
                    placeFull(T.castle.template, x, 0, z, 1.3, 1.3, 1.3, rnd() * 0.4);
                    colliders.push({ type: "box", x, z, hw: 62, hd: 56, y0: 0, y1: 30, label: "CHOQUE CON EL CASTILLO" });
                    colliders.push({ type: "box", x, z, hw: 22, hd: 22, y0: 0, y1: 86, label: "CHOQUE CON EL TORREÓN" });
                }
            }
        }
    });

    G.registerKit("synth", {
        buildTemplates(pal, decor, helpers) {
            Object.assign(H, helpers);
            const T = {};
            const g = new THREE.ConeGeometry(1, 1, 4); g.translate(0, 0.5, 0); g.rotateY(Math.PI / 4);
            T.neonPyramid = H.tpl(g, (c, n) => H.C(n.x > 0 ? 0xff3aa0 : 0x3a2a7a).multiplyScalar(0.6 + 0.4 * Math.abs(n.z)));
            T.neonPalm = compose([{ t: unitCyl(0xff3aa0, 5), pos: [0, 0, 0], scale: [0.5, 12, 0.5] }, ...[0, 1, 2, 3, 4].map((k) => ({ t: unitBox(0x3affe0, 0), pos: [Math.cos(k * 1.25) * 3, 12, Math.sin(k * 1.25) * 3], scale: [6, 0.3, 1], rot: [0, -k * 1.25, -0.4] }))]);
            T.sunDisc = unitCyl(0xffb03a, 24);
            return T;
        },
        buildTile(ctx) {
            const { x0, z0, TILE, rnd, placeFull, builders, colliders, T, inClearing } = ctx;
            for (let i = 0; i < 3; i++) {
                const x = x0 + rnd() * TILE, z = z0 + rnd() * TILE;
                if (inClearing(x, z, 30)) continue;
                if (Math.abs(x) > 140 && rnd() < 0.6) {
                    const s = 40 + rnd() * 70;
                    placeFull(T.neonPyramid, x, 0, z, s, s * 0.9, s, Math.PI / 4, builders.glow);
                    colliders.push({ type: "cone", x, z, r: s * 0.62, h: s * 0.9, label: "CHOQUE CON UNA PIRÁMIDE DE NEÓN" });
                } else {
                    placeFull(T.neonPalm, x, 0, z, 1.6, 1.6, 1.6, rnd() * 6, builders.glow);
                }
            }
        }
    });

    G.registerKit("ocean", {
        buildTemplates(pal, decor, helpers) {
            Object.assign(H, helpers);
            const T = {};
            T.rig = compose([...[[-8, -8], [8, -8], [-8, 8], [8, 8]].map(([x, z]) => ({ t: unitCyl(0xd8c040, 6), pos: [x, 0, z], scale: [1.4, 30, 1.4] })),
                { t: unitBox(0x8a8a8a), pos: [0, 30, 0], scale: [28, 4, 28] }, { t: unitBox(0xd84a2c), pos: [6, 34, 6], scale: [10, 8, 10] }, { t: unitCyl(0x9a9a9a, 6), pos: [-6, 34, -6], scale: [1.2, 30, 1.2] }]);
            T.rockIsle = (() => { const g = new THREE.IcosahedronGeometry(1, 1); g.scale(1, 0.5, 1); return H.tpl(g, (c, n) => (n.y > 0.6 ? H.C(0x4a9a4a) : H.shade(H.C(0x6a6a62), n, 0.3))); })();
            return T;
        },
        buildTile(ctx) {
            const { x0, z0, TILE, rnd, placeFull, colliders, T, inClearing } = ctx;
            if (rnd() < 0.35) {
                const x = x0 + rnd() * TILE, z = z0 + rnd() * TILE;
                if (!inClearing(x, z, 40) && Math.abs(x) > 50) {
                    placeFull(T.rig, x, 0, z, 1.5, 1.5, 1.5, rnd() * 6);
                    colliders.push({ type: "box", x, z, hw: 22, hd: 22, y0: 0, y1: 62, label: "CHOQUE CON LA PLATAFORMA" });
                }
            }
            if (rnd() < 0.5) {
                const x = x0 + rnd() * TILE, z = z0 + rnd() * TILE, r = 20 + rnd() * 40;
                if (!inClearing(x, z, 30)) {
                    placeFull(T.rockIsle, x, 0, z, r, r, r, rnd() * 6);
                    colliders.push({ type: "cone", x, z, r: r * 0.8, h: r * 0.5, label: "CHOQUE CON UN ISLOTE" });
                }
            }
        }
    });
})();
