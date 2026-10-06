// HoverWorld - Procedural audio (WebAudio only, no assets).
// Engine + wind loops driven by flight state, synthesized SFX, and a light
// generative soundtrack whose mood follows the selected world.
(function () {
    const PREF_KEY = "hoverworld-audio-v1";
    const prefs = (() => {
        try { return Object.assign({ music: 0.55, sfx: 0.9, muted: false }, JSON.parse(localStorage.getItem(PREF_KEY) || "{}")); }
        catch (e) { return { music: 0.55, sfx: 0.9, muted: false }; }
    })();
    function savePrefs() {
        try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* storage unavailable */ }
    }

    let ctx = null, master, sfxBus, musicBus, noiseBuffer;
    let engine = null, wind = null;
    const music = { playing: false, mood: "bright", nextTime: 0, step: 0, timer: null, intensity: 0.5 };

    const MOODS = {
        bright: { root: 57, scale: [0, 2, 4, 7, 9], prog: [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [7, 11, 14]], tempo: 100, wave: "triangle" },
        warm: { root: 55, scale: [0, 2, 3, 7, 9], prog: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]], tempo: 92, wave: "triangle" },
        cold: { root: 59, scale: [0, 2, 4, 7, 11], prog: [[0, 4, 11], [-3, 0, 7], [5, 9, 16], [2, 7, 11]], tempo: 84, wave: "sine" },
        dark: { root: 50, scale: [0, 1, 3, 7, 8], prog: [[0, 3, 7], [1, 5, 8], [-2, 3, 7], [-4, 0, 3]], tempo: 88, wave: "sawtooth" },
        mystic: { root: 54, scale: [0, 2, 4, 6, 9], prog: [[0, 4, 7], [2, 6, 9], [-1, 2, 6], [4, 7, 11]], tempo: 80, wave: "sine" }
    };
    const WORLD_MOODS = {
        emerald_plains: "bright", neon_coast: "bright", moss_ruins: "warm", golden_dunes: "warm", ember_badlands: "warm",
        frost_tundra: "cold", storm_plateau: "dark", obsidian_ridge: "dark", crimson_isles: "mystic", aurora_highlands: "mystic"
    };

    const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

    function ensure() {
        if (ctx) return true;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        master = ctx.createGain();
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14; comp.ratio.value = 3.5; comp.attack.value = 0.005; comp.release.value = 0.2;
        master.connect(comp).connect(ctx.destination);
        sfxBus = ctx.createGain();
        musicBus = ctx.createGain();
        sfxBus.connect(master);
        musicBus.connect(master);
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        applyVolumes();
        return true;
    }

    function applyVolumes() {
        if (!ctx) return;
        const t = ctx.currentTime;
        master.gain.setTargetAtTime(prefs.muted ? 0 : 0.9, t, 0.05);
        sfxBus.gain.setTargetAtTime(prefs.sfx, t, 0.05);
        musicBus.gain.setTargetAtTime(prefs.music * 0.42, t, 0.05);
    }

    function unlock() {
        if (!ensure()) return;
        if (ctx.state === "suspended") ctx.resume();
    }

    function noise(duration) {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        src.loop = true;
        src.loopStart = Math.random();
        if (duration) src.loopEnd = src.loopStart + duration;
        return src;
    }

    function env(gainNode, t, attack, peak, decay, sustain = 0.0001) {
        gainNode.gain.cancelScheduledValues(t);
        gainNode.gain.setValueAtTime(0.0001, t);
        gainNode.gain.exponentialRampToValueAtTime(peak, t + attack);
        gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain), t + attack + decay);
    }

    function tone(freq, start, dur, opts = {}) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = opts.type || "sine";
        o.frequency.setValueAtTime(freq, start);
        if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, start + dur);
        if (opts.detune) o.detune.value = opts.detune;
        env(g, start, opts.attack ?? 0.005, opts.gain ?? 0.2, dur);
        let out = g;
        if (opts.filter) {
            const f = ctx.createBiquadFilter();
            f.type = "lowpass";
            f.frequency.value = opts.filter;
            g.connect(f);
            out = f;
        }
        o.connect(g);
        out.connect(opts.bus || sfxBus);
        o.start(start);
        o.stop(start + (opts.attack ?? 0.005) + dur + 0.05);
    }

    // ---------- continuous layers ----------
    function startLoops() {
        if (!ensure() || engine) return;
        const t = ctx.currentTime;
        // Engine: two detuned saws + sub sine through a lowpass, with AM "prop chop".
        const eGain = ctx.createGain(); eGain.gain.value = 0;
        const eFilter = ctx.createBiquadFilter(); eFilter.type = "lowpass"; eFilter.frequency.value = 500; eFilter.Q.value = 2;
        const chop = ctx.createGain(); chop.gain.value = 0.6;
        const chopLfo = ctx.createOscillator(); chopLfo.frequency.value = 22;
        const chopDepth = ctx.createGain(); chopDepth.gain.value = 0.35;
        chopLfo.connect(chopDepth).connect(chop.gain);
        const o1 = ctx.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = 62;
        const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = 62; o2.detune.value = 14;
        const sub = ctx.createOscillator(); sub.type = "sine"; sub.frequency.value = 31;
        const subGain = ctx.createGain(); subGain.gain.value = 0.7;
        o1.connect(eFilter); o2.connect(eFilter); sub.connect(subGain).connect(eFilter);
        eFilter.connect(chop).connect(eGain).connect(sfxBus);
        [o1, o2, sub, chopLfo].forEach((o) => o.start(t));
        engine = { gain: eGain, filter: eFilter, o1, o2, sub, chopLfo };

        // Wind: filtered noise whose level & cutoff follow airspeed.
        const wSrc = noise();
        const wFilter = ctx.createBiquadFilter(); wFilter.type = "bandpass"; wFilter.frequency.value = 600; wFilter.Q.value = 0.6;
        const wGain = ctx.createGain(); wGain.gain.value = 0;
        wSrc.connect(wFilter).connect(wGain).connect(sfxBus);
        wSrc.start(t);
        wind = { gain: wGain, filter: wFilter };
    }

    function updateFlight(state) {
        if (!ctx || !engine) return;
        const t = ctx.currentTime;
        const speed = state.speed || 0;
        const k = Math.min(1, speed / 220);
        const on = state.active && state.engineOn;
        const base = 48 + k * 70 + (state.boost || 0) * 12;
        engine.o1.frequency.setTargetAtTime(base, t, 0.12);
        engine.o2.frequency.setTargetAtTime(base * 1.005, t, 0.12);
        engine.sub.frequency.setTargetAtTime(base / 2, t, 0.12);
        engine.chopLfo.frequency.setTargetAtTime(14 + k * 30, t, 0.12);
        engine.filter.frequency.setTargetAtTime(320 + k * 900, t, 0.15);
        engine.gain.gain.setTargetAtTime(on ? 0.11 + k * 0.05 : 0, t, on ? 0.2 : 0.6);
        const windLevel = state.active ? 0.03 + Math.pow(k, 1.6) * 0.22 + (state.gliding ? 0.06 : 0) : 0;
        wind.gain.gain.setTargetAtTime(windLevel, t, 0.25);
        wind.filter.frequency.setTargetAtTime(380 + k * 1400, t, 0.25);
    }

    // ---------- one-shot SFX ----------
    const SFX = {
        click() { const t = ctx.currentTime; tone(1300, t, 0.05, { type: "triangle", gain: 0.06 }); },
        select() { const t = ctx.currentTime; tone(660, t, 0.07, { type: "triangle", gain: 0.08 }); tone(990, t + 0.06, 0.1, { type: "triangle", gain: 0.07 }); },
        pickup(step = 0) {
            const t = ctx.currentTime;
            const base = 72 + Math.min(step, 10) * 2;
            [0, 4, 7, 12].forEach((iv, i) => tone(midi(base + iv), t + i * 0.045, 0.22, { type: "triangle", gain: 0.11 - i * 0.015 }));
            tone(midi(base + 24), t + 0.18, 0.4, { type: "sine", gain: 0.05 });
        },
        fuel() {
            const t = ctx.currentTime;
            tone(300, t, 0.35, { type: "sine", slideTo: 900, gain: 0.14 });
            tone(450, t + 0.05, 0.35, { type: "triangle", slideTo: 1350, gain: 0.06 });
            whoosh(0.35, 0.12, 1800);
        },
        missionComplete() {
            const t = ctx.currentTime;
            const seq = [[67, 0], [71, 0.11], [74, 0.22], [79, 0.33]];
            seq.forEach(([n, d]) => { tone(midi(n), t + d, 0.3, { type: "square", gain: 0.06, filter: 2400 }); tone(midi(n - 12), t + d, 0.3, { type: "triangle", gain: 0.08 }); });
            [79, 83, 86].forEach((n) => tone(midi(n), t + 0.45, 1.1, { type: "triangle", gain: 0.07, attack: 0.02 }));
        },
        missionStart() {
            const t = ctx.currentTime;
            tone(midi(64), t, 0.14, { type: "triangle", gain: 0.08 });
            tone(midi(71), t + 0.12, 0.25, { type: "triangle", gain: 0.08 });
        },
        checkpoint() {
            const t = ctx.currentTime;
            tone(midi(76), t, 0.12, { type: "square", gain: 0.05, filter: 3000 });
            tone(midi(83), t + 0.08, 0.2, { type: "square", gain: 0.05, filter: 3000 });
        },
        nearMiss(level = 1) {
            const t = ctx.currentTime;
            whoosh(0.4, 0.22, 2600);
            tone(midi(84 + level * 2), t + 0.05, 0.18, { type: "triangle", gain: 0.06 });
        },
        boost() {
            const t = ctx.currentTime;
            whoosh(0.6, 0.28, 2200);
            tone(220, t, 0.45, { type: "sawtooth", slideTo: 880, gain: 0.05, filter: 1800 });
            tone(midi(79), t + 0.08, 0.18, { type: "triangle", gain: 0.05 });
        },
        stall() {
            const t = ctx.currentTime;
            tone(880, t, 0.09, { type: "square", gain: 0.05, filter: 2000 });
            tone(880, t + 0.16, 0.09, { type: "square", gain: 0.05, filter: 2000 });
        },
        engineDie() {
            const t = ctx.currentTime;
            tone(140, t, 0.8, { type: "sawtooth", slideTo: 35, gain: 0.12, filter: 600 });
            burst(0.5, 0.18, 500);
        },
        engineRestart() {
            const t = ctx.currentTime;
            tone(50, t, 0.5, { type: "sawtooth", slideTo: 120, gain: 0.12, filter: 900 });
            [0, 0.08, 0.16].forEach((d) => burst(0.05, 0.12, 800, t + d));
        },
        crash() {
            burst(1.4, 0.7, 900);
            burst(0.25, 0.5, 3500);
            const t = ctx.currentTime;
            tone(90, t, 1.2, { type: "sine", slideTo: 28, gain: 0.5 });
        },
        skid() { burst(0.6, 0.2, 2200); },
        touchdown() {
            const t = ctx.currentTime;
            burst(0.15, 0.18, 600);
            tone(midi(72), t + 0.1, 0.2, { type: "triangle", gain: 0.07 });
            tone(midi(76), t + 0.22, 0.2, { type: "triangle", gain: 0.07 });
            tone(midi(79), t + 0.34, 0.6, { type: "triangle", gain: 0.08 });
        },
        reward() {
            const t = ctx.currentTime;
            tone(midi(88), t, 0.08, { type: "square", gain: 0.035, filter: 4000 });
        },
        unlock() {
            const t = ctx.currentTime;
            [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(midi(n), t + i * 0.06, 0.5, { type: "triangle", gain: 0.07 }));
        }
    };

    function whoosh(dur, gain, freq) {
        const t = ctx.currentTime;
        const src = noise();
        const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.2;
        f.frequency.setValueAtTime(freq * 0.4, t);
        f.frequency.exponentialRampToValueAtTime(freq, t + dur * 0.5);
        f.frequency.exponentialRampToValueAtTime(freq * 0.3, t + dur);
        const g = ctx.createGain();
        env(g, t, dur * 0.4, gain, dur * 0.6);
        src.connect(f).connect(g).connect(sfxBus);
        src.start(t); src.stop(t + dur + 0.05);
    }

    function burst(dur, gain, freq, start) {
        const t = start ?? ctx.currentTime;
        const src = noise();
        const f = ctx.createBiquadFilter(); f.type = "lowpass";
        f.frequency.setValueAtTime(freq, t);
        f.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.15), t + dur);
        const g = ctx.createGain();
        env(g, t, 0.004, gain, dur);
        src.connect(f).connect(g).connect(sfxBus);
        src.start(t); src.stop(t + dur + 0.05);
    }

    function play(name, arg) {
        if (!ctx || prefs.muted || !SFX[name]) return;
        try { SFX[name](arg); } catch (e) { /* audio errors must never break gameplay */ }
    }

    // ---------- generative music ----------
    function setWorld(themeId) {
        music.mood = WORLD_MOODS[themeId] || "bright";
    }

    function startMusic() {
        if (!ensure() || music.playing) return;
        music.playing = true;
        music.nextTime = ctx.currentTime + 0.1;
        music.step = 0;
        music.timer = setInterval(scheduleMusic, 60);
    }

    function stopMusic() {
        music.playing = false;
        if (music.timer) clearInterval(music.timer);
        music.timer = null;
    }

    function scheduleMusic() {
        if (!ctx || !music.playing) return;
        const mood = MOODS[music.mood];
        const sixteenth = 60 / mood.tempo / 4;
        while (music.nextTime < ctx.currentTime + 0.25) {
            const step = music.step;
            const bar = Math.floor(step / 16) % mood.prog.length;
            const chord = mood.prog[bar];
            const t = music.nextTime;
            const inBar = step % 16;
            const intensity = music.intensity;
            if (inBar === 0) {
                // pad
                chord.forEach((iv) => {
                    const o = ctx.createOscillator();
                    const o2 = ctx.createOscillator();
                    const g = ctx.createGain();
                    const f = ctx.createBiquadFilter();
                    o.type = mood.wave; o2.type = "sine";
                    o.frequency.value = midi(mood.root + iv); o2.frequency.value = midi(mood.root + iv + 12);
                    o.detune.value = -6; o2.detune.value = 5;
                    f.type = "lowpass"; f.frequency.value = mood.wave === "sawtooth" ? 700 : 1600;
                    const dur = sixteenth * 16;
                    g.gain.setValueAtTime(0.0001, t);
                    g.gain.exponentialRampToValueAtTime(0.05, t + dur * 0.3);
                    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.05);
                    o.connect(f); o2.connect(f); f.connect(g).connect(musicBus);
                    o.start(t); o2.start(t); o.stop(t + dur * 1.1); o2.stop(t + dur * 1.1);
                });
                // bass
                tone(midi(mood.root - 12 + chord[0]), t, sixteenth * 7, { type: "triangle", gain: 0.16, bus: musicBus, attack: 0.01 });
            }
            if (inBar === 8) tone(midi(mood.root - 12 + chord[0] + 7), t, sixteenth * 6, { type: "triangle", gain: 0.12, bus: musicBus, attack: 0.01 });
            // arpeggio, density follows intensity
            const arpOn = inBar % 2 === 0 || (intensity > 0.6 && inBar % 2 === 1 && Math.random() < 0.4);
            if (arpOn && (intensity > 0.25 || inBar % 4 === 0)) {
                const tones = chord.concat(chord.map((x) => x + 12));
                const n = tones[(step * 3 + bar) % tones.length];
                tone(midi(mood.root + 12 + n), t, sixteenth * 1.6, { type: "triangle", gain: 0.035 + intensity * 0.02, bus: musicBus, filter: 2600 });
            }
            // soft percussion when intensity is high
            if (intensity > 0.45) {
                if (inBar % 8 === 0) kick(t, 0.22 * intensity);
                if (inBar % 4 === 2) hat(t, 0.035 * intensity);
            }
            music.nextTime += sixteenth;
            music.step += 1;
        }
    }

    function kick(t, gain) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        env(g, t, 0.003, gain, 0.2);
        o.connect(g).connect(musicBus);
        o.start(t); o.stop(t + 0.25);
    }
    function hat(t, gain) {
        const src = noise();
        const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7000;
        const g = ctx.createGain();
        env(g, t, 0.002, gain, 0.05);
        src.connect(f).connect(g).connect(musicBus);
        src.start(t); src.stop(t + 0.08);
    }

    function setIntensity(v) {
        music.intensity = Math.max(0, Math.min(1, v));
    }

    function setMuted(m) {
        prefs.muted = m;
        savePrefs();
        applyVolumes();
    }
    function toggleMute() { setMuted(!prefs.muted); return prefs.muted; }
    function setVolume(kind, value) {
        prefs[kind] = value;
        savePrefs();
        applyVolumes();
    }

    window.GameAudio = {
        unlock, startLoops, updateFlight, play, setWorld, startMusic, stopMusic, setIntensity,
        toggleMute, setMuted, setVolume, get prefs() { return prefs; }
    };
})();
