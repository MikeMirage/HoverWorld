// HoverWorld - Data-driven boss engine.
// Each boss = archetype mesh builder + skin + phases. A phase exposes a group of
// weak points; clearing the group advances to the next phase. Turrets are
// temporary weak points that can be silenced. Attacks are composable patterns.
(function () {
    const K = () => Combat._k;
    const V3 = THREE.Vector3;
    const tmp = new V3();
    const tmp2 = new V3();

    // ------------------------------------------------------------------
    // Boss catalogue. tierBias adds to the world tier for scaling.
    // ------------------------------------------------------------------
    const A = (type, every, extra = {}) => Object.assign({ type, every }, extra);
    const BOSSES = {
        dreadnought: { name: "DREADNOUGHT", arch: "airship", move: "chase", skin: { hull: 0x8a94a4, accent: 0xb8402c },
            intro: "¡Persigue al Dreadnought! Silencia sus torretas y destruye los motores",
            phases: [
                { label: "Motores", attacks: [A("spread", 1.9, { n: 3 }), A("mines", 3.6)] },
                { label: "Núcleo", attacks: [A("spread", 1.4, { n: 5 }), A("mines", 3), A("missiles", 6, { count: 2 })], speed: 1.06 }
            ] },
        sand_scorpion: { name: "ESCORPIÓN DE ARENA", arch: "walker", skin: { hull: 0xb8783a, accent: 0x3a2a1a, style: "scorpion" }, move: "ground",
            intro: "Un escorpión mecánico cruza el valle. Destruye sus ventiladores traseros",
            phases: [
                { label: "Ventiladores", attacks: [A("strikes", 3.2, { count: 2, style: "mortar" }), A("spread", 2.2, { n: 3 })] },
                { label: "Reactor", attacks: [A("strikes", 2.4, { count: 3, style: "mortar" }), A("missiles", 6, { count: 2 })], speed: 1.1 }
            ] },
        ice_breaker: { name: "ROMPEHIELOS CELESTE", arch: "cruiser", skin: { hull: 0xc8d8e8, accent: 0x2f6a9a },
            intro: "¡Cuidado con sus misiles! Derríbalos y destruye las baterías",
            phases: [
                { label: "Baterías de misiles", attacks: [A("missiles", 4.2, { count: 3 }), A("spread", 2.4, { n: 3 })] },
                { label: "Reactor", attacks: [A("missiles", 3.2, { count: 4 }), A("barrage", 5, { n: 12 })], speed: 1.08 }
            ] },
        tide_carrier: { name: "PORTAAVIONES MAREA", arch: "carrier", skin: { hull: 0x5a6a7a, accent: 0xf2c23a },
            intro: "El portaaviones lanza cazas de escolta. Cierra sus hangares",
            phases: [
                { label: "Hangares", attacks: [A("escorts", 7, { count: 2, max: 3 }), A("spread", 2.2, { n: 3 })] },
                { label: "Puente de mando", attacks: [A("escorts", 6, { count: 2, max: 4 }), A("missiles", 5, { count: 2 }), A("mines", 4)], speed: 1.05 }
            ] },
        magma_golem: { name: "GÓLEM DE MAGMA", arch: "walker", skin: { hull: 0x3a2a26, accent: 0xff5a1a, style: "golem" }, move: "ground",
            intro: "El gólem lanza rocas ardientes. Apunta a sus grietas de lava",
            phases: [
                { label: "Grietas", attacks: [A("strikes", 2.6, { count: 3, style: "meteor" }), A("barrage", 5.5, { n: 10 })] },
                { label: "Corazón", attacks: [A("strikes", 2, { count: 4, style: "meteor" }), A("laser", 7)], speed: 1.1 }
            ] },
        sphinx: { name: "ESFINGE MECÁNICA", arch: "walker", skin: { hull: 0xd9b27a, accent: 0x2f6ad8, style: "sphinx" }, move: "ground",
            intro: "Sus ojos disparan láseres. Rompe los cristales del lomo",
            phases: [
                { label: "Cristales", attacks: [A("laser", 6), A("spread", 2.6, { n: 3 })] },
                { label: "Gema frontal", attacks: [A("laser", 4.5), A("strikes", 3, { count: 3, style: "sand" }), A("missiles", 7, { count: 2 })], speed: 1.1 }
            ] },
        ancient_idol: { name: "ÍDOLO ANCESTRAL", arch: "fortress", skin: { hull: 0x7a8476, accent: 0x3aff9a, style: "idol" },
            intro: "Los cristales que orbitan protegen al ídolo. ¡Destrúyelos!",
            phases: [
                { label: "Cristales guardianes", attacks: [A("laser", 6.5), A("drones", 9)] },
                { label: "Ojos del ídolo", attacks: [A("laser", 4.5), A("barrage", 4.5, { n: 14 }), A("strikes", 4, { count: 2, style: "meteor" })] }
            ] },
        crimson_leviathan: { name: "LEVIATÁN CARMESÍ", arch: "serpent", skin: { hull: 0x8a2a40, accent: 0xffb0c0 },
            intro: "El leviatán serpentea entre las islas. Revienta sus orbes",
            phases: [
                { label: "Orbes del cuerpo", attacks: [A("barrage", 4.5, { n: 10 }), A("spread", 2.4, { n: 3 })] },
                { label: "Cabeza", attacks: [A("barrage", 3.4, { n: 14 }), A("missiles", 5.5, { count: 3 })], speed: 1.12 }
            ] },
        storm_colossus: { name: "COLOSO DE TORMENTA", arch: "fortress", skin: { hull: 0x4a5260, accent: 0x9fd8ff, style: "reactor" },
            intro: "Invoca rayos sobre ti. ¡No te quedes quieto y destruye las bobinas!",
            phases: [
                { label: "Bobinas", attacks: [A("strikes", 2.2, { count: 3, style: "lightning" }), A("drones", 10)] },
                { label: "Núcleo de tormenta", attacks: [A("strikes", 1.6, { count: 4, style: "lightning" }), A("laser", 5.5), A("escorts", 9, { count: 2, max: 2 })] }
            ] },
        aurora_hawk: { name: "HALCÓN AURORA", arch: "jet", skin: { hull: 0x2a3a6a, accent: 0x3affd8 }, move: "jet",
            intro: "El halcón es rápido. Usa las estelas para alcanzarlo",
            phases: [
                { label: "Turbinas", attacks: [A("missiles", 4.5, { count: 2 }), A("spread", 2, { n: 3 })] },
                { label: "Alas", attacks: [A("missiles", 4, { count: 3 }), A("escorts", 8, { count: 2, max: 3 })], speed: 1.08 },
                { label: "Reactor", attacks: [A("missiles", 3.2, { count: 3 }), A("barrage", 4, { n: 16 }), A("escorts", 7, { count: 2, max: 4 })], speed: 1.14 }
            ] },
        // ---- new worlds ----
        frost_wyrm: { name: "WYRM DE ESCARCHA", arch: "serpent", skin: { hull: 0xb8d8f0, accent: 0x3affff },
            intro: "Un wyrm de hielo repta por la gruta. Rompe sus escamas brillantes",
            phases: [
                { label: "Escamas", attacks: [A("barrage", 5, { n: 8 }), A("strikes", 4, { count: 2, style: "ice" })] },
                { label: "Cabeza", attacks: [A("barrage", 3.6, { n: 12 }), A("spread", 2, { n: 5 })], speed: 1.1 }
            ] },
        sky_citadel: { name: "CIUDADELA CELESTE", arch: "fortress", skin: { hull: 0xe8e0d0, accent: 0xffd23a, style: "castle" },
            intro: "La ciudadela flota escoltada. Derriba sus generadores de escudo",
            phases: [
                { label: "Generadores", attacks: [A("escorts", 8, { count: 2, max: 3 }), A("spread", 2.4, { n: 5 })] },
                { label: "Torreón", attacks: [A("laser", 5), A("missiles", 5, { count: 3 }), A("escorts", 8, { count: 2, max: 3 })] }
            ] },
        omega_core: { name: "NÚCLEO OMEGA", arch: "fortress", skin: { hull: 0x3a4250, accent: 0xff3a3a, style: "reactor" },
            intro: "El reactor de la base barre el túnel con láseres. ¡Corta la refrigeración!",
            phases: [
                { label: "Refrigeración", attacks: [A("laser", 5), A("drones", 8)] },
                { label: "Reactor", attacks: [A("laser", 3.6), A("barrage", 4, { n: 14 }), A("drones", 7)] }
            ] },
        robo_vacuum: { name: "ROBO-ASPIRADORA", arch: "walker", skin: { hull: 0x2a2e36, accent: 0x3affb0, style: "vacuum" }, move: "ground",
            intro: "¡La aspiradora dispara cohetes de juguete! Rompe sus sensores",
            phases: [
                { label: "Sensores", attacks: [A("missiles", 4, { count: 3 }), A("barrage", 5, { n: 10 })] },
                { label: "Batería", attacks: [A("missiles", 3, { count: 4 }), A("strikes", 3.5, { count: 3, style: "mortar" })], speed: 1.15 }
            ] },
        goliath_bomber: { name: "BOMBARDERO GOLIAT", arch: "carrier", skin: { hull: 0x4a5240, accent: 0xd8c040, style: "bomber" },
            intro: "El bombardero llega escoltado. Destruye sus motores",
            phases: [
                { label: "Motores", attacks: [A("escorts", 6, { count: 2, max: 4 }), A("strikes", 3, { count: 3, style: "mortar" })] },
                { label: "Cabina", attacks: [A("escorts", 5, { count: 3, max: 5 }), A("spread", 1.8, { n: 5 }), A("mines", 3.5)] }
            ] },
        corsair_blimp: { name: "DIRIGIBLE CORSARIO", arch: "airship", skin: { hull: 0x2a2a30, accent: 0xd83a3a }, move: "chase",
            intro: "¡Piratas sobre París! Esquiva sus minas y revienta los motores",
            phases: [
                { label: "Motores", attacks: [A("mines", 2.6), A("spread", 2, { n: 3 }), A("escorts", 9, { count: 1, max: 2 })] },
                { label: "Bodega", attacks: [A("mines", 2), A("missiles", 5, { count: 3 }), A("escorts", 8, { count: 2, max: 3 })], speed: 1.08 }
            ] },
        desert_falcon: { name: "HALCÓN DEL DESIERTO", arch: "jet", skin: { hull: 0xd8b040, accent: 0xf2f2f2 }, move: "jet",
            intro: "Un caza dorado entre rascacielos. ¡Síguele el ritmo!",
            phases: [
                { label: "Turbinas", attacks: [A("missiles", 4, { count: 3 }), A("spread", 1.8, { n: 3 })] },
                { label: "Reactor", attacks: [A("missiles", 3, { count: 4 }), A("barrage", 4.5, { n: 14 })], speed: 1.1 }
            ] },
        neon_dragon: { name: "DRAGÓN DE NEÓN", arch: "serpent", skin: { hull: 0xd8303a, accent: 0xffd23a, style: "dragon" },
            intro: "Un dragón de farolillos sobre el Huangpu. Apaga sus farolillos",
            phases: [
                { label: "Farolillos", attacks: [A("barrage", 3.8, { n: 12 }), A("strikes", 4, { count: 2, style: "meteor" })] },
                { label: "Cabeza", attacks: [A("barrage", 3, { n: 16 }), A("missiles", 5, { count: 3 })], speed: 1.12 }
            ] },
        mecha_kaiju: { name: "MECHA KAIJU", arch: "walker", skin: { hull: 0x3a4a5a, accent: 0xff3aa0, style: "mech" }, move: "ground",
            intro: "Un kaiju mecánico arrasa Tokio. Ataca los reactores de su espalda",
            phases: [
                { label: "Reactores", attacks: [A("laser", 5), A("missiles", 5, { count: 3 })] },
                { label: "Cabeza", attacks: [A("laser", 3.6), A("strikes", 3, { count: 3, style: "mortar" }), A("escorts", 9, { count: 2, max: 2 })], speed: 1.1 }
            ] },
        ghost_galleon: { name: "GALEÓN FANTASMA", arch: "galleon", skin: { hull: 0x3a2a22, accent: 0x7affd0 },
            intro: "Un galeón volador dispara andanadas. Derriba sus velas",
            phases: [
                { label: "Velas", attacks: [A("spread", 2.2, { n: 4 }), A("mines", 3.5)] },
                { label: "Farol de popa", attacks: [A("spread", 1.6, { n: 6 }), A("barrage", 4.5, { n: 12 }), A("mines", 3)], speed: 1.08 }
            ] },
        flying_fortress: { name: "FORTALEZA VOLANTE", arch: "carrier", skin: { hull: 0x6a7480, accent: 0x2f6ad8 },
            intro: "Sobre Manhattan: hangares, cazas y misiles. ¡A por ella!",
            phases: [
                { label: "Hangares", attacks: [A("escorts", 6, { count: 2, max: 4 }), A("missiles", 5, { count: 2 })] },
                { label: "Torre de mando", attacks: [A("escorts", 5, { count: 2, max: 5 }), A("missiles", 4, { count: 3 }), A("laser", 6)] }
            ] },
        carnival_zeppelin: { name: "ZEPELÍN DE CARNAVAL", arch: "airship", skin: { hull: 0xf2c23a, accent: 0x3aaa5a }, move: "chase",
            intro: "¡Fuegos artificiales! Esquiva la traca y revienta los motores",
            phases: [
                { label: "Motores", attacks: [A("barrage", 3.6, { n: 14, fireworks: true }), A("spread", 2.2, { n: 3 })] },
                { label: "Carroza", attacks: [A("barrage", 2.6, { n: 18, fireworks: true }), A("missiles", 5, { count: 3 }), A("mines", 3.4)], speed: 1.08 }
            ] },
        solar_pharaoh: { name: "FARAÓN SOLAR", arch: "fortress", skin: { hull: 0xd9b27a, accent: 0xffd23a, style: "pyramid" },
            intro: "Una pirámide flotante canaliza el sol. Apaga sus obeliscos",
            phases: [
                { label: "Obeliscos", attacks: [A("laser", 5), A("strikes", 3.5, { count: 3, style: "sand" })] },
                { label: "Ojo solar", attacks: [A("laser", 3.5), A("barrage", 4, { n: 16 }), A("drones", 8)] }
            ] },
        feathered_serpent: { name: "SERPIENTE EMPLUMADA", arch: "serpent", skin: { hull: 0x2a8a5a, accent: 0xffd23a, style: "feathered" },
            intro: "Quetzalcóatl despierta. Ataca las plumas doradas",
            phases: [
                { label: "Plumas", attacks: [A("barrage", 4, { n: 12 }), A("drones", 9)] },
                { label: "Cabeza", attacks: [A("barrage", 3, { n: 16 }), A("strikes", 3.5, { count: 3, style: "meteor" }), A("laser", 7)], speed: 1.12 }
            ] },
        red_dragon: { name: "DRAGÓN ROJO", arch: "serpent", skin: { hull: 0xa82a1a, accent: 0xffa040, style: "dragon" },
            intro: "El dragón escupe fuego sobre el reino. ¡Ataca sus escamas incandescentes!",
            phases: [
                { label: "Escamas", attacks: [A("strikes", 2.6, { count: 3, style: "meteor" }), A("spread", 2, { n: 5 })] },
                { label: "Cabeza", attacks: [A("strikes", 2, { count: 4, style: "meteor" }), A("barrage", 3.5, { n: 14 }), A("laser", 6)], speed: 1.12 }
            ] },
        prism: { name: "PRISMA", arch: "fortress", skin: { hull: 0x2a1a4a, accent: 0xff3aa0, style: "prism" },
            intro: "El prisma refracta láseres de neón. Rompe sus satélites",
            phases: [
                { label: "Satélites", attacks: [A("laser", 4.5), A("barrage", 4.5, { n: 12 })] },
                { label: "Núcleo", attacks: [A("laser", 3.2), A("barrage", 3, { n: 18 }), A("drones", 8)] }
            ] },
        laser_satellite: { name: "SATÉLITE LÁSER", arch: "fortress", skin: { hull: 0xd8dce4, accent: 0x3affff, style: "satellite" },
            intro: "Un satélite armado barre la órbita. Destruye sus paneles",
            phases: [
                { label: "Paneles solares", attacks: [A("laser", 4.2), A("missiles", 5, { count: 3 })] },
                { label: "Antena", attacks: [A("laser", 3), A("barrage", 3.6, { n: 16 }), A("escorts", 8, { count: 2, max: 3 })] }
            ] },
        magma_phoenix: { name: "FÉNIX DE MAGMA", arch: "jet", skin: { hull: 0xd84a1a, accent: 0xffd040 }, move: "jet",
            intro: "Un fénix de fuego atraviesa el volcán. ¡No lo pierdas de vista!",
            phases: [
                { label: "Alas ígneas", attacks: [A("strikes", 2.4, { count: 3, style: "meteor" }), A("spread", 1.8, { n: 5 })] },
                { label: "Corazón", attacks: [A("strikes", 1.8, { count: 4, style: "meteor" }), A("barrage", 3.4, { n: 16 }), A("missiles", 5, { count: 3 })], speed: 1.12 }
            ] },
        toy_express: { name: "TREN EXPRESO DE JUGUETE", arch: "walker", skin: { hull: 0xd8402c, accent: 0xf2c23a, style: "train" }, move: "ground",
            intro: "¡El tren de juguete se ha vuelto loco! Destruye sus vagones",
            phases: [
                { label: "Vagones", attacks: [A("missiles", 4.5, { count: 2 }), A("barrage", 4, { n: 12 })] },
                { label: "Locomotora", attacks: [A("missiles", 3.4, { count: 3 }), A("strikes", 3, { count: 3, style: "mortar" }), A("spread", 1.8, { n: 5 })], speed: 1.15 }
            ] },
        kraken: { name: "KRAKEN DE ACERO", arch: "walker", skin: { hull: 0x4a3a6a, accent: 0xff5a8a, style: "kraken" }, move: "ground",
            intro: "Un kraken mecánico emerge del mar. Revienta sus ojos",
            phases: [
                { label: "Tentáculos", attacks: [A("strikes", 2.6, { count: 3, style: "water" }), A("barrage", 4.5, { n: 12 })] },
                { label: "Ojos", attacks: [A("strikes", 2, { count: 4, style: "water" }), A("missiles", 4.5, { count: 3 }), A("laser", 6)], speed: 1.1 }
            ] }
    };

    // ------------------------------------------------------------------
    // Mesh helpers
    // ------------------------------------------------------------------
    function mat(color, opts = {}) {
        return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.5, metalness: 0.25, flatShading: true }, opts));
    }
    function glowMat(color) { return new THREE.MeshBasicMaterial({ color }); }
    function mesh(geom, material, parent, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
        const m = new THREE.Mesh(geom, material);
        m.position.set(pos[0], pos[1], pos[2]);
        m.rotation.set(rot[0], rot[1], rot[2]);
        m.scale.set(scale[0], scale[1], scale[2]);
        m.castShadow = true;
        if (parent) parent.add(m);
        return m;
    }
    function weakMarker(parent, color, radius) {
        const ring = mesh(new THREE.RingGeometry(radius * 0.9, radius, 6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }), parent);
        ring.castShadow = false;
        return ring;
    }

    // Each builder returns { group, parts, bbox:[hx,hy,hz] } where parts = [{ mesh, kind, group, radius, shieldMesh? }]
    const BUILDERS = {
        airship(skin) {
            const g = new THREE.Group();
            const s = K().shared;
            const hull = K().rimMaterial(skin.hull, 0xffc890, { metalness: 0.25, roughness: 0.5, flat: true, rimStrength: 0.35 });
            const accent = mat(skin.accent);
            const dark = mat(0x3a4250);
            const profile = [[0, -36], [3, -34], [7, -28], [9.5, -16], [10, 0], [9.2, 16], [7.5, 28], [5, 34], [0, 36]].map(([r, z]) => new THREE.Vector2(r, z));
            const hg = new THREE.LatheGeometry(profile, 14); hg.rotateX(Math.PI / 2);
            mesh(hg, hull, g, [0, 0, 0], [0, 0, 0], [1.25, 0.8, 1]);
            mesh(new THREE.BoxGeometry(4, 6, 50), dark, g, [0, -7, 0]);
            mesh(new THREE.BoxGeometry(8, 6, 14), dark, g, [0, 8.5, -8]);
            [-1, 1].forEach((side) => {
                mesh(new THREE.BoxGeometry(0.4, 2, 40), accent, g, [side * 12.4, 0, 0]);
                mesh(new THREE.BoxGeometry(0.6, 8, 9), accent, g, [side * 5, 7.5, 28], [0, 0, side * 0.4]);
                for (let k = 0; k < 9; k++) mesh(new THREE.BoxGeometry(0.3, 0.9, 1.6), glowMat(0xffd890), g, [side * 12.2, 2.4, -22 + k * 5]);
            });
            const parts = [];
            [[-17, -2], [17, -2], [-11, -9], [11, -9]].forEach(([x, y]) => {
                mesh(new THREE.BoxGeometry(Math.abs(x) - 8, 1.5, 6), dark, g, [x / 2 + Math.sign(x) * 4, y * 0.6, 14]);
                const pod = mesh(new THREE.CylinderGeometry(3.6, 3, 16, 10), s.podMat, g, [x, y, 16], [-Math.PI / 2, 0, 0]);
                mesh(new THREE.TorusGeometry(3.3, 0.35, 6, 24), s.engineMat, pod, [0, -7.9, 0], [Math.PI / 2, 0, 0]);
                const flame = mesh(new THREE.ConeGeometry(2.2, 9, 10, 1, true), s.flameMat, pod, [0, -12.5, 0], [Math.PI, 0, 0]);
                const rt = weakMarker(pod, 0xff5a3a, 5.1); rt.position.y = -9; rt.rotation.x = Math.PI / 2;
                parts.push({ mesh: pod, kind: "weak", group: 0, radius: 8, flame, marker: rt });
            });
            [-1, 1].forEach((side) => {
                const base = mesh(new THREE.CylinderGeometry(2.2, 2.6, 2, 10), dark, g, [side * 5, 8, 18]);
                mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 8), dark, base, [0, 0.6, 3], [Math.PI / 2, 0, 0]);
                parts.push({ mesh: base, kind: "turret", radius: 5.5 });
            });
            const core = mesh(new THREE.OctahedronGeometry(4.5, 0), s.coreMat, g, [0, -8.5, 22], [0, 0, 0], [1, 0.8, 1.4]);
            const shieldMesh = mesh(new THREE.BoxGeometry(10, 5, 12), dark, g, [0, -8.5, 22]);
            parts.push({ mesh: core, kind: "weak", group: 1, radius: 8.5, shieldMesh });
            return { group: g, parts, bbox: [13, 10, 36] };
        },
        carrier(skin) {
            const g = new THREE.Group();
            const s = K().shared;
            const hull = K().rimMaterial(skin.hull, 0xffffff, { metalness: 0.35, roughness: 0.5, flat: true, rimStrength: 0.3 });
            const accent = mat(skin.accent), dark = mat(0x2a3038);
            const bomber = skin.style === "bomber";
            // Flying-wing hull
            const shape = new THREE.Shape();
            shape.moveTo(0, -40); shape.lineTo(46, 18); shape.lineTo(40, 30); shape.lineTo(-40, 30); shape.lineTo(-46, 18); shape.lineTo(0, -40);
            const wing = new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 1 });
            wing.rotateX(Math.PI / 2); wing.translate(0, 3, 0);
            mesh(wing, hull, g);
            mesh(new THREE.BoxGeometry(14, 6, 60), hull, g, [0, 4, 0]);
            mesh(new THREE.BoxGeometry(70, 0.4, 2), accent, g, [0, 4.2, 22]);
            const parts = [];
            if (bomber) {
                [-30, -14, 14, 30].forEach((x) => {
                    const eng = mesh(new THREE.CylinderGeometry(3.4, 3, 12, 10), s.podMat, g, [x, -1, 20], [-Math.PI / 2, 0, 0]);
                    mesh(new THREE.TorusGeometry(3.1, 0.3, 6, 20), s.engineMat, eng, [0, -6, 0], [Math.PI / 2, 0, 0]);
                    const rt = weakMarker(eng, 0xff5a3a, 4.6); rt.position.y = -7; rt.rotation.x = Math.PI / 2;
                    parts.push({ mesh: eng, kind: "weak", group: 0, radius: 7.5, marker: rt });
                });
            } else {
                [-18, 18].forEach((x) => {
                    const bay = mesh(new THREE.BoxGeometry(14, 6, 2), glowMat(0xffd060), g, [x, 1, 30.5]);
                    mesh(new THREE.BoxGeometry(16, 8, 6), dark, g, [x, 1, 27]);
                    const rt = weakMarker(bay, 0xff5a3a, 7); rt.position.z = 1.2;
                    parts.push({ mesh: bay, kind: "weak", group: 0, radius: 9, marker: rt });
                });
            }
            const bridge = mesh(new THREE.BoxGeometry(10, 12, 12), dark, g, [0, 12, 14]);
            const bridgeCore = mesh(new THREE.BoxGeometry(8, 3, 1), s.coreMat, bridge, [0, 2, 6.2]);
            const shieldMesh = mesh(new THREE.BoxGeometry(11, 5, 2), dark, bridge, [0, 2, 7]);
            parts.push({ mesh: bridgeCore, kind: "weak", group: 1, radius: 9, shieldMesh });
            [-1, 1].forEach((side) => {
                const base = mesh(new THREE.CylinderGeometry(2.2, 2.6, 2, 10), dark, g, [side * 30, 8, 10]);
                mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 8), dark, base, [0, 0.6, 3], [Math.PI / 2, 0, 0]);
                parts.push({ mesh: base, kind: "turret", radius: 5.5 });
            });
            return { group: g, parts, bbox: [44, 10, 38] };
        },
        cruiser(skin) {
            const g = new THREE.Group();
            const s = K().shared;
            const hull = K().rimMaterial(skin.hull, 0xffffff, { metalness: 0.3, roughness: 0.45, flat: true, rimStrength: 0.35 });
            const accent = mat(skin.accent), dark = mat(0x2a3038);
            const profile = [[0, -50], [4, -44], [8, -30], [9, 0], [8.5, 30], [6, 44], [0, 48]].map(([r, z]) => new THREE.Vector2(r, z));
            const hg = new THREE.LatheGeometry(profile, 8); hg.rotateX(Math.PI / 2);
            mesh(hg, hull, g, [0, 0, 0], [0, 0, 0], [1.1, 0.7, 1]);
            mesh(new THREE.BoxGeometry(2, 14, 30), accent, g, [0, 8, 10]);
            const parts = [];
            [[-11, -8], [11, -8], [-11, 14], [11, 14]].forEach(([x, z]) => {
                const rack = mesh(new THREE.BoxGeometry(6, 5, 12), dark, g, [x, 4, z]);
                for (let k = 0; k < 4; k++) mesh(new THREE.CylinderGeometry(0.6, 0.6, 2, 8), glowMat(0xff6040), rack, [-1.5 + (k % 2) * 3, 2.6, -3 + Math.floor(k / 2) * 6]);
                const rt = weakMarker(rack, 0xff5a3a, 5); rt.rotation.x = -Math.PI / 2; rt.position.y = 3.2;
                parts.push({ mesh: rack, kind: "weak", group: 0, radius: 7.5, marker: rt });
            });
            const core = mesh(new THREE.SphereGeometry(4, 12, 10), s.coreMat, g, [0, 0, 44]);
            const shieldMesh = mesh(new THREE.CylinderGeometry(5, 5, 8, 10), dark, g, [0, 0, 44], [Math.PI / 2, 0, 0]);
            parts.push({ mesh: core, kind: "weak", group: 1, radius: 8, shieldMesh });
            [-1, 1].forEach((side) => {
                const base = mesh(new THREE.CylinderGeometry(2, 2.4, 2, 10), dark, g, [side * 6, 7, 30]);
                parts.push({ mesh: base, kind: "turret", radius: 5 });
            });
            return { group: g, parts, bbox: [12, 9, 48] };
        },
        serpent(skin) {
            const g = new THREE.Group();
            const s = K().shared;
            const body = K().rimMaterial(skin.hull, skin.accent, { metalness: 0.2, roughness: 0.45, flat: true, rimStrength: 0.6 });
            const accent = mat(skin.accent, { emissive: skin.accent, emissiveIntensity: 0.4 });
            const head = new THREE.Group();
            mesh(new THREE.ConeGeometry(7, 20, 8), body, head, [0, 0, -8], [-Math.PI / 2, 0, 0]);
            mesh(new THREE.BoxGeometry(12, 4, 12), body, head, [0, -4, -4]);
            [-1, 1].forEach((side) => mesh(new THREE.ConeGeometry(1.4, 9, 6), accent, head, [side * 4, 6, 2], [0.6, 0, side * -0.3]));
            const eye = mesh(new THREE.SphereGeometry(2.6, 10, 8), s.coreMat, head, [0, 3, -6]);
            g.add(head);
            const segments = [];
            const parts = [];
            const n = 11;
            for (let i = 0; i < n; i++) {
                const seg = new THREE.Group();
                const r = 6.5 - i * 0.35;
                mesh(new THREE.IcosahedronGeometry(r, 1), body, seg);
                if (skin.style === "dragon" || skin.style === "feathered") {
                    [-1, 1].forEach((side) => mesh(new THREE.ConeGeometry(1.2, 6, 5), accent, seg, [side * r, r * 0.6, 0], [0, 0, side * -0.9]));
                }
                if (i % 2 === 1) {
                    const orb = mesh(new THREE.SphereGeometry(2.2, 10, 8), glowMat(skin.accent), seg, [0, r * 0.9, 0]);
                    parts.push({ mesh: orb, kind: "weak", group: 0, radius: 5.5, segmentIndex: i });
                }
                g.add(seg);
                segments.push(seg);
            }
            const shieldMesh = mesh(new THREE.SphereGeometry(3.2, 8, 6), mat(0x222222), head, [0, 3, -6]);
            parts.push({ mesh: eye, kind: "weak", group: 1, radius: 7, shieldMesh });
            return { group: g, parts, bbox: [8, 8, 10], head, segments };
        },
        fortress(skin) {
            const g = new THREE.Group();
            const s = K().shared;
            const hull = K().rimMaterial(skin.hull, skin.accent, { metalness: 0.3, roughness: 0.5, flat: true, rimStrength: 0.5 });
            const accent = mat(skin.accent, { emissive: skin.accent, emissiveIntensity: 0.35 });
            const dark = mat(0x2a3038);
            const style = skin.style;
            if (style === "castle") {
                mesh(new THREE.ConeGeometry(30, 34, 8), mat(0x6a6458), g, [0, -20, 0], [Math.PI, 0, 0]);
                mesh(new THREE.CylinderGeometry(28, 28, 4, 8), mat(0x4a9a4a), g, [0, -2, 0]);
                mesh(new THREE.BoxGeometry(22, 26, 22), hull, g, [0, 13, 0]);
                [[-14, -14], [14, -14], [-14, 14], [14, 14]].forEach(([x, z]) => { mesh(new THREE.CylinderGeometry(4, 4, 30, 8), hull, g, [x, 15, z]); mesh(new THREE.ConeGeometry(5, 10, 8), mat(0x2a4a8a), g, [x, 35, z]); });
            } else if (style === "idol") {
                mesh(new THREE.BoxGeometry(26, 34, 22), hull, g, [0, 0, 0]);
                mesh(new THREE.BoxGeometry(30, 6, 24), hull, g, [0, 18, 0]);
                mesh(new THREE.BoxGeometry(8, 10, 4), dark, g, [0, -6, 11.5]);
            } else if (style === "pyramid") {
                const pg = new THREE.ConeGeometry(26, 36, 4); pg.rotateY(Math.PI / 4);
                mesh(pg, hull, g, [0, 0, 0]);
                const ip = new THREE.ConeGeometry(18, 24, 4); ip.rotateY(Math.PI / 4);
                mesh(ip, hull, g, [0, -26, 0], [Math.PI, 0, 0]);
            } else if (style === "prism") {
                mesh(new THREE.OctahedronGeometry(22, 0), hull, g, [0, 0, 0], [0, 0, 0], [1, 1.4, 1]);
            } else if (style === "satellite") {
                mesh(new THREE.CylinderGeometry(9, 9, 30, 12), hull, g, [0, 0, 0], [Math.PI / 2, 0, 0]);
                mesh(new THREE.ConeGeometry(12, 8, 16, 1, true), mat(0xe8e8e8, { side: THREE.DoubleSide }), g, [0, 0, 20], [-Math.PI / 2, 0, 0]);
            } else {
                // reactor
                mesh(new THREE.CylinderGeometry(14, 18, 24, 10), hull, g, [0, 0, 0]);
                mesh(new THREE.TorusGeometry(18, 2, 8, 24), accent, g, [0, 0, 0], [Math.PI / 2, 0, 0]);
                mesh(new THREE.CylinderGeometry(6, 10, 14, 10), dark, g, [0, 18, 0]);
            }
            const parts = [];
            const orbit = new THREE.Group();
            g.add(orbit);
            const gens = style === "satellite" ? 4 : 3;
            for (let i = 0; i < gens; i++) {
                const a = (i / gens) * Math.PI * 2;
                let gen;
                if (style === "satellite") {
                    gen = mesh(new THREE.BoxGeometry(18, 0.6, 9), mat(0x2a4a8a, { emissive: 0x1a2a6a, emissiveIntensity: 0.6 }), orbit, [Math.cos(a) * 26, 0, Math.sin(a) * 26], [0, -a, 0]);
                } else if (style === "pyramid") {
                    gen = mesh(new THREE.BoxGeometry(4, 22, 4), accent, orbit, [Math.cos(a) * 34, 0, Math.sin(a) * 34]);
                } else {
                    gen = mesh(new THREE.OctahedronGeometry(4.5, 0), accent, orbit, [Math.cos(a) * 34, 4, Math.sin(a) * 34], [0, 0, 0], [1, 1.6, 1]);
                }
                parts.push({ mesh: gen, kind: "weak", group: 0, radius: 7.5 });
            }
            const core = mesh(new THREE.IcosahedronGeometry(5.5, 1), s.coreMat, g, [0, style === "idol" ? 4 : 2, style === "satellite" ? 22 : 14]);
            const shieldMesh = mesh(new THREE.IcosahedronGeometry(8, 1), new THREE.MeshBasicMaterial({ color: skin.accent, transparent: true, opacity: 0.35, wireframe: true }), core);
            shieldMesh.scale.setScalar(1 / 5.5 * 8);
            shieldMesh.scale.setScalar(1.5);
            parts.push({ mesh: core, kind: "weak", group: 1, radius: 9, shieldMesh });
            [-1, 1].forEach((side) => {
                const base = mesh(new THREE.CylinderGeometry(2.4, 2.8, 2.4, 10), dark, g, [side * 14, 12, 10]);
                parts.push({ mesh: base, kind: "turret", radius: 5.5 });
            });
            return { group: g, parts, bbox: [26, 22, 26], orbit };
        },
        walker(skin) {
            const g = new THREE.Group();
            const s = K().shared;
            const hull = K().rimMaterial(skin.hull, skin.accent, { metalness: 0.3, roughness: 0.55, flat: true, rimStrength: 0.4 });
            const accent = mat(skin.accent, { emissive: skin.accent, emissiveIntensity: 0.5 });
            const dark = mat(0x22262c);
            const style = skin.style;
            const legs = [];
            let bodyY = 26, bbox = [26, 30, 30];
            if (style === "vacuum") {
                mesh(new THREE.CylinderGeometry(30, 30, 10, 28), hull, g, [0, 6, 0]);
                mesh(new THREE.CylinderGeometry(26, 26, 1, 28), accent, g, [0, 11.2, 0]);
                [-1, 1].forEach((side) => { const br = mesh(new THREE.CylinderGeometry(7, 7, 2, 6), dark, g, [side * 22, 1.5, -20]); legs.push(br); });
                bodyY = 0; bbox = [31, 12, 31];
            } else if (style === "train") {
                for (let k = 0; k < 4; k++) {
                    const cz = (k - 1.5) * 34;
                    mesh(new THREE.BoxGeometry(18, 16, 30), k === 0 ? hull : mat([0x2f6ad8, 0x3aa84a, 0xf2c23a][k - 1]), g, [0, 10, cz]);
                    [-1, 1].forEach((side) => [-8, 8].forEach((wz) => legs.push(mesh(new THREE.CylinderGeometry(4, 4, 2, 10), dark, g, [side * 9.5, 4, cz + wz], [0, 0, Math.PI / 2]))));
                }
                mesh(new THREE.CylinderGeometry(3, 3.6, 12, 10), dark, g, [0, 22, -58]);
                mesh(new THREE.BoxGeometry(14, 8, 10), hull, g, [0, 22, -44]);
                bodyY = 0; bbox = [10, 12, 66];
            } else if (style === "kraken") {
                mesh(new THREE.SphereGeometry(22, 14, 12), hull, g, [0, 14, 0], [0, 0, 0], [1, 1.2, 1]);
                for (let k = 0; k < 6; k++) {
                    const a = (k / 6) * Math.PI * 2;
                    const t = new THREE.Group();
                    t.position.set(Math.cos(a) * 18, 0, Math.sin(a) * 18);
                    for (let j = 0; j < 5; j++) mesh(new THREE.SphereGeometry(4 - j * 0.6, 8, 6), hull, t, [Math.cos(a) * j * 5, j * 7, Math.sin(a) * j * 5]);
                    g.add(t);
                    legs.push(t);
                }
                bodyY = 0; bbox = [24, 32, 24];
            } else if (style === "scorpion") {
                mesh(new THREE.BoxGeometry(26, 10, 34), hull, g, [0, 14, 0]);
                const tail = new THREE.Group(); tail.position.set(0, 18, 18);
                for (let j = 0; j < 5; j++) mesh(new THREE.SphereGeometry(4.5 - j * 0.4, 8, 6), hull, tail, [0, j * 6, j * 4 - j * j * 0.9]);
                mesh(new THREE.ConeGeometry(2.4, 7, 6), accent, tail, [0, 30, -6], [-1.2, 0, 0]);
                g.add(tail);
                [-1, 1].forEach((side) => [-10, 0, 10].forEach((z) => { const leg = mesh(new THREE.BoxGeometry(18, 3, 3), dark, g, [side * 18, 8, z], [0, 0, side * 0.5]); legs.push(leg); }));
                bodyY = 0; bbox = [26, 26, 26];
            } else {
                // mech / golem / sphinx: torso on two-four legs
                const quad = style === "sphinx";
                mesh(new THREE.BoxGeometry(quad ? 26 : 24, quad ? 16 : 26, quad ? 48 : 18), hull, g, [0, bodyY + 6, 0]);
                if (quad) {
                    mesh(new THREE.BoxGeometry(18, 22, 16), hull, g, [0, bodyY + 24, -26]);
                    mesh(new THREE.BoxGeometry(24, 18, 4), mat(0x2f6ad8), g, [0, bodyY + 26, -18]);
                } else {
                    mesh(new THREE.BoxGeometry(14, 12, 12), hull, g, [0, bodyY + 25, -2]);
                    mesh(new THREE.BoxGeometry(10, 2, 1), glowMat(skin.accent), g, [0, bodyY + 27, -8.2]);
                    [-1, 1].forEach((side) => mesh(new THREE.BoxGeometry(6, 20, 6), hull, g, [side * 16, bodyY + 6, 0], [0, 0, side * 0.2]));
                }
                const legPos = quad ? [[-10, -18], [10, -18], [-10, 18], [10, 18]] : [[-7, 0], [7, 0]];
                legPos.forEach(([x, z]) => { const leg = mesh(new THREE.BoxGeometry(7, bodyY, 7), dark, g, [x, bodyY / 2, z]); legs.push(leg); });
                if (style === "golem") g.children.forEach((c) => { c.material = mat(0x3a2a26, { emissive: 0x2a0800, emissiveIntensity: 0.4 }); });
                bbox = [20, 40, quad ? 30 : 14];
            }
            const parts = [];
            // Rear-facing weak points: vents / sensors the chasing player can hit.
            const vents = style === "train" ? [[0, 19, -17], [0, 19, 17], [0, 19, 51]] : style === "kraken" ? [[-20, 10, 14], [20, 10, 14], [0, 30, 18], [0, 4, 22]] : style === "vacuum" ? [[-14, 12, 22], [14, 12, 22], [0, 12, 26]] : [[-8, bodyY + 12, 14], [8, bodyY + 12, 14], [0, bodyY + 20, 12]];
            vents.forEach(([x, y, z]) => {
                const v = mesh(new THREE.CylinderGeometry(3.2, 3.2, 2.2, 10), accent, g, [x, y, z], [Math.PI / 2, 0, 0]);
                const rt = weakMarker(v, 0xff5a3a, 4.6); rt.position.y = 1.4; rt.rotation.x = Math.PI / 2;
                parts.push({ mesh: v, kind: "weak", group: 0, radius: 7, marker: rt });
            });
            const coreZ = style === "train" ? -44 : style === "vacuum" ? 0 : 6;
            const coreY = style === "train" ? 30 : style === "vacuum" ? 14 : style === "kraken" ? 26 : bodyY + 32;
            const core = mesh(new THREE.IcosahedronGeometry(4.5, 1), s.coreMat, g, [0, coreY, coreZ]);
            const shieldMesh = mesh(new THREE.BoxGeometry(10, 8, 10), dark, g, [0, coreY, coreZ]);
            parts.push({ mesh: core, kind: "weak", group: 1, radius: 8, shieldMesh });
            [-1, 1].forEach((side) => {
                const base = mesh(new THREE.CylinderGeometry(2.2, 2.6, 2, 10), dark, g, [side * 10, Math.max(12, coreY - 6), 8]);
                parts.push({ mesh: base, kind: "turret", radius: 5 });
            });
            return { group: g, parts, bbox, legs };
        },
        jet(skin) {
            const g = new THREE.Group();
            const s = K().shared;
            const hull = K().rimMaterial(skin.hull, skin.accent, { metalness: 0.45, roughness: 0.35, flat: true, rimStrength: 0.6 });
            const accent = mat(skin.accent, { emissive: skin.accent, emissiveIntensity: 0.3 });
            const shape = new THREE.Shape();
            shape.moveTo(0, -34); shape.lineTo(30, 16); shape.lineTo(12, 14); shape.lineTo(8, 24); shape.lineTo(-8, 24); shape.lineTo(-12, 14); shape.lineTo(-30, 16); shape.lineTo(0, -34);
            const w = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: true, bevelThickness: 1, bevelSize: 1, bevelSegments: 1 });
            w.rotateX(Math.PI / 2); w.translate(0, 1.5, 0);
            mesh(w, hull, g);
            const fus = new THREE.LatheGeometry([[0, -36], [3, -26], [5, -8], [5.5, 14], [4, 26]].map(([r, z]) => new THREE.Vector2(r, z)), 10);
            fus.rotateX(Math.PI / 2);
            mesh(fus, hull, g, [0, 2, 0]);
            [-1, 1].forEach((side) => mesh(new THREE.BoxGeometry(0.8, 9, 8), accent, g, [side * 7, 6, 20], [0, 0, side * 0.35]));
            const parts = [];
            [-1, 1].forEach((side) => {
                const eng = mesh(new THREE.CylinderGeometry(2.8, 2.4, 10, 10), s.podMat, g, [side * 5, 1, 24], [-Math.PI / 2, 0, 0]);
                mesh(new THREE.ConeGeometry(2.2, 9, 10, 1, true), s.flameMat, eng, [0, -9, 0], [Math.PI, 0, 0]);
                const rt = weakMarker(eng, 0xff5a3a, 4.2); rt.position.y = -5.6; rt.rotation.x = Math.PI / 2;
                parts.push({ mesh: eng, kind: "weak", group: 0, radius: 7, marker: rt });
            });
            [-1, 1].forEach((side) => {
                const tip = mesh(new THREE.BoxGeometry(4, 2, 6), accent, g, [side * 24, 1.5, 12]);
                parts.push({ mesh: tip, kind: "weak", group: 1, radius: 6.5 });
            });
            const core = mesh(new THREE.IcosahedronGeometry(3.6, 1), s.coreMat, g, [0, 5, 14]);
            const shieldMesh = mesh(new THREE.BoxGeometry(8, 5, 8), mat(0x22262c), g, [0, 5, 14]);
            parts.push({ mesh: core, kind: "weak", group: 2, radius: 7.5, shieldMesh });
            return { group: g, parts, bbox: [26, 6, 30] };
        },
        galleon(skin) {
            const g = new THREE.Group();
            const s = K().shared;
            const wood = mat(skin.hull), sail = mat(0xe8e0c8, { side: THREE.DoubleSide, emissive: skin.accent, emissiveIntensity: 0.12 }), dark = mat(0x1a1410);
            const hullShape = new THREE.Shape();
            hullShape.moveTo(-10, 0); hullShape.lineTo(10, 0); hullShape.lineTo(14, 12); hullShape.lineTo(-14, 12); hullShape.lineTo(-10, 0);
            const hg = new THREE.ExtrudeGeometry(hullShape, { depth: 70, bevelEnabled: false });
            hg.translate(0, -6, -35);
            mesh(hg, wood, g);
            mesh(new THREE.BoxGeometry(24, 10, 14), wood, g, [0, 11, 28]);
            const parts = [];
            [-24, 0, 22].forEach((z, i) => {
                mesh(new THREE.CylinderGeometry(0.8, 1, 40, 6), dark, g, [0, 24, z]);
                const sl = mesh(new THREE.PlaneGeometry(26, 20, 4, 4), sail, g, [0, 28, z]);
                const pos = sl.geometry.attributes.position;
                for (let k = 0; k < pos.count; k++) pos.setZ(k, Math.cos(pos.getX(k) / 13 * Math.PI / 2) * 3);
                sl.geometry.computeVertexNormals();
                parts.push({ mesh: sl, kind: "weak", group: 0, radius: 11 });
            });
            const lantern = mesh(new THREE.SphereGeometry(3, 10, 8), glowMat(skin.accent), g, [0, 18, 36]);
            const shieldMesh = mesh(new THREE.BoxGeometry(8, 8, 4), dark, g, [0, 18, 37.5]);
            parts.push({ mesh: lantern, kind: "weak", group: 1, radius: 7, shieldMesh });
            [-1, 1].forEach((side) => [-20, -2, 16].forEach((z) => {
                const can = mesh(new THREE.CylinderGeometry(1, 1.2, 6, 8), dark, g, [side * 13, 4, z], [0, 0, side * Math.PI / 2]);
                parts.push({ mesh: can, kind: "turret", radius: 4.5, side });
            }));
            return { group: g, parts, bbox: [14, 30, 38] };
        }
    };

    // ------------------------------------------------------------------
    // Telegraphed hazards owned by bosses: laser sweeps and strikes
    // ------------------------------------------------------------------
    function makeBeam(color) {
        const geom = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
        geom.translate(0, 0.5, 0);
        geom.rotateX(Math.PI / 2);
        const m = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
        m.frustumCulled = false;
        return m;
    }

    const STRIKE_COLORS = { mortar: 0xff8a3a, lightning: 0xbfe4ff, meteor: 0xff5a1a, sand: 0xf2c87a, ice: 0x9fefff, water: 0x6ad8ff };

    function spawnStrike(boss, x, z, style) {
        const scene = boss.group.parent;
        const color = STRIKE_COLORS[style] || 0xff8a3a;
        const ring = new THREE.Mesh(new THREE.RingGeometry(9, 11, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, 0.8, z);
        const column = makeBeam(color);
        column.rotation.set(-Math.PI / 2, 0, 0);
        column.position.set(x, 0, z);
        column.scale.set(0.6, 0.6, 260);
        column.material.opacity = 0.12;
        scene.add(ring, column);
        boss.strikes.push({ ring, column, x, z, t: 0, warn: 1.3, style, hit: false });
    }

    function updateStrikes(boss, delta) {
        const scene = boss.group.parent;
        for (let i = boss.strikes.length - 1; i >= 0; i--) {
            const s = boss.strikes[i];
            s.t += delta;
            if (s.t < s.warn) {
                const k = s.t / s.warn;
                s.ring.scale.setScalar(1.6 - k * 0.6);
                s.ring.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(s.t * 14));
            } else if (s.t < s.warn + 0.45) {
                if (!s.fired) {
                    s.fired = true;
                    s.column.scale.set(s.style === "lightning" ? 2.2 : 6, s.style === "lightning" ? 2.2 : 6, 260);
                    s.column.material.opacity = 0.9;
                    K().explode(new V3(s.x, Math.min(playerShip.position.y, 60), s.z), s.style === "lightning" ? 1.2 : 2);
                    GameAudio.play(s.style === "lightning" ? "thunder" : "explode", 300);
                    if (s.style === "lightning" && window.WorldGfx) WorldGfx.setFlash(0.6);
                }
                s.column.material.opacity = Math.max(0, 0.9 - (s.t - s.warn) * 2);
                if (!s.hit && Math.hypot(playerShip.position.x - s.x, playerShip.position.z - s.z) < 11) {
                    s.hit = true;
                    K().damagePlayer(22, "ALCANZADO POR EL JEFE");
                }
            } else {
                scene.remove(s.ring, s.column);
                s.ring.geometry.dispose(); s.column.geometry.dispose();
                boss.strikes.splice(i, 1);
            }
        }
    }

    function updateLaser(boss, delta) {
        const L = boss.laser;
        if (!L) return;
        L.t += delta;
        const origin = boss.core.mesh.getWorldPosition(tmp);
        const toPlayer = tmp2.copy(playerShip.position).sub(origin);
        const baseYaw = Math.atan2(toPlayer.x, toPlayer.z);
        const sweep = Math.sin(L.t * 1.2) * 0.55;
        const pitch = Math.atan2(toPlayer.y, Math.hypot(toPlayer.x, toPlayer.z));
        L.mesh.position.copy(origin);
        L.mesh.rotation.set(-pitch, baseYaw + sweep, 0, "YXZ");
        const active = L.t > L.warn;
        L.mesh.scale.set(active ? 3.2 : 0.5, active ? 3.2 : 0.5, 700);
        L.mesh.material.opacity = active ? 0.75 + Math.random() * 0.2 : 0.35;
        if (active) {
            // Distance from player to the beam segment.
            const dir = new V3(0, 0, 1).applyEuler(L.mesh.rotation);
            const rel = tmp2.copy(playerShip.position).sub(origin);
            const along = THREE.MathUtils.clamp(rel.dot(dir), 0, 700);
            const closest = dir.multiplyScalar(along);
            if (rel.distanceTo(closest) < 4.5 && L.hitCooldown <= 0) {
                L.hitCooldown = 0.6;
                K().damagePlayer(18, "DESINTEGRADO POR EL LÁSER");
            }
        }
        L.hitCooldown -= delta;
        if (L.t > L.warn + L.duration) {
            boss.group.parent.remove(L.mesh);
            L.mesh.geometry.dispose();
            boss.laser = null;
        }
    }

    // ------------------------------------------------------------------
    // Create / update
    // ------------------------------------------------------------------
    function create(defId, atZ, missionObject, tier) {
        const def = BOSSES[defId] || BOSSES.dreadnought;
        const built = BUILDERS[def.arch](def.skin);
        const t = tier || 1;
        const vitalHp = { weak0: Math.round(3 + t * 1.6), weak1: Math.round(10 + t * 3.5), weak2: Math.round(12 + t * 4) };
        built.parts.forEach((p) => {
            if (p.kind === "turret") {
                p.maxHp = p.hp = 3 + Math.floor(t * 0.8);
                p.disabled = 0;
                const light = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3a2a }));
                light.position.y = 1.8;
                p.mesh.add(light);
                p.light = light;
            } else {
                const groupHp = p.group === 0 ? vitalHp.weak0 : p.group === 1 ? (def.phases.length > 2 ? vitalHp.weak0 + 2 : vitalHp.weak1) : vitalHp.weak2;
                p.maxHp = p.hp = groupHp;
            }
        });
        const L = WorldGfx.lane(atZ);
        built.group.position.set(L.x, Math.min(70, L.ceiling - 25), atZ);
        if (def.move === "ground") built.group.position.y = 0;
        scene.add(built.group);
        const boss = {
            def, defId, group: built.group, mesh: built.group, parts: built.parts, bbox: built.bbox, legs: built.legs || [], orbit: built.orbit,
            head: built.head, segments: built.segments, trail: [],
            phase: 0, alive: true, finished: false, t: 0, speed: 80, timers: {}, strikes: [], laser: null,
            escapeTimer: 0, dying: 0, missionObject, introShown: false, wakeTimer: 2, tier: t
        };
        boss.core = built.parts.filter((p) => p.kind === "weak").slice(-1)[0];
        if (missionObject) missionObject.mesh = built.group;
        refreshExposure(boss);
        return boss;
    }

    function refreshExposure(boss) {
        boss.parts.forEach((p) => {
            if (p.kind === "turret") { p.exposed = p.hp > 0; return; }
            p.exposed = p.group === boss.phase && p.hp > 0;
            if (p.shieldMesh) p.shieldMesh.visible = p.group > boss.phase;
            if (p.marker) p.marker.visible = p.exposed;
        });
    }

    function partWorldPos(p) { return p.mesh.getWorldPosition(new V3()); }

    function targets(boss) {
        return boss.parts.filter((p) => p.exposed && p.hp > 0).map(partWorldPos);
    }

    function boltHit(boss, bolt, segmentHit) {
        let nearWeak = false;
        for (const p of boss.parts) {
            if (!p.exposed || p.hp <= 0) continue;
            const wp = partWorldPos(p);
            if (segmentHit(bolt, wp, p.radius)) {
                hitPart(boss, p, wp);
                return true;
            }
            // Bolts on course for a weak point fly on through the hull instead of being absorbed.
            tmp.copy(wp).sub(bolt.mesh.position);
            tmp2.copy(bolt.vel).normalize();
            const along = tmp.dot(tmp2);
            if (along > -p.radius && tmp.addScaledVector(tmp2, -along).length() < p.radius * 1.3) nearWeak = true;
        }
        if (nearWeak) return false;
        // Armour: absorb bolts that hit the body.
        tmp.copy(bolt.mesh.position).sub(boss.group.position);
        const [hx, hy, hz] = boss.bbox;
        if (Math.abs(tmp.x) < hx && Math.abs(tmp.y - (boss.def.move === "ground" ? hy / 2 : 0)) < hy && Math.abs(tmp.z) < hz) {
            GameAudio.play("armor");
            return true;
        }
        return false;
    }

    function hitPart(boss, p, wp) {
        const k = K();
        p.hp -= k.C.loadout.damage;
        GameAudio.play("hit");
        if (typeof spawnPickupBurst === "function") spawnPickupBurst(wp, 0xffd27a, 5);
        if (p.hp > 0) return;
        if (p.kind === "turret") {
            p.hp = 0;
            p.disabled = 8 + boss.tier * 0.5;
            p.light.visible = false;
            p.mesh.rotation.x = 0.5;
            k.explode(wp, 1.1, true);
            GameAudio.play("explode");
            awardStylePoints("TORRETA KO", 80, wp, "#ffb070");
            k.C.shield = Math.min(k.C.maxShield, k.C.shield + 12);
            showMissionToast("¡Torreta inutilizada! Se reparará en unos segundos");
            refreshExposure(boss);
            return;
        }
        k.explode(wp, 2.2, true);
        GameAudio.play("bigExplode");
        shakeIntensity = Math.max(shakeIntensity, 5);
        p.mesh.visible = false;
        awardStylePoints("PUNTO DÉBIL", 150, wp, "#ffb070");
        if (Math.random() < 0.5 && typeof createFuelObject === "function") {
            const fuel = createFuelObject(wp.clone().add(new V3(0, 0, 40)));
            scene.add(fuel.mesh);
            worldObjects.push(fuel);
        }
        const left = boss.parts.filter((x) => x.kind !== "turret" && x.group === boss.phase && x.hp > 0).length;
        if (left === 0) {
            boss.phase += 1;
            if (boss.phase >= boss.def.phases.length) {
                defeat(boss);
            } else {
                boss.timers = {};
                showMissionToast(`¡Fase ${boss.phase + 1}! Objetivo: ${boss.def.phases[boss.phase].label}`);
                GameAudio.play("bossAlarm");
            }
        }
        refreshExposure(boss);
    }

    function defeat(boss) {
        boss.alive = false;
        boss.dying = 2.2;
        K().setSlowMo(1.4);
        awardStylePoints("¡JEFE DERRIBADO!", 800, boss.group.position, "#ffe36a");
        showMissionToast(`¡${boss.def.name} derrotado!`);
        if (boss.laser) { boss.group.parent.remove(boss.laser.mesh); boss.laser = null; }
    }

    function runAttacks(boss, delta, inRange) {
        const phase = boss.def.phases[Math.min(boss.phase, boss.def.phases.length - 1)];
        if (!inRange) return;
        const k = K();
        const rate = 1 + (boss.tier - 1) * 0.07;
        phase.attacks.forEach((atk, idx) => {
            const key = `${boss.phase}:${idx}`;
            if (boss.timers[key] === undefined) boss.timers[key] = atk.every * (0.5 + idx * 0.3);
            boss.timers[key] -= delta * rate;
            if (boss.timers[key] > 0) return;
            boss.timers[key] = atk.every;
            const origin = boss.core.mesh.getWorldPosition(new V3());
            switch (atk.type) {
                case "spread": {
                    const guns = boss.parts.filter((p) => p.kind === "turret" && p.hp > 0);
                    const sources = guns.length ? guns.map(partWorldPos) : (boss.parts.some((p) => p.kind === "turret") ? [] : [origin]);
                    sources.forEach((o) => {
                        for (let i = 0; i < atk.n; i++) k.fireShot(o, k.aimAtPlayer(o, 145, (i - (atk.n - 1) / 2) * 0.1), 145, 18);
                    });
                    if (sources.length) GameAudio.play("enemyShot");
                    break;
                }
                case "mines":
                    k.dropMine(boss.group.position.clone().add(new V3((Math.random() - 0.5) * 20, boss.def.move === "ground" ? 20 : -10, boss.bbox[2] + 4)));
                    break;
                case "missiles":
                    for (let i = 0; i < atk.count; i++) k.launchMissile(origin.clone().add(new V3((i - (atk.count - 1) / 2) * 10, 6, boss.bbox[2] * 0.6)));
                    GameAudio.play("missile");
                    break;
                case "escorts": {
                    const alive = k.C.fighters.filter((f) => f.alive).length;
                    for (let i = 0; i < atk.count && alive + i < atk.max; i++) k.spawnEscort();
                    showMissionToast("¡Llegan cazas de escolta!");
                    break;
                }
                case "drones": {
                    const fwd = new V3(0, 0, -1).applyEuler(makeFlightEuler(0, flightState.yaw, 0));
                    const c = playerShip.position.clone().addScaledVector(fwd, 320);
                    const L = WorldGfx.lane(c.z);
                    c.x = THREE.MathUtils.clamp(c.x, L.x - L.halfWidth + 30, L.x + L.halfWidth - 30);
                    c.y = THREE.MathUtils.clamp(playerShip.position.y + 6, 30, L.ceiling - 20);
                    k.spawnDroneWave(c, true, "v");
                    break;
                }
                case "laser":
                    if (!boss.laser) {
                        const beam = makeBeam(boss.def.skin.accent || 0xff3a3a);
                        boss.group.parent.add(beam);
                        boss.laser = { mesh: beam, t: 0, warn: 1.1, duration: 2.4, hitCooldown: 0 };
                        GameAudio.play("bossAlarm");
                    }
                    break;
                case "strikes": {
                    for (let i = 0; i < atk.count; i++) {
                        const lead = playerShip.position.clone().addScaledVector(shipVelocity, 1.4 + i * 0.15);
                        spawnStrike(boss, lead.x + (Math.random() - 0.5) * 30 * i, lead.z + (Math.random() - 0.5) * 30 * i, atk.style);
                    }
                    break;
                }
                case "barrage": {
                    const n = atk.n;
                    const toP = playerShip.position.clone().sub(origin).normalize();
                    for (let i = 0; i < n; i++) {
                        const a = (i / n) * Math.PI * 2 + boss.t;
                        const dir = new V3(Math.cos(a), Math.sin(a) * 0.5, Math.sin(a)).multiplyScalar(0.55).add(toP).normalize();
                        k.fireShot(origin, dir, 110, 14);
                    }
                    if (atk.fireworks && typeof spawnPickupBurst === "function") spawnPickupBurst(origin, [0xff3aa0, 0x3affe0, 0xffd23a][Math.floor(Math.random() * 3)], 20);
                    GameAudio.play("enemyShot");
                    break;
                }
            }
        });
    }

    function move(boss, delta) {
        const p = playerShip.position;
        const g = boss.group;
        const def = boss.def;
        const phase = def.phases[Math.min(boss.phase, def.phases.length - 1)];
        const base = (currentAircraftProfile?.handling.baseSpeed || 88);
        const gap = p.z - g.position.z;
        const L = WorldGfx.lane(g.position.z);
        const span = Math.max(20, Math.min(110, L.halfWidth - (boss.bbox[0] + 10)));
        let speed;
        if (def.move === "hover" || def.arch === "fortress") {
            const desiredGap = 230;
            speed = flightSpeed + THREE.MathUtils.clamp((desiredGap - gap) * 0.6, -40, 40);
        } else {
            const mult = (phase.speed || 1) * (def.move === "jet" ? 0.95 : 0.84);
            speed = base * mult;
            if (gap < 110) speed = flightSpeed + 25;
            else if (gap > 420) speed = base * 0.55;
        }
        boss.speed += (speed - boss.speed) * Math.min(1, delta * 1.5);
        g.position.z -= boss.speed * delta;
        const weave = def.move === "jet" ? 0.6 : 0.35;
        const tx = L.x + Math.sin(boss.t * weave) * span;
        let ty;
        if (def.move === "ground") ty = 0;
        else ty = Math.min(L.ceiling - boss.bbox[1] - 12, 62 + Math.sin(boss.t * 0.6) * 22);
        g.position.x += (tx - g.position.x) * Math.min(1, delta * 0.6);
        g.position.y += (ty - g.position.y) * Math.min(1, delta * 0.8);
        if (def.move !== "ground") {
            g.rotation.z = -Math.cos(boss.t * weave) * (def.move === "jet" ? 0.5 : 0.18);
            g.rotation.y = Math.sin(boss.t * weave) * 0.12;
        }
        // Archetype animation
        if (boss.orbit) boss.orbit.rotation.y += delta * 0.6;
        boss.legs.forEach((leg, i) => {
            if (def.skin.style === "vacuum" || def.skin.style === "train") leg.rotation.y += delta * 8;
            else if (def.skin.style === "kraken") leg.rotation.z = Math.sin(boss.t * 2 + i) * 0.3;
            else leg.rotation.x = Math.sin(boss.t * 4 + i * Math.PI) * 0.4;
        });
        if (boss.segments) {
            boss.trail.unshift(g.position.clone());
            if (boss.trail.length > 200) boss.trail.length = 200;
            g.rotation.set(0, 0, 0);
            boss.head.position.set(0, 0, 0);
            boss.segments.forEach((seg, i) => {
                const idx = Math.min(boss.trail.length - 1, (i + 1) * 4);
                const wp = boss.trail[idx];
                seg.position.copy(wp).sub(g.position);
                seg.position.y += Math.sin(boss.t * 3 - i * 0.6) * 3;
            });
        }
        return gap;
    }

    function update(boss, delta) {
        const k = K();
        boss.t += delta;
        updateStrikes(boss, delta);
        updateLaser(boss, delta);
        if (boss.dying > 0) {
            boss.dying -= delta;
            boss.group.position.y -= 14 * delta;
            boss.group.rotation.z += delta * 0.4;
            boss.group.position.z -= 40 * delta;
            if (Math.random() < delta * 9) {
                k.explode(boss.group.position.clone().add(new V3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 10 + 8, (Math.random() - 0.5) * 40)), 1.6, true);
                GameAudio.play("explode");
            }
            if (boss.dying <= 0) {
                k.explode(boss.group.position.clone().add(new V3(0, 8, 0)), 5, true);
                GameAudio.play("bigExplode");
                shakeIntensity = 8;
                if (typeof flashScreen === "function") flashScreen("rgba(255,220,160,1)", 0.6);
                dispose(boss);
                boss.finished = true;
                const mo = boss.missionObject;
                if (mo) {
                    mo.collected = true;
                    missionState.progress = 1;
                    completeCurrentMission();
                }
            }
            return;
        }
        const gap = move(boss, delta);
        const p = playerShip.position;
        boss.parts.forEach((part) => {
            if (part.flame) part.flame.scale.set(1, 0.8 + Math.random() * 0.5, 1);
            if (part.marker) part.marker.rotation.z += delta * 2;
            if (part.kind === "turret") {
                if (part.disabled > 0) {
                    part.disabled -= delta;
                    if (part.disabled <= 0) {
                        part.hp = part.maxHp;
                        part.light.visible = true;
                        part.mesh.rotation.x = 0;
                        refreshExposure(boss);
                    }
                } else if (part.mesh.parent) {
                    tmp.copy(p);
                    part.mesh.parent.worldToLocal(tmp);
                    part.mesh.rotation.y = Math.atan2(tmp.x - part.mesh.position.x, tmp.z - part.mesh.position.z);
                    part.light.visible = Math.sin(boss.t * 6) > -0.3;
                }
            }
        });
        // Slipstream rings let a good chase line catch up.
        boss.wakeTimer -= delta;
        if (boss.wakeTimer <= 0 && gap > 140 && boss.def.move !== "hover" && boss.def.arch !== "fortress" && typeof createBoostRingObject === "function") {
            boss.wakeTimer = 4;
            const L = WorldGfx.lane(boss.group.position.z + boss.bbox[2] + 40);
            const pos = boss.group.position.clone().add(new V3(0, boss.def.move === "ground" ? 26 : -1, boss.bbox[2] + 40));
            pos.y = Math.min(pos.y, L.ceiling - 20);
            const ring = createBoostRingObject(pos, 0);
            scene.add(ring.mesh);
            worldObjects.push(ring);
        }
        const inRange = gap > 0 && gap < 540 && Math.abs(p.x - boss.group.position.x) < 280;
        if (inRange && !boss.introShown) {
            boss.introShown = true;
            showMissionToast(boss.def.intro);
            GameAudio.play("bossAlarm");
        }
        runAttacks(boss, delta, inRange);
        if (gap > 780 || gap < -220 || Math.abs(p.x - boss.group.position.x) > 720) {
            boss.escapeTimer += delta;
            if (boss.escapeTimer > 4) {
                showMissionToast(`${boss.def.name} se escapa... ¡vuelve a interceptarlo!`);
                const L = WorldGfx.lane(p.z - 650);
                boss.group.position.set(L.x, boss.def.move === "ground" ? 0 : Math.min(70, L.ceiling - 25), p.z - 650);
                boss.trail = [];
                boss.escapeTimer = 0;
                boss.introShown = false;
            }
        } else {
            boss.escapeTimer = 0;
        }
        // Ramming the body is fatal.
        tmp.copy(p).sub(boss.group.position);
        const [hx, hy, hz] = boss.bbox;
        const cy = boss.def.move === "ground" ? hy / 2 : 0;
        if (Math.abs(tmp.x) < hx && Math.abs(tmp.y - cy) < hy && Math.abs(tmp.z) < hz) {
            triggerCriticalCrash(`COLISION CON ${boss.def.name}`, "#ff5a4f");
        }
        if (boss.segments) {
            for (const seg of boss.segments) {
                if (seg.getWorldPosition(tmp).distanceTo(p) < 7) { triggerCriticalCrash(`COLISION CON ${boss.def.name}`, "#ff5a4f"); break; }
            }
        }
    }

    function hud(boss) {
        const vital = boss.parts.filter((p) => p.kind !== "turret");
        const total = vital.reduce((a, p) => a + p.maxHp, 0);
        const left = vital.reduce((a, p) => a + Math.max(0, p.hp), 0);
        const phase = boss.def.phases[Math.min(boss.phase, boss.def.phases.length - 1)];
        const groupLeft = vital.filter((p) => p.group === boss.phase && p.hp > 0).length;
        const groupTotal = vital.filter((p) => p.group === boss.phase).length;
        const turrets = boss.parts.filter((p) => p.kind === "turret");
        const tUp = turrets.filter((p) => p.hp > 0).length;
        const label = `Fase ${Math.min(boss.phase + 1, boss.def.phases.length)}/${boss.def.phases.length} · ${phase.label} ${groupLeft}/${groupTotal}${turrets.length ? ` · Torretas ${tUp}/${turrets.length}` : ""}`;
        return { visible: boss.alive && boss.introShown, fill: total ? left / total : 0, label, name: boss.def.name };
    }

    function dispose(boss) {
        const scene = boss.group.parent;
        if (!scene) return;
        boss.strikes.forEach((s) => scene.remove(s.ring, s.column));
        boss.strikes = [];
        if (boss.laser) scene.remove(boss.laser.mesh);
        boss.laser = null;
        scene.remove(boss.group);
    }

    window.Bosses = { create, update, boltHit, targets, hud, dispose, DEFS: BOSSES };
})();
