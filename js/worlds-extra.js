// HoverWorld - Extra worlds (11-30): palette, decor, weather, music mood, levels and boss.
// Registered into WorldGfx / Weather / GameAudio here; index.html merges EXTRA_WORLDS
// into WORLD_PROFILES, WORLD_LEVELS and LEVEL_THEME_LIBRARY.
(function () {
    const BASE_PAL = {
        skyTop: 0x2f7fd8, horizon: 0xcfe7f4, bottom: 0x9cc6a0, sun: 0xfff0d2, sunElev: 0.6, sunAz: 0.75,
        ground: 0x5ea84a, groundAlt: 0x7fb853, field: 0xc9b75a, rockGround: 0x7d8c6c,
        rock: 0x7f8a8c, rockDark: 0x5c6567, snow: 0xf4f7fa, foliage: 0x3a8a3c, foliageAlt: 0x5aa23e, trunk: 0x6b4a33,
        wall: 0xf1e8d8, roofs: [0xc8553d, 0x3d6fa8, 0x8a4f3a], water: 0x3f9fd0, bank: 0xcbbf8a,
        cloud: 0xffffff, hemiSky: 0xcfe8ff, hemiGround: 0x5a7a40, fogNear: 220, fogFar: 1150
    };
    const pal = (o) => Object.assign({}, BASE_PAL, o);
    const CITY = { kind: "city", ground: "city", trees: ["round"], treeDensity: 0, houses: 0, rocks: 0, fields: 0, noMountains: true };
    const city = (o) => Object.assign({}, CITY, o);

    const WORLDS = [
        {
            id: "ice_grotto", name: "Gruta de Hielo", theme: "ice_cave", boss: "frost_wyrm", fuel: 6, mood: "cold",
            blurb: "Túneles de hielo azul con estalactitas que cuelgan del techo. Vuela fino y no rasques las paredes.",
            challenges: ["Slalom entre estalactitas", "Cristales en la penumbra", "Wyrm de escarcha"],
            palette: pal({ skyTop: 0x0a1a2a, horizon: 0x2a4a6a, bottom: 0x1a2a3a, sun: 0xbfe4ff, sunElev: 0.9, ground: 0xb8d8f0, groundAlt: 0x8ab8d8, field: 0x9ac8e8, rockGround: 0x6a98b8,
                rock: 0x8ac0e0, rockDark: 0x3a6a8a, snow: 0xffffff, water: 0x7ad8ff, bank: 0xd8f0ff, hemiSky: 0x9fd8ff, hemiGround: 0x2a4a6a, fogNear: 60, fogFar: 520 }),
            decor: { kind: "cave", width: 92, ceiling: 82, stalactites: 0.55, stalagmites: 0.25, glowDensity: 0.8, river: "ice", riverWidth: 30, ceilingColor: 0x4a7a9a, stalactiteLabel: "EMPALADO EN UNA ESTALACTITA" },
            weather: { name: "Escarcha", icon: "🧊", layers: [{ kind: "points", preset: "sparkle" }], ground: { snowGlint: 1.4 }, mist: { color: 0xbfe4ff, opacity: 0.14, heights: [6] }, fog: 1, sun: 0.7, wind: 0.1 },
            levels: [["statuettes:4", "flyby_towers:3"], ["shoot_targets:6", "letters:5"], ["survive:22", "dogfight:3"], ["arch_run:3", "boss_dreadnought"]]
        },
        {
            id: "cloud_sea", name: "Mar de Nubes", theme: "cloud_kingdom", boss: "sky_citadel", fuel: 7, mood: "bright",
            blurb: "Islas flotantes sobre un océano de nubes. Aquí abajo no hay suelo: no caigas.",
            challenges: ["Islas colgantes", "Carrera entre nubes", "Ciudadela celeste"],
            palette: pal({ skyTop: 0x3a8ae8, horizon: 0xf2f8ff, bottom: 0xffffff, sun: 0xfff6e0, sunElev: 0.5, ground: 0xf8fbff, groundAlt: 0xe0ecf8, field: 0xffffff, rockGround: 0xd8e4f0,
                rock: 0x8a7a6a, rockDark: 0x5a4a3a, foliage: 0x5ab84a, foliageAlt: 0x7ac85a, cloud: 0xffffff, hemiSky: 0xffffff, hemiGround: 0xc8d8ec, fogNear: 260, fogFar: 1300 }),
            decor: { kind: "sky", ground: "clouds", capColor: 0x5ab84a, river: "none", trees: ["round"], rocks: 0, houses: 0, noMountains: true },
            weather: { name: "Sobre las nubes", icon: "☁️", layers: [{ kind: "points", preset: "pollen" }], ground: { cloudShadow: 0.5, cloudCover: 0.4, wind: [1, 0.2] }, birds: true, fog: 1, sun: 1.05, wind: 0.35, gust: 1.5 },
            levels: [["statuettes:4", "beacon_run"], ["sky_race", "letters:5"], ["dogfight:3", "shoot_targets:6"], ["aerial_refuel", "boss_dreadnought"]]
        },
        {
            id: "titan_base", name: "Base Titán", theme: "enemy_base", boss: "omega_core", fuel: 5, mood: "dark",
            blurb: "Infíltrate en la colosal base enemiga: túneles de acero, focos rojos y defensas por todas partes.",
            challenges: ["Túnel industrial", "Drones de seguridad", "Núcleo Omega"],
            palette: pal({ skyTop: 0x101418, horizon: 0x2a3038, bottom: 0x1a1e24, sun: 0xffc8a0, sunElev: 0.9, ground: 0x4a525c, groundAlt: 0x3a4048, field: 0x5a626c, rockGround: 0x3a4048,
                rock: 0x5a626c, rockDark: 0x2a3038, snow: 0xff5a3a, water: 0xff4a2a, bank: 0x2a2e34, hemiSky: 0xffb090, hemiGround: 0x2a3038, fogNear: 80, fogFar: 640 }),
            decor: { kind: "cave", ground: "metal", straight: true, lights: true, width: 110, ceiling: 95, stalactites: 0.18, stalagmites: 0.1, glowDensity: 0.25, river: "none", ceilingColor: 0x2a3038,
                stalactiteLabel: "CHOQUE CON UNA TUBERÍA", stalagmiteLabel: "CHOQUE CON UNA TORRETA" },
            weather: { name: "Alerta roja", icon: "🚨", layers: [{ kind: "points", preset: "embers" }], ground: {}, fog: 1, sun: 0.8, wind: 0, lava: 0.2 },
            levels: [["shoot_targets:6", "trucks:3"], ["survive:24", "flyby_towers:4"], ["dogfight:4", "shoot_targets:8"], ["survive:18", "boss_dreadnought"]]
        },
        {
            id: "giant_house", name: "Casa Gigante", theme: "toy_house", boss: "robo_vacuum", fuel: 7, mood: "bright",
            blurb: "Eres un avión de juguete en un salón enorme. Sofás, mesas, lámparas… y una aspiradora con muy mal genio.",
            challenges: ["Bajo la mesa", "Patitos de goma", "Robo-aspiradora"],
            palette: pal({ skyTop: 0xfff2d8, horizon: 0xf8e8d0, bottom: 0xe8d0b0, sun: 0xfff0d0, sunElev: 0.9, ground: 0xb07a48, groundAlt: 0x9a6a3a, field: 0xc89060, rockGround: 0x8a5a34,
                rock: 0xd8c8b0, rockDark: 0xa89878, hemiSky: 0xfff4e0, hemiGround: 0x8a6040, fogNear: 260, fogFar: 1100 }),
            decor: { kind: "interior", ground: "wood", wallColor: 0xe8dcc0, trimColor: 0xf8f4ec, ceilingTint: 0xf4f0e8, fabric: 0x3a6aa8, fabric2: 0xc84a3a, river: "none" },
            weather: { name: "Motas de polvo", icon: "🏠", layers: [{ kind: "points", preset: "pollen" }], ground: {}, fog: 1, sun: 1, wind: 0 },
            levels: [["statuettes:4", "letters:5"], ["shoot_targets:6", "arch_run:3"], ["sky_race", "puzzle:5"], ["dogfight:3", "boss_dreadnought"]]
        },
        {
            id: "war_front", name: "Frente de Guerra", theme: "war_zone", boss: "goliath_bomber", fuel: 5, mood: "dark",
            blurb: "Campo de batalla en llamas: tanques, cráteres y cielos llenos de cazas enemigos.",
            challenges: ["Cielo en guerra", "Convoy enemigo", "Bombardero Goliat"],
            palette: pal({ skyTop: 0x5a5448, horizon: 0xb8a088, bottom: 0x8a7a68, sun: 0xffb070, sunElev: 0.22, sunAz: 2.0, ground: 0x6a6448, groundAlt: 0x5a5038, field: 0x7a6a48, rockGround: 0x5a5040,
                rock: 0x6a645a, rockDark: 0x4a443a, foliage: 0x4a5a32, foliageAlt: 0x5a6a3a, trunk: 0x3a2e22, roofs: [0x6a4a3a, 0x5a5a5a, 0x7a5a42], water: 0x5a6a6a, bank: 0x6a5a40,
                hemiSky: 0xd8b898, hemiGround: 0x4a4030, fogNear: 160, fogFar: 900 }),
            decor: { kit: "war", trees: ["dead", "shrub"], treeDensity: 0.4, houses: 0.1, mountain: "mesa", fields: 0, river: "water", riverWidth: 16, rocks: 0.8 },
            weather: { name: "Humo de batalla", icon: "💥", layers: [{ kind: "points", preset: "ash" }], ground: { cloudShadow: 0.5, cloudCover: 0.6 }, mist: { color: 0x8a7a6a, opacity: 0.2, heights: [12, 30] }, fog: 0.75, sun: 0.7, wind: 0.4, gust: 2 },
            levels: [["dogfight:3", "trucks:3"], ["shoot_targets:8", "survive:22"], ["dogfight:5", "cargo_run"], ["survive:20", "boss_dreadnought"]]
        },
        {
            id: "paris", name: "París", theme: "paris_city", boss: "corsair_blimp", fuel: 7, mood: "warm",
            blurb: "Sobrevuela el Sena entre bulevares, tejados de pizarra y la Torre Eiffel. Cuidado con el tráfico.",
            challenges: ["Rasante sobre el Sena", "Bajo la Torre Eiffel", "Dirigible corsario"],
            palette: pal({ skyTop: 0x5a8ac8, horizon: 0xe8e0d8, bottom: 0xc8c0b8, sun: 0xffe8c8, sunElev: 0.35, sunAz: 1.6, ground: 0x8a8478, groundAlt: 0x7a7468, field: 0x6a9a4a,
                water: 0x4a7a8a, bank: 0xb8a888, hemiSky: 0xe8e8f0, hemiGround: 0x6a6458, fogNear: 220, fogFar: 1100 }),
            decor: city({ cityStyle: "paris", landmark: "eiffel", landmarkEvery: 5, river: "water", riverWidth: 60, laneHalf: 115, buildingColors: [0xe8dcc0, 0xd8ccb0, 0xf0e4cc, 0xc8bca0], roofColor: 0x4a525e, boatColor: 0x2a3a5a }),
            weather: { name: "Llovizna parisina", icon: "🌦️", layers: [{ kind: "rain", preset: "drizzle" }], ground: { wet: 0.6, cloudShadow: 0.4, cloudCover: 0.5 }, birds: true, fog: 0.9, sun: 0.7, wind: 0.2, rain: 0.25 },
            levels: [["flyby_towers:3", "letters:5"], ["statuettes:4", "shoot_targets:6"], ["sky_race", "dogfight:3"], ["flyby_towers:4", "boss_dreadnought"]]
        },
        {
            id: "dubai", name: "Dubái Downtown", theme: "dubai_city", boss: "desert_falcon", fuel: 6, mood: "warm",
            blurb: "Rascacielos de cristal, el Burj Khalifa y autopistas de diez carriles en pleno desierto.",
            challenges: ["Entre torres de cristal", "Burj Khalifa", "Halcón del desierto"],
            palette: pal({ skyTop: 0x3a8ad8, horizon: 0xf8e8c8, bottom: 0xe8d0a0, sun: 0xfff0c8, sunElev: 0.55, sunAz: 0.9, ground: 0xd8c098, groundAlt: 0xc8b088, field: 0x6aa84a,
                water: 0x2ab0d0, bank: 0xe8d8b0, hemiSky: 0xfff0d8, hemiGround: 0xb89870, fogNear: 240, fogFar: 1250 }),
            decor: city({ cityStyle: "dubai", landmark: "burj", landmarkEvery: 6, river: "none", laneHalf: 130, buildingColors: [0x8ab0c8, 0xa8c8d8, 0xc8d8e0, 0x6a90a8, 0xd8c8a8], roofColor: 0x9aa4b0 }),
            weather: { name: "Calor y calima", icon: "🌇", layers: [{ kind: "points", preset: "dust" }], ground: { sandFlow: 0.3, cloudShadow: 0.1 }, mist: { color: 0xf0d8a8, opacity: 0.12, heights: [14] }, fog: 0.88, sun: 1.05, wind: 0.3, gust: 1 },
            levels: [["flyby_towers:4", "beacon_run"], ["sky_race", "shoot_targets:6"], ["trucks:3", "dogfight:3"], ["arch_run:3", "boss_dreadnought"]]
        },
        {
            id: "shanghai", name: "Shanghái de Noche", theme: "shanghai_night", boss: "neon_dragon", fuel: 6, mood: "mystic",
            blurb: "El Bund iluminado, la Perla de Oriente y un río lleno de barcos. Neón por todas partes.",
            challenges: ["Neones del Bund", "Perla de Oriente", "Dragón de farolillos"],
            palette: pal({ skyTop: 0x0a0a24, horizon: 0x3a2a5a, bottom: 0x1a1430, sun: 0xffc8f0, sunElev: 0.25, ground: 0x3a3a48, groundAlt: 0x2a2a38, field: 0x2a4a3a,
                water: 0x1a2a4a, bank: 0x3a3a48, hemiSky: 0x8a6ad8, hemiGround: 0x1a1430, fogNear: 200, fogFar: 1050, stars: 0.5 }),
            decor: city({ cityStyle: "shanghai", night: 1, windowColor: 0xffd890, landmark: "pearl", landmark2: "shanghaiTower", landmarkEvery: 5, river: "water", riverWidth: 80, laneHalf: 120,
                neonColors: [0xff3aa0, 0x3affe0, 0xffd23a, 0xff5a3a], buildingColors: [0x3a4050, 0x4a5060, 0x2a3040, 0x5a5a6a], roofColor: 0x2a2e38, boatColor: 0xd84a3a }),
            weather: { name: "Noche húmeda", icon: "🌃", layers: [{ kind: "rain", preset: "drizzle" }], ground: { wet: 1 }, mist: { color: 0x5a4a8a, opacity: 0.12, heights: [8] }, fog: 0.95, sun: 0.4, wind: 0.2, rain: 0.2 },
            levels: [["letters:5", "flyby_towers:3"], ["shoot_targets:7", "statuettes:4"], ["dogfight:4", "survive:22"], ["sky_race", "boss_dreadnought"]]
        },
        {
            id: "tokyo", name: "Neo Tokio", theme: "tokyo_neon", boss: "mecha_kaiju", fuel: 6, mood: "bright",
            blurb: "Calles de neón, la Torre de Tokio y pétalos de cerezo. Y algo enorme se acerca…",
            challenges: ["Sakura entre torres", "Torre de Tokio", "Mecha Kaiju"],
            palette: pal({ skyTop: 0x2a1a5a, horizon: 0xf8a8c8, bottom: 0x8a5a8a, sun: 0xffd0e0, sunElev: 0.18, sunAz: 2.4, ground: 0x4a4a58, groundAlt: 0x3a3a48, field: 0xd88aa8,
                foliage: 0xf8a8c8, foliageAlt: 0xffc8d8, water: 0x3a5a8a, bank: 0x4a4a58, hemiSky: 0xffc8e0, hemiGround: 0x3a2a4a, fogNear: 220, fogFar: 1100 }),
            decor: city({ cityStyle: "tokyo", night: 0.6, windowColor: 0xd8f0ff, landmark: "tokyoTower", landmarkEvery: 6, river: "none", laneHalf: 115,
                neonColors: [0xff3aa0, 0x3affe0, 0x7a5aff], buildingColors: [0xd8d8e0, 0xb8bcc8, 0x9aa0b0, 0xe8e0d8], roofColor: 0x5a5e6a }),
            weather: { name: "Lluvia de sakura", icon: "🌸", layers: [{ kind: "points", preset: "spores" }], ground: { cloudShadow: 0.2 }, fog: 0.95, sun: 0.85, wind: 0.25, gust: 0.5 },
            levels: [["statuettes:4", "flyby_towers:4"], ["shoot_targets:7", "sky_race"], ["dogfight:4", "letters:6"], ["survive:20", "boss_dreadnought"]]
        },
        {
            id: "venice", name: "Venecia", theme: "venice_canals", boss: "ghost_galleon", fuel: 6, mood: "mystic",
            blurb: "Canales estrechos, góndolas y el campanario de San Marcos envueltos en bruma.",
            challenges: ["Rasante por el Gran Canal", "Campanile", "Galeón fantasma"],
            palette: pal({ skyTop: 0x7a8aa8, horizon: 0xe8dcd0, bottom: 0xc8b8a8, sun: 0xffe0c0, sunElev: 0.3, sunAz: 1.9, ground: 0xb89a7a, groundAlt: 0xa88a6a, field: 0x8a9a6a,
                water: 0x3a7a7a, bank: 0xc8a888, hemiSky: 0xf0e0d8, hemiGround: 0x6a5a48, fogNear: 140, fogFar: 820 }),
            decor: city({ cityStyle: "venice", landmark: "campanile", landmarkEvery: 5, river: "water", riverWidth: 70, laneHalf: 105, buildingColors: [0xd8a078, 0xe8c098, 0xc87a5a, 0xf0d8b0, 0xb86a4a], roofColor: 0xa85a3a, boatColor: 0x1a1a1a }),
            weather: { name: "Bruma de laguna", icon: "🌫️", layers: [], ground: { wet: 0.4 }, mist: { color: 0xe8e0d8, opacity: 0.3, heights: [4, 12, 26] }, birds: true, fog: 0.65, sun: 0.6, wind: 0.1 },
            levels: [["letters:5", "statuettes:4"], ["flyby_towers:4", "cargo_run"], ["shoot_targets:7", "dogfight:3"], ["survive:20", "boss_dreadnought"]]
        },
        {
            id: "new_york", name: "Nueva York", theme: "nyc_winter", boss: "flying_fortress", fuel: 6, mood: "cold",
            blurb: "Manhattan nevado: avenidas en cuadrícula, taxis amarillos y el Empire State.",
            challenges: ["Cañones de rascacielos", "Empire State", "Fortaleza volante"],
            palette: pal({ skyTop: 0x6a8ab0, horizon: 0xe0e8f0, bottom: 0xc8d0d8, sun: 0xfff4e8, sunElev: 0.3, sunAz: 1.2, ground: 0xc8ccd4, groundAlt: 0xb0b4bc, field: 0xe8eef4,
                water: 0x4a6a8a, bank: 0xa0a8b0, hemiSky: 0xe8f0ff, hemiGround: 0x7a8088, fogNear: 200, fogFar: 1000 }),
            decor: city({ cityStyle: "ny", landmark: "empire", landmarkEvery: 5, river: "none", laneHalf: 110, buildingColors: [0x9a8a7a, 0x8a7a6a, 0xb8a890, 0x6a6a72, 0xa89880], roofColor: 0x4a4a52 }),
            weather: { name: "Nevada urbana", icon: "🌨️", layers: [{ kind: "points", preset: "snowLight" }], ground: { snowGlint: 0.6, cloudShadow: 0.3 }, fog: 0.85, sun: 0.75, wind: 0.35, gust: 1.5 },
            levels: [["flyby_towers:4", "trucks:3"], ["shoot_targets:8", "letters:6"], ["dogfight:5", "survive:24"], ["sky_race", "boss_dreadnought"]]
        },
        {
            id: "rio", name: "Río de Janeiro", theme: "rio_carnival", boss: "carnival_zeppelin", fuel: 7, mood: "bright",
            blurb: "Bahía turquesa, palmeras, el Cristo Redentor y un carnaval que se ha ido de las manos.",
            challenges: ["Playa de Copacabana", "Cristo Redentor", "Zepelín de carnaval"],
            palette: pal({ skyTop: 0x1a8ae8, horizon: 0xd8f4ff, bottom: 0x8ad8e8, sun: 0xfff6d8, sunElev: 0.6, sunAz: 0.5, ground: 0xe8d8a8, groundAlt: 0xd8c898, field: 0x4ab85a,
                foliage: 0x2a9a4a, foliageAlt: 0x3ab85a, water: 0x1ac0d8, bank: 0xf8e8b8, hemiSky: 0xe0f8ff, hemiGround: 0x6ab87a, fogNear: 240, fogFar: 1200 }),
            decor: city({ cityStyle: "rio", landmark: "cristo", landmarkEvery: 6, river: "water", riverWidth: 90, riverFollow: 0.6, laneHalf: 125, buildingColors: [0xf8f0e0, 0xf2c23a, 0x3ab8a8, 0xff8a6a, 0xe8e0d0], roofColor: 0xc85a3a, boatColor: 0xffffff }),
            weather: { name: "Tropical", icon: "🌴", layers: [], ground: { cloudShadow: 0.7, cloudCover: 0.35 }, birds: true, fog: 1, sun: 1.05, wind: 0.2 },
            levels: [["statuettes:4", "arch_run:3"], ["sky_race", "letters:5"], ["shoot_targets:7", "dogfight:3"], ["survive:20", "boss_dreadnought"]]
        },
        {
            id: "giza", name: "Valle de Giza", theme: "giza_sands", boss: "solar_pharaoh", fuel: 5, mood: "warm",
            blurb: "Pirámides colosales, obeliscos y tormentas de arena en el valle de los faraones.",
            challenges: ["Rasante entre pirámides", "Obeliscos", "Faraón solar"],
            palette: pal({ skyTop: 0x4a8ad0, horizon: 0xf8e0b0, bottom: 0xe8c890, sun: 0xfff0c0, sunElev: 0.45, sunAz: 1.4, ground: 0xe0b878, groundAlt: 0xd0a868, field: 0xc89858, rockGround: 0xc09058,
                rock: 0xc8a070, rockDark: 0x8a6a48, foliage: 0x5a8a3a, water: 0x3a9ab0, bank: 0xe8d098, hemiSky: 0xfff0d0, hemiGround: 0xa8804a, fogNear: 200, fogFar: 1100 }),
            decor: { kit: "pyramids", trees: ["palm", "cactus"], treeDensity: 0.25, houses: 0.05, mountain: "mesa", fields: 0, river: "water", riverWidth: 40, dunes: 1, rocks: 0.5 },
            weather: { name: "Viento del Sáhara", icon: "🏜️", layers: [{ kind: "points", preset: "sand" }], ground: { sandFlow: 0.8, cloudShadow: 0.15 }, dustDevils: true, mist: { color: 0xe8c890, opacity: 0.16, heights: [8] }, fog: 0.75, sun: 0.9, wind: 0.7, gust: 4 },
            levels: [["flyby_towers:4", "puzzle:5"], ["shoot_targets:7", "beacon_run"], ["survive:24", "statuettes:5"], ["dogfight:4", "boss_dreadnought"]]
        },
        {
            id: "jungle_temple", name: "Templo de la Jungla", theme: "jungle_temples", boss: "feathered_serpent", fuel: 6, mood: "warm",
            blurb: "Pirámides mayas cubiertas de lianas y una jungla tan densa que la niebla nunca se va.",
            challenges: ["Ruinas mayas", "Luciérnagas", "Serpiente emplumada"],
            palette: pal({ skyTop: 0x5a9a8a, horizon: 0xd8ecd8, bottom: 0x8ab88a, sun: 0xfff0c8, sunElev: 0.5, ground: 0x2a7a3a, groundAlt: 0x3a8a3a, field: 0x4a9a3a, rockGround: 0x5a6a48,
                rock: 0x7a8a6a, rockDark: 0x4a5a3a, foliage: 0x1a6a2a, foliageAlt: 0x2a8a3a, water: 0x3a8a7a, bank: 0x6a7a48, hemiSky: 0xd8f0d8, hemiGround: 0x2a5a2a, fogNear: 150, fogFar: 860 }),
            decor: { kit: "temples", trees: ["round", "round", "palm"], treeDensity: 1.6, ruins: 0.6, houses: 0, mountain: "peak", fields: 0, river: "water", riverWidth: 22, rocks: 0.6 },
            weather: { name: "Bruma tropical", icon: "🌿", layers: [{ kind: "points", preset: "fireflies" }], ground: { wet: 0.5, cloudShadow: 0.4 }, mist: { color: 0xd8f0d8, opacity: 0.28, heights: [6, 18] }, birds: true, fog: 0.7, sun: 0.75, wind: 0.1 },
            levels: [["statuettes:5", "arch_run:3"], ["letters:6", "flyby_towers:4"], ["shoot_targets:8", "survive:24"], ["puzzle:6", "boss_dreadnought"]]
        },
        {
            id: "dragon_realm", name: "Reino de Dragones", theme: "castle_realm", boss: "red_dragon", fuel: 5, mood: "dark",
            blurb: "Castillos medievales sobre colinas verdes. El cielo arde: el dragón ha despertado.",
            challenges: ["Murallas y torreones", "Lluvia de fuego", "Dragón rojo"],
            palette: pal({ skyTop: 0x5a3a4a, horizon: 0xf0a878, bottom: 0xa87a68, sun: 0xffb070, sunElev: 0.16, sunAz: 2.6, ground: 0x4a8a3a, groundAlt: 0x5a9a42, field: 0x8a9a3a, rockGround: 0x6a6a5a,
                rock: 0x7a7468, rockDark: 0x4a4640, foliage: 0x2a6a2a, foliageAlt: 0x3a7a32, roofs: [0x2a4a8a, 0x8a2a2a, 0x4a4a4a], water: 0x3a6a8a, bank: 0x8a8a6a, hemiSky: 0xffc8a8, hemiGround: 0x3a4a2a, fogNear: 180, fogFar: 1000 }),
            decor: { kit: "castles", trees: ["pine", "round"], treeDensity: 1, houses: 0.35, mountain: "peak", fields: 0.6, river: "water", riverWidth: 20, rocks: 0.6 },
            weather: { name: "Cielo en llamas", icon: "🐉", layers: [{ kind: "points", preset: "embers" }], ground: { cloudShadow: 0.5, cloudCover: 0.5 }, mist: { color: 0xd88a6a, opacity: 0.14, heights: [16] }, fog: 0.85, sun: 0.85, wind: 0.3, gust: 1.5 },
            levels: [["letters:5", "flyby_towers:4"], ["shoot_targets:8", "cargo_run"], ["dogfight:4", "survive:24"], ["arch_run:4", "boss_dreadnought"]]
        },
        {
            id: "synthwave", name: "Synthwave 1984", theme: "neon_grid", boss: "prism", fuel: 6, mood: "mystic",
            blurb: "Una autopista infinita de neón bajo un sol retro. Pirámides de luz y palmeras fosforescentes.",
            challenges: ["La rejilla infinita", "Puertas de neón", "Prisma"],
            palette: pal({ skyTop: 0x1a0a3a, horizon: 0xff6ab0, bottom: 0x3a1a5a, sun: 0xffb03a, sunElev: 0.1, sunAz: 0, ground: 0x1a0a2a, groundAlt: 0x2a0a3a, field: 0x1a0a2a, rockGround: 0x2a1a4a,
                rock: 0x3a2a6a, rockDark: 0x1a0a3a, water: 0x5a2ab8, bank: 0x2a0a3a, hemiSky: 0xff8ad8, hemiGround: 0x2a0a4a, fogNear: 200, fogFar: 1150, stars: 0.8 }),
            decor: { kit: "synth", ground: "grid", night: 1, trees: ["shrub"], treeDensity: 0, houses: 0, mountain: "spire", fields: 0, river: "water", riverWidth: 14, rocks: 0 },
            weather: { name: "Noche retro", icon: "🌆", layers: [{ kind: "points", preset: "sparkle" }], ground: {}, fog: 1, sun: 0.9, wind: 0 },
            levels: [["sky_race", "statuettes:4"], ["arch_run:4", "shoot_targets:7"], ["survive:26", "dogfight:4"], ["sky_race", "boss_dreadnought"]]
        },
        {
            id: "orbit", name: "Órbita", theme: "orbital", boss: "laser_satellite", fuel: 5, mood: "mystic",
            blurb: "Más allá de la atmósfera: asteroides, módulos orbitales y la Tierra bajo tus alas.",
            challenges: ["Campo de asteroides", "Estación orbital", "Satélite láser"],
            palette: pal({ skyTop: 0x000008, horizon: 0x0a1a3a, bottom: 0x2a5a9a, sun: 0xffffff, sunElev: 0.3, sunAz: 1.0, ground: 0x2a5aa8, groundAlt: 0x3a7a5a, field: 0xffffff, rockGround: 0x2a4a8a,
                rock: 0x6a6460, rockDark: 0x3a3634, water: 0x1a4a9a, bank: 0x3a6a4a, cloud: 0xffffff, hemiSky: 0x8ab0ff, hemiGround: 0x1a2a4a, fogNear: 400, fogFar: 1600, stars: 1 }),
            decor: { kind: "sky", space: true, ground: "space", river: "none", trees: ["shrub"], treeDensity: 0, rocks: 0, houses: 0, noMountains: true },
            weather: { name: "Ingravidez", icon: "🛰️", layers: [], ground: {}, fog: 1, sun: 1.1, wind: 0 },
            levels: [["statuettes:4", "shoot_targets:6"], ["dogfight:4", "letters:6"], ["survive:26", "aerial_refuel"], ["dogfight:4", "boss_dreadnought"]]
        },
        {
            id: "volcano_core", name: "Corazón del Volcán", theme: "magma_core", boss: "magma_phoenix", fuel: 4, mood: "dark",
            blurb: "Desciende por los conductos de magma. Ríos de lava, columnas de fuego y un calor insoportable.",
            challenges: ["Ríos de lava", "Columnas ígneas", "Fénix de magma"],
            palette: pal({ skyTop: 0x1a0604, horizon: 0x5a1a0a, bottom: 0x2a0a04, sun: 0xff8a3a, sunElev: 0.9, ground: 0x2a1a16, groundAlt: 0x3a221a, field: 0x4a2a1a, rockGround: 0x2a1a16,
                rock: 0x3a2622, rockDark: 0x1a100c, snow: 0xff6a1a, water: 0xff5a10, bank: 0x2a1610, hemiSky: 0xff7a3a, hemiGround: 0x2a0a04, fogNear: 70, fogFar: 560 }),
            decor: { kind: "cave", width: 100, ceiling: 88, stalactites: 0.35, stalagmites: 0.3, glowDensity: 0.4, river: "lava", riverWidth: 40, ceilingColor: 0x1a100c, stalactiteLabel: "CHOQUE CON ROCA VOLCÁNICA" },
            weather: { name: "Calor extremo", icon: "🔥", layers: [{ kind: "points", preset: "embers" }], ground: { lava: 1 }, mist: { color: 0x8a2a10, opacity: 0.16, heights: [10] }, fog: 1, sun: 0.9, wind: 0.1, lava: 1 },
            levels: [["statuettes:4", "flyby_towers:3"], ["survive:24", "shoot_targets:7"], ["dogfight:4", "arch_run:3"], ["survive:18", "boss_dreadnought"]]
        },
        {
            id: "toy_factory", name: "Fábrica de Juguetes", theme: "toy_factory", boss: "toy_express", fuel: 6, mood: "bright",
            blurb: "Cintas transportadoras, bloques gigantes y trenes de juguete. Todo aquí es más grande que tú.",
            challenges: ["Cinta transportadora", "Torres de bloques", "Tren expreso"],
            palette: pal({ skyTop: 0xf0e8f8, horizon: 0xe8e0f0, bottom: 0xd8d0e0, sun: 0xffffff, sunElev: 0.9, ground: 0x6a7a8a, groundAlt: 0x5a6a7a, field: 0x7a8a9a, rockGround: 0x5a6a7a,
                rock: 0xc8c8d8, rockDark: 0x9a9aa8, hemiSky: 0xffffff, hemiGround: 0x6a6a7a, fogNear: 260, fogFar: 1100 }),
            decor: { kind: "interior", factory: true, ground: "metal", wallColor: 0xd8dce8, trimColor: 0xf2c23a, ceilingTint: 0xe8e8f0, fabric: 0x2f6ad8, fabric2: 0xf2c23a, river: "none" },
            weather: { name: "Turno de noche", icon: "🧸", layers: [{ kind: "points", preset: "sparkle" }], ground: {}, fog: 1, sun: 1, wind: 0 },
            levels: [["statuettes:5", "shoot_targets:6"], ["arch_run:4", "letters:6"], ["sky_race", "survive:24"], ["dogfight:4", "boss_dreadnought"]]
        },
        {
            id: "kraken_ocean", name: "Océano del Kraken", theme: "storm_ocean", boss: "kraken", fuel: 5, mood: "dark",
            blurb: "Mar abierto en plena tormenta: plataformas petrolíferas, islotes y algo enorme bajo las olas.",
            challenges: ["Plataformas en la tormenta", "Islotes rocosos", "Kraken de acero"],
            palette: pal({ skyTop: 0x2a3440, horizon: 0x7a8a98, bottom: 0x4a5a68, sun: 0xd8e0e8, sunElev: 0.3, ground: 0x1a4a6a, groundAlt: 0x2a5a7a, field: 0x1a4a6a, rockGround: 0x2a5a7a,
                rock: 0x5a6060, rockDark: 0x3a4040, foliage: 0x3a6a3a, water: 0x1a4a6a, bank: 0x2a5a7a, hemiSky: 0x9aa8b8, hemiGround: 0x1a3a4a, fogNear: 160, fogFar: 900 }),
            decor: { kit: "ocean", noMountains: true, trees: ["shrub"], treeDensity: 0, houses: 0, mountain: "peak", fields: 0, river: "none", rocks: 0, waves: 1 },
            weather: { name: "Tormenta en alta mar", icon: "🌊", layers: [{ kind: "rain", preset: "storm" }], ground: { wet: 1, cloudShadow: 0.25, cloudCover: 1 }, lightning: true, mist: { color: 0x8a96a8, opacity: 0.2, heights: [10] }, fog: 0.7, sun: 0.35, wind: 0.8, gust: 5, rain: 1 },
            levels: [["shoot_targets:6", "beacon_run"], ["aerial_refuel", "dogfight:4"], ["survive:26", "letters:6"], ["dogfight:4", "boss_dreadnought"]]
        }
    ];

    // Existing worlds get their own bosses too.
    const BASE_BOSSES = {
        frontier_reach: "dreadnought", ember_vale: "sand_scorpion", frostline_expanses: "ice_breaker", neon_tide: "tide_carrier",
        obsidian_spine: "magma_golem", sunscar_dunes: "sphinx", verdant_relics: "ancient_idol", crimson_archipelago: "crimson_leviathan",
        thunder_plate: "storm_colossus", aurora_crown: "aurora_hawk"
    };

    WORLDS.forEach((w) => {
        if (window.WorldGfx) WorldGfx.registerWorld(w.theme, w.palette, w.decor);
        if (window.Weather && Weather.register) Weather.register(w.theme, w.weather);
        if (window.GameAudio && GameAudio.registerWorld) GameAudio.registerWorld(w.theme, w.mood);
    });

    window.EXTRA_WORLDS = WORLDS;
    window.BASE_WORLD_BOSSES = BASE_BOSSES;
})();
