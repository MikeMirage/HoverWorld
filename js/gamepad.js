// HoverWorld - Gamepad support (tuned for the PS5 DualSense, works with any
// "standard" mapping pad). Polls the Gamepad API once per frame, exposes analog
// sticks/triggers with radial dead zones, edge-triggered buttons, rumble, and a
// spatial focus navigator so every menu can be driven with the d-pad / stick.
(function () {
    // Standard mapping indices.
    const B = { CROSS: 0, CIRCLE: 1, SQUARE: 2, TRIANGLE: 3, L1: 4, R1: 5, L2: 6, R2: 7, CREATE: 8, OPTIONS: 9, L3: 10, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15, PS: 16, TOUCHPAD: 17 };
    const PS_RE = /dualsense|dualshock|054c|wireless controller|playstation|ps5|ps4/i;
    const GLYPHS = {
        ps: { CROSS: "✕", CIRCLE: "○", SQUARE: "□", TRIANGLE: "△", L1: "L1", R1: "R1", L2: "L2", R2: "R2", OPTIONS: "OPTIONS", LS: "L", RS: "R" },
        xbox: { CROSS: "A", CIRCLE: "B", SQUARE: "X", TRIANGLE: "Y", L1: "LB", R1: "RB", L2: "LT", R2: "RT", OPTIONS: "MENU", LS: "LS", RS: "RS" }
    };
    const LAYERS = ["#cheats-screen", "#pause-screen", "#game-over-screen", "#start-screen"];

    const S = {
        gp: null, index: null, connected: false, type: "ps", id: "",
        lx: 0, ly: 0, rx: 0, ry: 0, l2: 0, r2: 0,
        btn: [], prev: [], active: false, repeatT: 0, repeatDir: null, focus: null,
        listeners: []
    };

    function radial(x, y, dead) {
        const m = Math.hypot(x, y);
        if (m < dead) return [0, 0];
        const k = Math.min(1, (m - dead) / (1 - dead)) / m;
        return [x * k, y * k];
    }

    function pick() {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        let best = null;
        for (const p of pads) {
            if (!p || !p.connected) continue;
            // Prefer the pad used last, then a standard-mapped one.
            if (S.index === p.index) return p;
            if (!best || (p.mapping === "standard" && best.mapping !== "standard")) best = p;
        }
        return best;
    }

    function setActive(on) {
        if (S.active === on) return;
        S.active = on;
        S.justWoke = on;
        document.body.classList.toggle("pad-active", on);
        document.body.classList.toggle("pad-ps", on && S.type === "ps");
        if (!on) clearFocus();
        S.listeners.forEach((fn) => fn("active", on));
    }

    function poll() {
        const gp = pick();
        S.prev = S.btn;
        if (!gp) {
            if (S.connected) { S.connected = false; document.body.classList.remove("pad-connected"); setActive(false); S.listeners.forEach((fn) => fn("disconnect")); }
            S.btn = [];
            S.lx = S.ly = S.rx = S.ry = S.l2 = S.r2 = 0;
            return;
        }
        if (!S.connected || S.id !== gp.id) {
            S.connected = true;
            document.body.classList.add("pad-connected");
            S.id = gp.id;
            S.type = PS_RE.test(gp.id) || !/xbox|xinput|045e/i.test(gp.id) ? "ps" : "xbox";
            S.listeners.forEach((fn) => fn("connect", S.type));
        }
        S.index = gp.index;
        S.gp = gp;
        S.btn = gp.buttons.map((b) => b.pressed || b.value > 0.5);
        const ax = gp.axes;
        [S.lx, S.ly] = radial(ax[0] || 0, ax[1] || 0, 0.12);
        [S.rx, S.ry] = radial(ax[2] || 0, ax[3] || 0, 0.16);
        S.l2 = gp.buttons[B.L2] ? gp.buttons[B.L2].value : 0;
        S.r2 = gp.buttons[B.R2] ? gp.buttons[B.R2].value : 0;
        const any = S.btn.some(Boolean) || Math.hypot(S.lx, S.ly) > 0.3 || Math.hypot(S.rx, S.ry) > 0.3;
        if (any) setActive(true);
    }

    const down = (i) => !!S.btn[i];
    const just = (i) => !!S.btn[i] && !S.prev[i];
    const released = (i) => !S.btn[i] && !!S.prev[i];

    function rumble(weak = 0.4, strong = 0.4, ms = 120) {
        const gp = S.gp;
        if (!gp || !S.active) return;
        try {
            if (gp.vibrationActuator && gp.vibrationActuator.playEffect) {
                gp.vibrationActuator.playEffect("dual-rumble", { duration: ms, weakMagnitude: Math.min(1, weak), strongMagnitude: Math.min(1, strong) });
            } else if (gp.hapticActuators && gp.hapticActuators[0]) {
                gp.hapticActuators[0].pulse(Math.max(weak, strong), ms);
            }
        } catch (e) { /* rumble unsupported */ }
    }

    // ---------------- menu navigation ----------------
    function visible(el) {
        if (!el || el.disabled || el.hidden) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none" || cs.pointerEvents === "none") return false;
        // Faded-out containers (e.g. the hero behind an open sheet) are not navigable.
        for (let p = el; p && p !== document.body; p = p.parentElement) {
            if (parseFloat(getComputedStyle(p).opacity) < 0.05) return false;
        }
        return true;
    }

    function activeLayer() {
        for (const sel of LAYERS) {
            const el = document.querySelector(sel);
            if (el && !el.classList.contains("hidden") && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden") return el;
        }
        return null;
    }

    function candidates(layer) {
        return Array.from(layer.querySelectorAll("button, [data-pad-focus]")).filter((el) => visible(el) && !el.closest(".hidden, [hidden]") && !el.matches(".fire-btn, #pause-btn"));
    }

    function clearFocus(inFlight) {
        if (inFlight) { S.justWoke = false; S.repeatDir = null; }
        if (S.focus) S.focus.classList.remove("pad-focus");
        S.focus = null;
    }

    function setFocus(el) {
        if (S.focus === el) return;
        clearFocus();
        if (!el) return;
        S.focus = el;
        el.classList.add("pad-focus");
        try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }

    function defaultFocus(list, layer) {
        // An open bottom sheet owns the focus.
        const sheet = layer.classList.contains("sheet-open") && layer.querySelector(".meta-panel:not(.is-hidden)");
        const inSheet = sheet && list.find((el) => sheet.contains(el));
        if (inSheet) return inSheet;
        return list.find((el) => el.matches("[data-pad-default]") && visible(el))
            || list.find((el) => el.matches(".primary, .start-primary-cta"))
            || list[0];
    }

    function move(dir, layer) {
        const list = candidates(layer);
        if (!list.length) return;
        if (!S.focus || !list.includes(S.focus)) { setFocus(defaultFocus(list, layer)); return; }
        const a = S.focus.getBoundingClientRect();
        const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
        const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
        let best = null, bestScore = Infinity;
        list.forEach((el) => {
            if (el === S.focus) return;
            const r = el.getBoundingClientRect();
            const dx = r.left + r.width / 2 - ax, dy = r.top + r.height / 2 - ay;
            const along = dx * v[0] + dy * v[1];
            if (along <= 4) return;
            const across = Math.abs(dx * v[1] - dy * v[0]);
            const score = along + across * 2.2;
            if (score < bestScore) { bestScore = score; best = el; }
        });
        if (best) setFocus(best);
    }

    // Called every frame while a menu layer is up. Returns true if it consumed input.
    function updateMenu(delta, onBack) {
        if (!S.connected || !S.active) return false;
        const layer = activeLayer();
        if (!layer) { clearFocus(); return false; }
        const list = candidates(layer);
        if (S.focus && !list.includes(S.focus)) clearFocus();
        if (!S.focus && list.length) setFocus(defaultFocus(list, layer));
        // The first press after picking up the pad only reveals the focus ring.
        if (S.justWoke) { S.justWoke = false; S.repeatDir = "wake"; return true; }

        let dir = null;
        if (down(B.UP) || S.ly < -0.55) dir = "up";
        else if (down(B.DOWN) || S.ly > 0.55) dir = "down";
        else if (down(B.LEFT) || S.lx < -0.55) dir = "left";
        else if (down(B.RIGHT) || S.lx > 0.55) dir = "right";
        if (dir) {
            if (S.repeatDir === "wake") { /* hold from the waking press */ }
            else if (dir !== S.repeatDir) { S.repeatDir = dir; S.repeatT = 0.38; move(dir, layer); }
            else { S.repeatT -= delta; if (S.repeatT <= 0) { S.repeatT = 0.13; move(dir, layer); } }
        } else if (!S.btn.some(Boolean)) {
            S.repeatDir = null;
        }
        // Right stick scrolls long sheets (hangar, workshop...).
        if (Math.abs(S.ry) > 0.2) {
            const sheet = layer.querySelector(".start-meta-sheet, .card") || layer;
            const scroller = [sheet, layer].find((el) => el.scrollHeight > el.clientHeight + 4) || layer;
            scroller.scrollTop += S.ry * delta * 900;
        }
        if (S.repeatDir === "wake") return true;
        if (just(B.CROSS) && S.focus) {
            S.focus.classList.add("pad-press");
            setTimeout(() => S.focus && S.focus.classList.remove("pad-press"), 140);
            S.focus.click();
            rumble(0.25, 0, 40);
            return true;
        }
        if (just(B.CIRCLE) && onBack) { onBack(layer); return true; }
        return true;
    }

    window.addEventListener("gamepadconnected", (e) => { S.index = e.gamepad.index; poll(); });
    window.addEventListener("gamepaddisconnected", () => poll());
    // Touch / mouse / keyboard hand control back to those inputs.
    ["pointerdown", "keydown"].forEach((ev) => window.addEventListener(ev, (e) => { if (e.isTrusted) setActive(false); }, true));

    // Move focus to the first navigable control inside a container.
    function focusIn(container) {
        const layer = activeLayer();
        if (!layer || !S.active || !container) return;
        const list = candidates(layer).filter((el) => container.contains(el));
        const first = list.find((el) => el.matches("[data-pad-default], .selected")) || list[0];
        if (first) setFocus(first);
    }

    window.Pad = {
        B, poll, focusIn, down, just, released, rumble, updateMenu, clearFocus, activeLayer,
        on(fn) { S.listeners.push(fn); },
        glyph(name) { return (GLYPHS[S.type] || GLYPHS.ps)[name] || name; },
        get connected() { return S.connected; },
        get active() { return S.active; },
        get type() { return S.type; },
        get lx() { return S.lx; }, get ly() { return S.ly; },
        get rx() { return S.rx; }, get ry() { return S.ry; },
        get l2() { return S.l2; }, get r2() { return S.r2; }
    };
})();
