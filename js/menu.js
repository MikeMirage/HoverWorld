// HoverWorld - Front-end menu flow (Nintendo-style).
//   Title → Hub (Adventure / Hangar / Trophies / Options)
//   Adventure → World map (planets on a route) → level pick → take off
// Screens are a simple stack; Back / Esc / Circle pops. Game state lives in
// index.html (saveState, WORLD_PROFILES, startGame...) and is read at runtime.
(function () {
    const WORLD_ICONS = {
        frontier_reach: "🌿", ember_vale: "🦂", frostline_expanses: "❄️", neon_tide: "🌊", obsidian_spine: "🌋",
        sunscar_dunes: "🐫", verdant_relics: "🗿", crimson_archipelago: "🌸", thunder_plate: "⚡", aurora_crown: "🌌",
        ice_grotto: "🧊", cloud_sea: "☁️", titan_base: "🏭", giant_house: "🧸", war_front: "💥", paris: "🗼", dubai: "🏙️",
        shanghai: "🏮", tokyo: "🌸", venice: "🛶", new_york: "🗽", rio: "🎉", giza: "🔺", jungle_temple: "🐍",
        dragon_realm: "🐉", synthwave: "🌆", orbit: "🛰️", volcano_core: "🔥", toy_factory: "🚂", kraken_ocean: "🐙"
    };
    const UPGRADE_ICONS = { fuel_tank: "⛽", control_linkage: "🕹️", landing_suite: "🛬", shield_plating: "🛡️", laser_cannons: "🔫" };
    const UPGRADE_NAMES = { fuel_tank: "Depósito", control_linkage: "Mandos", landing_suite: "Tren de aterrizaje", shield_plating: "Blindaje", laser_cannons: "Cañones láser" };

    const M = { stack: ["title"], tab: { hangar: "planes", trophies: "contracts" }, root: null, seenTitle: false };
    const $ = (sel, el = M.root) => el.querySelector(sel);
    const hex = (n) => `#${(n ?? 0).toString(16).padStart(6, "0")}`;
    const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const sfx = (n) => { try { GameAudio.play(n); } catch (e) { /* audio not ready */ } };

    // ------------------------------------------------------------------ data
    function worldInfo(id) {
        const w = WORLD_PROFILES[id];
        const theme = LEVEL_THEME_LIBRARY[w.themeId] || {};
        const levels = getWorldLevels(w);
        const prog = getLevelProgress(id);
        const stars = prog.stars.reduce((a, b) => a + (b || 0), 0);
        const locked = !saveState.unlockedWorldIds.includes(id);
        const bossDone = !!prog.stars[levels.length - 1];
        const boss = window.Bosses && Bosses.DEFS[w.boss || "dreadnought"];
        return { id, w, theme, levels, prog, stars, maxStars: levels.length * 3, locked, bossDone, boss, index: getWorldIds().indexOf(id), icon: WORLD_ICONS[id] || "✈️" };
    }

    function currentWorldId() { return menuWorldPreviewId || saveState.selectedWorldId; }

    function wallet() {
        const c = saveState.currencies;
        return `<div class="nm-wallet">
            <span class="nm-coin" title="Créditos"><i>🪙</i>${c.credits.toLocaleString("es-ES")}</span>
            <span class="nm-coin" title="Discovery"><i>🔷</i>${c.discovery}</span>
            <span class="nm-coin" title="Piezas"><i>⚙️</i>${c.parts}</span>
        </div>`;
    }

    function header(title, color) {
        return `<header class="nm-head">
            <button type="button" class="nm-back" data-act="back" aria-label="Volver"><span>‹</span><kbd class="pad-glyph" data-glyph="CIRCLE"></kbd></button>
            <div class="nm-ribbon" style="--rib:${color}">${title}</div>
            ${wallet()}
        </header>`;
    }

    // --------------------------------------------------------------- screens
    function titleScreen() {
        return `<section class="nm-screen nm-title" data-screen="title">
            <div class="nm-logo"><span class="l1">HOVER</span><span class="l2">WORLD</span><em>✈</em></div>
            <p class="nm-tagline">¡30 mundos · 30 jefes · un cielo entero por explorar!</p>
            <button type="button" class="nm-press" data-act="go" data-to="hub" data-pad-default>
                <span class="when-touch">Toca para empezar</span><span class="when-pad">Pulsa <kbd class="pad-glyph" data-glyph="CROSS"></kbd> para empezar</span><span class="when-kb">Pulsa <kbd>Enter</kbd> para empezar</span>
            </button>
        </section>`;
    }

    function hubScreen() {
        const wi = worldInfo(saveState.selectedWorldId);
        const lvl = getSelectedLevelIndex(wi.w);
        const aircraft = getSelectedAircraftProfile();
        const achGot = ACHIEVEMENTS.filter((a) => saveState.achievements && saveState.achievements[a.id]).length;
        const daily = ensureDailyContracts();
        const pendingDaily = daily.ids.filter((id) => !daily.claimed[id]).length;
        const totalStars = getWorldIds().reduce((a, id) => a + worldInfo(id).stars, 0);
        return `<section class="nm-screen nm-hub" data-screen="hub">
            <header class="nm-head nm-head-hub">
                <div class="nm-logo small"><span class="l1">HOVER</span><span class="l2">WORLD</span></div>
                ${wallet()}
            </header>
            <div class="nm-hub-grid">
                <button type="button" class="nm-tile t-adventure" data-act="go" data-to="map" data-pad-default>
                    <span class="t-icon bob">🗺️</span>
                    <span class="t-text"><strong>¡A volar!</strong><small>Mapa de mundos · ★ ${totalStars}</small></span>
                    <span class="t-continue" data-act="play" role="button">▶ Continuar <b>${wi.index + 1}-${lvl + 1}</b><em>${esc(wi.w.displayName)}</em></span>
                </button>
                <button type="button" class="nm-tile t-hangar" data-act="go" data-to="hangar">
                    <span class="t-icon">✈️</span>
                    <span class="t-text"><strong>Hangar</strong><small>${esc(aircraft.displayName)}</small></span>
                </button>
                <button type="button" class="nm-tile t-trophies" data-act="go" data-to="trophies">
                    <span class="t-icon">🏆</span>
                    <span class="t-text"><strong>Logros</strong><small>${achGot} / ${ACHIEVEMENTS.length}</small></span>
                    ${pendingDaily ? `<span class="t-badge">${pendingDaily}</span>` : ""}
                </button>
                <button type="button" class="nm-tile t-options" data-act="go" data-to="options">
                    <span class="t-icon spin">⚙️</span>
                    <span class="t-text"><strong>Ajustes</strong><small>Sonido · Mando</small></span>
                </button>
            </div>
        </section>`;
    }

    function mapScreen() {
        const ids = getWorldIds();
        const cur = currentWorldId();
        const nodes = ids.map((id, i) => {
            const wi = worldInfo(id);
            const y = Math.round(Math.sin(i * 0.9) * 46);
            return `<button type="button" class="nm-planet ${id === cur ? "sel" : ""} ${wi.locked ? "locked" : ""} ${wi.bossDone ? "done" : ""}" data-act="world" data-world="${id}"
                style="--sky:${hex(wi.theme.skyColor)};--ground:${hex(wi.theme.groundColor)};--y:${y}px">
                <span class="p-ball"><span class="p-icon">${wi.locked ? "🔒" : wi.icon}</span>${wi.bossDone ? '<span class="p-crown">👑</span>' : ""}</span>
                <span class="p-num">${i + 1}</span>
                <span class="p-name">${esc(wi.w.displayName)}</span>
                ${wi.locked ? "" : `<span class="p-stars">★ ${wi.stars}/${wi.maxStars}</span>`}
                ${id === cur ? '<span class="p-cursor">✈</span>' : ""}
            </button>`;
        }).join("");
        return `<section class="nm-screen nm-map" data-screen="map">
            ${header("Mapa de mundos", "#ff8a3d")}
            <div class="nm-route-wrap">
                <button type="button" class="nm-arrow left" data-act="worldstep" data-dir="-1" aria-label="Mundo anterior">‹<kbd class="pad-glyph" data-glyph="L1"></kbd></button>
                <div class="nm-route" id="nm-route"><div class="nm-route-track">${nodes}</div></div>
                <button type="button" class="nm-arrow right" data-act="worldstep" data-dir="1" aria-label="Mundo siguiente">›<kbd class="pad-glyph" data-glyph="R1"></kbd></button>
            </div>
            ${worldCard(cur)}
        </section>`;
    }

    function worldCard(id) {
        const wi = worldInfo(id);
        const sel = wi.locked ? -1 : getSelectedLevelIndex(wi.w);
        const prevName = WORLD_PROFILES[getWorldIds()[wi.index - 1]]?.displayName;
        const levels = wi.levels.map((lv, i) => {
            const locked = wi.locked || i >= wi.prog.unlocked;
            const isBoss = lv.some((e) => e.startsWith("boss"));
            const st = wi.prog.stars[i] || 0;
            return `<button type="button" class="nm-level ${i === sel ? "sel" : ""} ${locked ? "locked" : ""} ${isBoss ? "boss" : ""}" data-act="level" data-level="${i}" ${locked ? "disabled" : ""}>
                <span class="lv-num">${locked ? "🔒" : isBoss ? "☠" : i + 1}</span>
                <span class="lv-stars">${[0, 1, 2].map((k) => `<b class="${k < st ? "on" : ""}">★</b>`).join("")}</span>
            </button>`;
        }).join('<span class="nm-level-link"></span>');
        const goals = wi.locked ? "" : buildLevelMissions(wi.w, sel).map((m) => `<span class="nm-goal">${esc(m.title)}</span>`).join("");
        const weather = Weather.describe(wi.w.themeId);
        return `<div class="nm-world-card" style="--sky:${hex(wi.theme.skyColor)};--ground:${hex(wi.theme.groundColor)}">
            <div class="wc-info">
                <div class="wc-kicker">Mundo ${wi.index + 1} <span>${getWorldDifficulty(wi.w)}</span></div>
                <h2>${wi.icon} ${esc(wi.w.displayName)}</h2>
                <p>${wi.locked ? `🔒 Derrota al jefe de <b>${esc(prevName || "el mundo anterior")}</b> para desbloquearlo.` : esc(wi.w.blurb)}</p>
                <div class="wc-chips">${weather ? `<span>${weather}</span>` : ""}${wi.boss ? `<span class="boss">☠ ${esc(wi.boss.name)}</span>` : ""}</div>
            </div>
            <div class="wc-levels">
                <div class="nm-levels">${levels}</div>
                <div class="nm-goals">${goals}</div>
            </div>
            <button type="button" class="nm-go" data-act="play" ${wi.locked ? "disabled" : ""} data-pad-default>
                <span>${wi.locked ? "🔒 Bloqueado" : "¡A volar!"}</span><small>${wi.locked ? "" : `Nivel ${wi.index + 1}-${sel + 1}`}</small>
            </button>
        </div>`;
    }

    function hangarScreen() {
        const tab = M.tab.hangar;
        return `<section class="nm-screen nm-hangar" data-screen="hangar">
            ${header("Hangar", "#3d8bff")}
            <div class="nm-tabs">
                <kbd class="pad-glyph" data-glyph="L1"></kbd>
                <button type="button" class="nm-tab ${tab === "planes" ? "on" : ""}" data-act="tab" data-group="hangar" data-tab="planes">✈️ Aviones</button>
                <button type="button" class="nm-tab ${tab === "upgrades" ? "on" : ""}" data-act="tab" data-group="hangar" data-tab="upgrades" ${tab === "upgrades" ? "data-pad-default" : ""}>🔧 Taller</button>
                <kbd class="pad-glyph" data-glyph="R1"></kbd>
            </div>
            <div class="nm-body">${tab === "planes" ? planesPanel() : upgradesPanel()}</div>
        </section>`;
    }

    function planesPanel() {
        const ids = getAircraftIds();
        const statsOf = (p) => { const s = getAircraftStats(p); return [s.handling.baseSpeed, s.fuel.capacity, s.handling.turnSpeed, s.glide.duration]; };
        const all = ids.map((id) => statsOf(AIRCRAFT_PROFILES[id]));
        const max = [0, 1, 2, 3].map((k) => Math.max(...all.map((a) => a[k])));
        const cur = menuAircraftPreviewId || saveState.selectedAircraftId;
        const labels = ["Velocidad", "Depósito", "Manejo", "Planeo"];
        const cards = ids.map((id, i) => {
            const p = AIRCRAFT_PROFILES[id];
            const owned = saveState.unlockedAircraftIds.includes(id);
            const selected = id === saveState.selectedAircraftId;
            const lv = p.livery || {};
            const st = all[i];
            const bars = labels.map((l, k) => `<div class="bar"><span>${l}</span><i><b style="width:${Math.round((st[k] / max[k]) * 100)}%"></b></i></div>`).join("");
            let action;
            if (owned) action = selected ? `<span class="nm-pill ok">✔ Equipado</span>` : `<span class="nm-pill">Equipar</span>`;
            else if (p.price) {
                const can = saveState.currencies.credits >= p.price.credits && saveState.currencies.parts >= p.price.parts;
                action = `<span class="nm-pill buy ${can ? "" : "no"}">🪙 ${p.price.credits}${p.price.parts ? ` · ⚙️ ${p.price.parts}` : ""}</span>`;
            } else action = `<span class="nm-pill no">🔒 Vuela ${AIRCRAFT_UNLOCK_DISTANCE[id] || "?"} m</span>`;
            return `<button type="button" class="nm-plane ${id === cur ? "sel" : ""} ${owned ? "" : "locked"}" data-act="plane" data-plane="${id}" ${selected ? "data-pad-default" : ""}
                style="--c1:${hex(lv.primary)};--c2:${hex(lv.secondary)};--c3:${hex(lv.accent)}">
                <span class="pl-art"><span class="pl-glyph">✈</span></span>
                <strong>${esc(p.displayName)}</strong>
                <small>${esc(p.blurb)}</small>
                <div class="bars">${bars}</div>
                ${action}
            </button>`;
        }).join("");
        return `<div class="nm-planes">${cards}</div>`;
    }

    function upgradesPanel() {
        const cards = Object.keys(UPGRADE_DEFS).map((id) => {
            const def = UPGRADE_DEFS[id];
            const lv = getUpgradeLevel(id);
            const maxed = lv >= def.maxLevel;
            const cost = maxed ? 0 : def.costByLevel[lv];
            const parts = maxed ? 0 : (def.partsByLevel?.[lv] || 0);
            const can = !maxed && saveState.currencies.credits >= cost && saveState.currencies.parts >= parts;
            const pips = Array.from({ length: def.maxLevel }, (_, k) => `<b class="${k < lv ? "on" : ""}"></b>`).join("");
            return `<div class="nm-upgrade">
                <span class="up-icon">${UPGRADE_ICONS[id] || "🔧"}</span>
                <div class="up-text"><strong>${UPGRADE_NAMES[id] || esc(def.displayName)}</strong><small>${esc(def.describe(lv))}</small><span class="pips">${pips}</span></div>
                <button type="button" class="nm-buy ${can ? "" : "no"}" data-act="upgrade" data-upgrade="${id}" ${can ? "" : "disabled"}>
                    ${maxed ? "MAX" : `🪙 ${cost}${parts ? ` <i>⚙️ ${parts}</i>` : ""}`}
                </button>
            </div>`;
        }).join("");
        return `<div class="nm-upgrades">${cards}</div>`;
    }

    function trophiesScreen() {
        const tab = M.tab.trophies;
        const r = saveState.records, t = saveState.totals;
        let body;
        if (tab === "contracts") body = `<div class="nm-list">${renderContractsHtml()}</div>`;
        else if (tab === "achievements") body = renderAchievementsHtml();
        else {
            const totalStars = getWorldIds().reduce((a, id) => a + worldInfo(id).stars, 0);
            const maxStars = getWorldIds().reduce((a, id) => a + worldInfo(id).maxStars, 0);
            const bosses = getWorldIds().filter((id) => worldInfo(id).bossDone).length;
            const rec = [["⭐", "Estrellas", `${totalStars} / ${maxStars}`], ["☠️", "Jefes derrotados", `${bosses} / ${getWorldIds().length}`], ["📏", "Mejor distancia", `${r.bestDistance} m`],
                ["🏅", "Mejor puntuación", r.bestScore.toLocaleString("es-ES")], ["🛫", "Vuelos", t.runs], ["🎯", "Misiones", t.missionsCompleted], ["💎", "Coleccionables", t.collectiblesFound]];
            body = `<div class="nm-records">${rec.map(([i, l, v]) => `<div class="nm-record"><span>${i}</span><small>${l}</small><strong>${v}</strong></div>`).join("")}</div>`;
        }
        const tabBtn = (id, label) => `<button type="button" class="nm-tab ${tab === id ? "on" : ""}" data-act="tab" data-group="trophies" data-tab="${id}" ${tab === id ? "data-pad-default" : ""}>${label}</button>`;
        return `<section class="nm-screen nm-trophies" data-screen="trophies">
            ${header("Logros", "#2fc46b")}
            <div class="nm-tabs"><kbd class="pad-glyph" data-glyph="L1"></kbd>${tabBtn("contracts", "📋 Contratos")}${tabBtn("achievements", "🏆 Logros")}${tabBtn("records", "📊 Récords")}<kbd class="pad-glyph" data-glyph="R1"></kbd></div>
            <div class="nm-body">${body}</div>
        </section>`;
    }

    function optionsScreen() {
        const prefs = GameAudio.prefs;
        const row = (act, icon, label, on, onTxt = "ON", offTxt = "OFF") => `<button type="button" class="nm-option" data-act="${act}" ${act === "opt-sound" ? "data-pad-default" : ""}>
            <span class="op-icon">${icon}</span><span class="op-label">${label}</span>
            <span class="nm-switch ${on ? "on" : ""}"><i></i><em>${on ? onTxt : offTxt}</em></span></button>`;
        return `<section class="nm-screen nm-options" data-screen="options">
            ${header("Ajustes", "#9a5bff")}
            <div class="nm-body nm-options-grid">
                <div class="nm-option-list">
                    ${row("opt-sound", "🔊", "Sonido", !prefs.muted)}
                    ${row("opt-music", "🎵", "Música", prefs.music > 0)}
                    ${row("opt-quality", "✨", "Gráficos", PostFX.getQuality() === "high", "ALTA", "RÁPIDO")}
                    ${row("opt-autofire", "🎯", "Disparo automático", Combat.autoFire)}
                    ${row("opt-invert", "🎮", "Mando: eje Y invertido", padInvertY)}
                    <button type="button" class="nm-option cheats" data-act="cheats"><span class="op-icon">🛠️</span><span class="op-label">Trucos</span><span class="op-go">›</span></button>
                </div>
                <div class="nm-controls">
                    <h3>Controles</h3>
                    <div class="ctl"><b>🎮 Mando</b><span><kbd class="pad-glyph" data-glyph="LS"></kbd> pilotar · <kbd class="pad-glyph" data-glyph="R2"></kbd> disparar · <kbd class="pad-glyph" data-glyph="L2"></kbd> frenar · <kbd class="pad-glyph" data-glyph="RS"></kbd> mirar · <kbd class="pad-glyph" data-glyph="OPTIONS"></kbd> pausa</span></div>
                    <div class="ctl"><b>⌨️ Teclado</b><span><kbd>WASD</kbd> pilotar · <kbd>Espacio</kbd> disparar · <kbd>Esc</kbd> pausa · <kbd>M</kbd> sonido</span></div>
                    <div class="ctl"><b>📱 Táctil</b><span>Arrastra para pilotar · botón rojo para disparar</span></div>
                </div>
            </div>
        </section>`;
    }

    const SCREENS = { title: titleScreen, hub: hubScreen, map: mapScreen, hangar: hangarScreen, trophies: trophiesScreen, options: optionsScreen };

    // ------------------------------------------------------------- rendering
    function render(animate) {
        if (!M.root || typeof saveState === "undefined" || !saveState) return;
        const name = M.stack[M.stack.length - 1];
        const scrollRoute = $("#nm-route") ? $("#nm-route").scrollLeft : null;
        const body = $(".nm-body");
        const bodyScroll = body ? body.scrollTop : 0;
        M.root.innerHTML = SCREENS[name]();
        M.root.dataset.screen = name;
        document.body.dataset.menu = name;
        const scr = $(".nm-screen");
        if (animate) scr.classList.add("enter");
        fillGlyphs();
        if (name === "map") centerRoute(scrollRoute, animate);
        const nb = $(".nm-body");
        if (nb && !animate) nb.scrollTop = bodyScroll;
    }

    function fillGlyphs() {
        M.root.querySelectorAll(".pad-glyph").forEach((k) => { k.textContent = window.Pad ? Pad.glyph(k.dataset.glyph) : k.dataset.glyph; });
    }

    // Dotted flight path through the planet centres (follows the wave).
    function drawRoute() {
        const track = $(".nm-route-track");
        if (!track) return;
        const old = track.querySelector("svg");
        if (old) old.remove();
        // Layout offsets (not client rects) so entry animations don't skew the path.
        const tr = { width: track.scrollWidth, height: track.offsetHeight };
        const pts = Array.from(track.querySelectorAll(".p-ball")).map((b) => {
            const planet = b.parentElement;
            return [planet.offsetLeft + b.offsetLeft + b.offsetWidth / 2, planet.offsetTop + b.offsetTop + b.offsetHeight / 2];
        });
        if (pts.length < 2) return;
        const d = pts.map(([x, y], i) => {
            if (!i) return `M${x},${y}`;
            const [px, py] = pts[i - 1];
            const mx = (px + x) / 2;
            return `C${mx},${py} ${mx},${y} ${x},${y}`;
        }).join(" ");
        track.insertAdjacentHTML("afterbegin", `<svg class="nm-route-svg" width="${tr.width}" height="${tr.height}"><path class="shadow" d="${d}"/><path d="${d}"/></svg>`);
    }

    function centerRoute(prev, smooth) {
        drawRoute();
        const route = $("#nm-route");
        const sel = route && route.querySelector(".nm-planet.sel");
        if (!route || !sel) return;
        if (prev !== null && prev !== undefined) route.scrollLeft = prev;
        const target = sel.offsetLeft + sel.offsetWidth / 2 - route.clientWidth / 2;
        route.scrollTo({ left: target, behavior: smooth === false || prev === null ? "auto" : "smooth" });
    }

    function go(name) {
        if (name === M.stack[M.stack.length - 1]) return;
        if (name === "hub") M.stack = ["hub"]; else M.stack.push(name);
        if (name === "hub") M.seenTitle = true;
        sfx("select");
        render(true);
        focusDefault();
    }

    function back() {
        if (M.stack.length <= 1) { if (M.stack[0] === "hub") return false; go("hub"); return true; }
        const leaving = M.stack.pop();
        if (leaving === "hangar" && menuAircraftPreviewId) { menuAircraftPreviewId = null; refreshMetaUi(); }
        if (leaving === "map" && menuWorldPreviewId) { menuWorldPreviewId = null; refreshMetaUi(); }
        sfx("click");
        render(true);
        focusDefault();
        return true;
    }

    function focusDefault() {
        if (window.Pad && Pad.active) setTimeout(() => Pad.focusIn(M.root.querySelector(".nm-screen")), 30);
    }

    function refocus(selector) {
        if (!(window.Pad && Pad.active)) return;
        const el = M.root.querySelector(selector);
        if (el) Pad.focusIn(el.parentElement && el.matches("button") ? el : el);
    }

    // --------------------------------------------------------------- actions
    function playSelected() {
        const id = currentWorldId();
        if (!saveState.unlockedWorldIds.includes(id)) return;
        saveState.selectedWorldId = id;
        menuWorldPreviewId = null;
        saveProgress();
        sfx("missionStart");
        startGame();
    }

    function stepWorld(dir) {
        const ids = getWorldIds();
        const i = ids.indexOf(currentWorldId());
        const next = ids[(i + dir + ids.length) % ids.length];
        selectWorld(next);
        if (window.Pad && Pad.active) setTimeout(() => refocus(".nm-go:not(:disabled)") || refocus(".nm-planet.sel"), 20);
    }

    function onClick(e) {
        const el = e.target.closest("[data-act]");
        if (!el || !M.root.contains(el)) return;
        if (el.disabled) return;
        const act = el.dataset.act;
        e.stopPropagation();
        switch (act) {
            case "go": go(el.dataset.to); break;
            case "back": back(); break;
            case "play": playSelected(); break;
            case "world": {
                const id = el.dataset.world;
                if (id === currentWorldId()) { if (!worldInfo(id).locked) { const go = $(".nm-go"); if (window.Pad && Pad.active && go) Pad.focusIn(go.parentElement); } break; }
                selectWorld(id);
                break;
            }
            case "worldstep": stepWorld(parseInt(el.dataset.dir, 10)); break;
            case "level": {
                const id = currentWorldId();
                saveState.selectedLevel = saveState.selectedLevel || {};
                saveState.selectedLevel[id] = parseInt(el.dataset.level, 10);
                saveProgress();
                sfx("select");
                refreshMetaUi();
                break;
            }
            case "tab": M.tab[el.dataset.group] = el.dataset.tab; sfx("select"); render(false); break;
            case "plane": selectPlane(el.dataset.plane); break;
            case "upgrade": purchaseUpgrade(el.dataset.upgrade); sfx("reward"); break;
            case "opt-sound": GameAudio.unlock(); GameAudio.toggleMute(); refreshAudioButtons(); render(false); break;
            case "opt-music": GameAudio.setVolume("music", GameAudio.prefs.music > 0 ? 0 : 0.55); refreshAudioButtons(); render(false); break;
            case "opt-quality": PostFX.setQuality(PostFX.getQuality() === "high" ? "low" : "high"); refreshAudioButtons(); render(false); break;
            case "opt-autofire": document.getElementById("pause-autofire-btn").click(); render(false); break;
            case "opt-invert": document.getElementById("pause-invert-btn").click(); render(false); break;
            case "cheats": document.getElementById("cheats-screen").classList.remove("hidden"); break;
        }
        // Keep the pad focus on the same control after a re-render.
        if (window.Pad && Pad.active && ["tab", "plane", "upgrade", "level"].includes(act) || act.startsWith("opt-")) {
            const key = el.dataset.tab ? `[data-tab="${el.dataset.tab}"]` : el.dataset.plane ? `[data-plane="${el.dataset.plane}"]` : el.dataset.upgrade ? `[data-upgrade="${el.dataset.upgrade}"]` : el.dataset.level ? `[data-level="${el.dataset.level}"]` : `[data-act="${act}"]`;
            setTimeout(() => { const t = M.root.querySelector(key); if (t && window.Pad && Pad.active) Pad.focusIn(t.parentElement === M.root ? t : t.parentElement, t); }, 20);
        }
    }

    function selectPlane(id) {
        const p = AIRCRAFT_PROFILES[id];
        const owned = saveState.unlockedAircraftIds.includes(id);
        if (owned) {
            saveState.selectedAircraftId = id;
            menuAircraftPreviewId = null;
            saveProgress();
            sfx("select");
            refreshMetaUi();
            return;
        }
        if (menuAircraftPreviewId === id && p.price) {
            document.getElementById("aircraft-buy-btn").click();
            return;
        }
        menuAircraftPreviewId = id;
        sfx("select");
        refreshMetaUi();
    }

    // ----------------------------------------------------------- public API
    function init() {
        M.root = document.getElementById("nm-root");
        if (!M.root) return;
        M.root.addEventListener("click", onClick);
        document.addEventListener("keydown", (e) => {
            if (!document.body.classList.contains("menu-view") || isPlaying) return;
            if (!document.getElementById("cheats-screen").classList.contains("hidden")) return;
            if (e.key === "Escape" || e.key === "Backspace") { if (back()) e.preventDefault(); }
            else if (M.stack[M.stack.length - 1] === "title" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go("hub"); }
            else if (M.stack[M.stack.length - 1] === "map" && (e.key === "ArrowLeft" || e.key === "ArrowRight") && !(window.Pad && Pad.active)) stepWorld(e.key === "ArrowLeft" ? -1 : 1);
        });
        if (window.Pad) Pad.on(() => fillGlyphs());
        render(true);
    }

    // Called from refreshMetaUi() whenever save data changes.
    function refresh() {
        if (!M.root) return;
        const focused = document.querySelector(".pad-focus");
        const keyAttr = focused && ["data-world", "data-plane", "data-upgrade", "data-level", "data-tab", "data-to", "data-act"].find((a) => focused.hasAttribute(a));
        const key = keyAttr ? `[${keyAttr}="${focused.getAttribute(keyAttr)}"]` : null;
        render(false);
        if (key && window.Pad && Pad.active) {
            const t = M.root.querySelector(key);
            if (t && !t.disabled) setTimeout(() => Pad.focusIn(t.parentElement, t), 0);
            else focusDefault();
        }
    }

    // L1 / R1: change world on the map, switch tabs elsewhere.
    function shoulder(dir) {
        const name = M.stack[M.stack.length - 1];
        if (name === "map") { stepWorld(dir); return; }
        const group = name === "hangar" ? "hangar" : name === "trophies" ? "trophies" : null;
        if (!group) return;
        const tabs = Array.from(M.root.querySelectorAll(`.nm-tab[data-group="${group}"]`)).map((b) => b.dataset.tab);
        const i = tabs.indexOf(M.tab[group]);
        M.tab[group] = tabs[(i + dir + tabs.length) % tabs.length];
        sfx("select");
        render(false);
        focusDefault();
    }

    function toHub() { M.stack = ["hub"]; M.seenTitle = true; render(true); focusDefault(); }
    // Coming back from a flight lands on the world map.
    function showMap() { M.stack = ["hub", "map"]; M.seenTitle = true; render(true); focusDefault(); }

    window.Menu = { init, refresh, back, go, shoulder, toHub, showMap, get screen() { return M.stack[M.stack.length - 1]; } };
})();
