/* Motor de respiración: pasos, temporización, sonido y vibración */
(function () {
  "use strict";
  const KIND = {
    in: { label: "Inspira", tone: "warm" }, hold: { label: "Retén", tone: "warm" },
    out: { label: "Espira", tone: "cool" }, holdEmpty: { label: "Retén vacío", tone: "cool" },
    rapid: { label: "Expulsa", tone: "cool" }, rest: { label: "Descansa", tone: "rest" }
  };

  function loadPreset(METRO, tech, key, saved) {
    if (!METRO[tech]) tech = "conciencia";
    const T = METRO[tech];
    const pr = T.presets.find(p => p.key === key) || T.presets[0];
    saved = saved || {};
    const c = { tech, preset: pr.key, type: T.type, alt: !!T.alt, labels: T.labels || {}, startEmpty: !!T.startEmpty, unit: saved.unit || 1, mode: T.mode || "ciclos", amount: T.amount || 1 };
    if (T.type === "cycle") c.p = pr.p.slice();
    if (T.type === "viloma") Object.assign(c, { v: pr.v, stages: pr.stages, stage: pr.stage, final: pr.final, cont: pr.cont });
    if (T.type === "rapid") Object.assign(c, { count: pr.count, tempo: pr.tempo, rounds: pr.rounds, rest: pr.rest, mode: "ciclos", amount: 1 });
    if (T.type === "bhastrika") Object.assign(c, { count: pr.count, tempo: pr.tempo, rounds: pr.rounds }, T.extra, { mode: "ciclos", amount: 1 });
    return c;
  }

  function buildSteps(c) {
    const s = [], u = c.unit || 1, lab = c.labels || {};
    const push = (kind, secs, extra) => { if (secs > 0) s.push(Object.assign({ kind, dur: secs, label: lab[kind] || KIND[kind].label }, extra || {})); };
    if (c.type === "rest") { push("rest", c.secs, { label: c.label || "Shavasana", sub: c.sub || "Túmbate y respira con normalidad" }); return s; }
    if (c.type === "cycle") {
      const [a, b, d, e] = c.p;
      if (c.alt) {
        push("in", a * u, { side: "izq" }); push("hold", b * u, { side: "ambas" }); push("out", d * u, { side: "dcha" }); push("holdEmpty", e * u, { side: "ambas" });
        push("in", a * u, { side: "dcha" }); push("hold", b * u, { side: "ambas" }); push("out", d * u, { side: "izq" }); push("holdEmpty", e * u, { side: "ambas" });
      } else if (c.startEmpty) { push("holdEmpty", e * u); push("in", a * u); push("hold", b * u); push("out", d * u); }
      else { push("in", a * u); push("hold", b * u); push("out", d * u); push("holdEmpty", e * u); }
    } else if (c.type === "viloma") {
      const n = c.stages, st = c.stage * u;
      if (c.v === "A") {
        for (let k = 0; k < n; k++) { push("in", st, { label: "Inspira", sub: "Etapa " + (k + 1) + " de " + n }); if (k < n - 1) push("hold", st, { label: "Pausa" }); }
        push("hold", c.final, { label: "Retén" }); push("out", c.cont * u, { label: "Espira continuo" });
      } else {
        push("in", c.cont * u, { label: "Inspira continuo" });
        for (let k = 0; k < n; k++) { push("out", st, { label: "Espira", sub: "Etapa " + (k + 1) + " de " + n }); if (k < n - 1) push("holdEmpty", st, { label: "Pausa" }); }
        push("holdEmpty", c.final, { label: "Retén vacío" });
      }
    } else if (c.type === "rapid") {
      for (let r = 0; r < c.rounds; r++) {
        push("rapid", c.count * 60 / c.tempo, { label: "Expulsa", count: c.count, tempo: c.tempo, round: r + 1 });
        push("rest", c.rest, { label: "Descansa", sub: "Respira lento", round: r + 1 });
      }
    } else if (c.type === "bhastrika") {
      for (let r = 0; r < c.rounds; r++) {
        push("rapid", c.count * 60 / c.tempo, { label: "Fuelle", count: c.count, tempo: c.tempo, round: r + 1 });
        push("in", c.inDeep, { label: "Inspira profundo", round: r + 1 });
        push("hold", c.hold, { label: "Retén cómodo", sub: "Nunca el máximo · Jalandhara y Mula Bandha", round: r + 1 });
        push("out", c.outSlow, { label: "Espira lento", side: "dcha", round: r + 1 });
        push("rest", c.rest, { label: "Descansa", sub: "Respira normal", round: r + 1 });
      }
    }
    return s;
  }
  const cycleSecs = c => buildSteps(c).reduce((a, s) => a + s.dur, 0);
  function totalSecs(c) {
    if (c.type === "cycle" || c.type === "viloma") return c.mode === "minutos" ? c.amount * 60 : c.amount * cycleSecs(c);
    return cycleSecs(c);
  }
  function maxHold(c) {
    if (c.type === "cycle") return Math.max(c.p[1], c.p[3]) * c.unit;
    if (c.type === "viloma") return c.final;
    if (c.type === "bhastrika") return c.hold;
    return 0;
  }

  /* Audio */
  const A = { ctx: null, master: null, vol: 60, muted: false };
  function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    if (!A.ctx) { try { A.ctx = new AC(); A.master = A.ctx.createGain(); A.master.connect(A.ctx.destination); setVol(A.vol, A.muted); } catch (e) { A.ctx = null; return null; } }
    if (A.ctx.state === "suspended") A.ctx.resume();
    return A.ctx;
  }
  function setVol(v, muted) { A.vol = v; A.muted = muted; if (A.master) A.master.gain.value = muted ? 0 : Math.pow(v / 100, 2); }
  function tone(freq, dur, type, vol, delay, freqEnd) {
    const c = A.ctx; if (!c || A.muted || A.vol === 0) return;
    try {
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + (delay || 0);
      o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(A.master); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { }
  }
  function phaseTone(kind) {
    switch (kind) {
      case "in": tone(440, 0.5, "sine", 0.5, 0, 660); break;
      case "hold": tone(392, 0.45, "triangle", 0.45); break;
      case "out": tone(587, 0.6, "sine", 0.45, 0, 392); break;
      case "holdEmpty": tone(262, 0.5, "triangle", 0.45); break;
      case "rapid": tone(523, 0.15, "square", 0.15); tone(784, 0.2, "square", 0.15, 0.17); break;
      case "rest": tone(330, 0.8, "sine", 0.4); break;
    }
  }
  function endTone() { tone(523, 0.4, "sine", 0.4); tone(659, 0.4, "sine", 0.4, 0.35); tone(784, 0.7, "sine", 0.4, 0.7); }
  const VIB = { in: [70], hold: [30, 60, 30], out: [180], holdEmpty: [30, 60, 30, 60, 30], rapid: [40, 40, 40], rest: [300] };
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }

  /* Runner */
  class Runner {
    constructor(cfg, opts) {
      this.cfg = cfg; this.o = opts || {}; this.steps = buildSteps(cfg);
      this.i = 0; this.cycles = 0; this.running = false; this.started = false;
      this.raf = 0; this.timer = 0; this.wake = null; this.lastBeat = -1; this.lastTick = 0;
      this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    opt(k) { const v = this.o[k]; return typeof v === "function" ? v() : v; }
    start() {
      ensureAudio();
      if (!this.steps.length) return;
      if (!this.started) {
        this.started = true; this.i = 0; this.cycles = 0;
        this.startedAt = this.stepStart = performance.now();
        this.enter(this.steps[0]);
      } else {
        const d = performance.now() - this.pausedAt; this.stepStart += d; this.startedAt += d;
      }
      this.running = true; this.wakeOn();
      cancelAnimationFrame(this.raf);
      const loop = () => { this.update(); if (this.running) this.raf = requestAnimationFrame(loop); };
      this.raf = requestAnimationFrame(loop);
      clearInterval(this.timer); this.timer = setInterval(() => this.update(), 200);
    }
    pause() { if (!this.running) return; this.running = false; this.pausedAt = performance.now(); this.halt(); }
    stop() { this.running = false; this.started = false; this.halt(); }
    halt() { cancelAnimationFrame(this.raf); clearInterval(this.timer); this.wakeOff(); }
    enter(st) {
      this.lastBeat = -1; this.lastTick = 0;
      phaseTone(st.kind);
      if (this.opt("vibrate")) vibrate(VIB[st.kind] || [50]);
      this.o.onStep && this.o.onStep(st, this);
    }
    done() {
      const c = this.cfg;
      if (c.type !== "cycle" && c.type !== "viloma") return true;
      if (c.mode === "ciclos") return this.cycles >= c.amount;
      return (performance.now() - this.startedAt) / 1000 >= c.amount * 60;
    }
    update() {
      if (!this.running) return;
      const now = performance.now();
      let st = this.steps[this.i], t = (now - this.stepStart) / 1000, guard = 0;
      while (t >= st.dur && guard++ < 500) {
        this.stepStart += st.dur * 1000; t -= st.dur; this.i++;
        if (this.i >= this.steps.length) {
          this.cycles++;
          this.o.onCycle && this.o.onCycle(this.cycles, this);
          if (this.done()) { this.stop(); endTone(); if (this.opt("vibrate")) vibrate([120, 80, 120, 80, 240]); this.o.onFinish && this.o.onFinish(this); return; }
          this.i = 0;
        }
        st = this.steps[this.i]; this.enter(st);
      }
      const p = Math.min(1, t / st.dur);
      let sc = 0.42, cd;
      if (st.kind === "in") sc = 0.42 + 0.58 * easeIO(p);
      else if (st.kind === "hold") sc = 1;
      else if (st.kind === "out") sc = 1 - 0.58 * easeIO(p);
      else if (st.kind === "rest") sc = 0.55 + 0.04 * Math.sin(t * 1.2);
      if (st.kind === "rapid") {
        const iv = 60 / st.tempo, beat = Math.floor(t / iv), frac = (t % iv) / iv;
        if (beat !== this.lastBeat && beat < st.count) { this.lastBeat = beat; tone(1000, 0.05, "square", 0.22); }
        sc = 0.8 - 0.18 * Math.max(0, 1 - frac * 4);
        cd = String(Math.min(st.count, beat + 1));
      } else {
        const left = Math.max(1, Math.ceil(st.dur - t));
        cd = st.dur > 90 ? Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0") : String(left);
        if (this.opt("tick") && this.cfg.type !== "bhastrika" && this.cfg.type !== "rest") {
          const u = this.cfg.unit || 1, k = Math.floor(t / u);
          if (k > this.lastTick && t < st.dur - 0.15) { this.lastTick = k; tone(880, 0.04, "sine", 0.12); }
        }
      }
      if (this.reduced) sc = st.kind === "in" || st.kind === "hold" ? 0.85 : 0.6;
      this.o.onFrame && this.o.onFrame({ step: st, t, p, scale: sc, cd });
    }
    async wakeOn() { try { if ("wakeLock" in navigator) this.wake = await navigator.wakeLock.request("screen"); } catch (e) { this.wake = null; } }
    wakeOff() { try { if (this.wake) this.wake.release(); } catch (e) { } this.wake = null; }
  }
  const easeIO = x => 0.5 - 0.5 * Math.cos(Math.PI * x);

  window.BreathEngine = { KIND, loadPreset, buildSteps, cycleSecs, totalSecs, maxHold, ensureAudio, setVol, tone, endTone, vibrate, Runner };
})();
