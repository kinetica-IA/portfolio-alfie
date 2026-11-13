/* Breath engine v2: steps and timing, physiological volume curve, continuous guide audio, vibration.
 * Volumes are fractions of total lung capacity (TLC = 1). Reference adult values, not measured:
 * residual volume ~0.20, functional residual capacity (resting end-expiration) ~0.40.
 * Inhalation: smootherstep S (slow start, peak flow mid-phase, soft landing).
 * Exhalation: Kumaraswamy CDF (a=1.6, b=3): peak flow early (~1/3), long decelerating tail,
 * like elastic recoil braked voluntarily. Both curves have zero slope at their ends, so the
 * corners into and out of retentions are rounded (no sawtooth). */
(function () {
  "use strict";
  const KIND = {
    in: { label: "Inspira", tone: "warm" }, hold: { label: "Retén", tone: "warm" },
    out: { label: "Espira", tone: "cool" }, holdEmpty: { label: "Retén vacío", tone: "cool" },
    rapid: { label: "Expulsa", tone: "cool" }, rest: { label: "Descansa", tone: "rest" }
  };
  const REF = { RV: 0.20, FRC: 0.40, TLC: 1 };
  const TIDAL = { base: 0.40, amp: 0.08, period: 5 };

  const smoothstep = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const inhale = p => { p = Math.max(0, Math.min(1, p)); return p * p * p * (p * (6 * p - 15) + 10); };
  const exhale = p => { p = Math.max(0, Math.min(1, p)); return 1 - Math.pow(1 - Math.pow(p, 1.6), 3); };

  /* Volume range of each technique (fraction of TLC) */
  function levels(c) {
    if (c.type === "rest" || c.tech === "asvini") return { lo: TIDAL.base, hi: TIDAL.base + TIDAL.amp, tidal: true };
    if (c.tech === "conciencia") return { lo: 0.40, hi: 0.52 };
    if (c.type === "rapid") return { lo: 0.33, hi: 0.40 };
    if (c.type === "bhastrika") return { lo: 0.30, hi: 0.90, bellows: [0.40, 0.58] };
    return { lo: 0.27, hi: 0.90 };
  }

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
    if (c.type === "rest") { push("rest", c.secs, { label: c.label || "Shavasana", sub: c.sub || "Túmbate y respira con normalidad" }); }
    else if (c.type === "cycle") {
      const [a, b, d, e] = c.p;
      if (c.alt) {
        push("in", a * u, { side: "izq" }); push("hold", b * u, { side: "ambas" }); push("out", d * u, { side: "dcha" }); push("holdEmpty", e * u, { side: "ambas" });
        push("in", a * u, { side: "dcha" }); push("hold", b * u, { side: "ambas" }); push("out", d * u, { side: "izq" }); push("holdEmpty", e * u, { side: "ambas" });
      } else if (c.startEmpty) { push("holdEmpty", e * u); push("in", a * u); push("hold", b * u); push("out", d * u); }
      else { push("in", a * u); push("hold", b * u); push("out", d * u); push("holdEmpty", e * u); }
    } else if (c.type === "viloma") {
      const n = c.stages, st = c.stage * u;
      if (c.v === "A") {
        for (let k = 0; k < n; k++) { push("in", st, { label: "Inspira", sub: "Etapa " + (k + 1) + " de " + n, to: (k + 1) / n }); if (k < n - 1) push("hold", st, { label: "Pausa" }); }
        push("hold", c.final, { label: "Retén" }); push("out", c.cont * u, { label: "Espira continuo" });
      } else {
        push("in", c.cont * u, { label: "Inspira continuo" });
        for (let k = 0; k < n; k++) { push("out", st, { label: "Espira", sub: "Etapa " + (k + 1) + " de " + n, to: 1 - (k + 1) / n }); if (k < n - 1) push("holdEmpty", st, { label: "Pausa" }); }
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
    assignVolumes(s, c);
    return s;
  }

  /* Start and end volume of every step, so consecutive steps join without jumps */
  function assignVolumes(s, c) {
    const L = levels(c), span = L.hi - L.lo;
    let v = c.type === "rapid" ? L.hi : c.type === "bhastrika" ? L.bellows[0] : L.lo;
    if (c.type === "rest" || c.tech === "asvini") v = TIDAL.base;
    for (const st of s) {
      st.v0 = v;
      if (st.kind === "in") v = st.to != null ? L.lo + span * st.to : L.hi;
      else if (st.kind === "out") v = st.to != null ? L.lo + span * st.to : L.lo;
      else if (st.kind === "rest") v = TIDAL.base;
      st.v1 = v;
    }
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

  /* Volume inside one step at time t (s) */
  function stepVolume(st, t, c) {
    const p = st.dur > 0 ? t / st.dur : 1;
    switch (st.kind) {
      case "in": return st.v0 + (st.v1 - st.v0) * inhale(p);
      case "out": return st.v0 + (st.v1 - st.v0) * exhale(p);
      case "hold": case "holdEmpty": return st.v0;
      case "rapid": {
        const iv = 60 / st.tempo, beat = Math.floor(t / iv), f = (t % iv) / iv;
        if (beat >= st.count) return st.v0;
        if (c.type === "rapid") {           /* Kapalabhati: active expulsion below rest level, passive recoil back */
          const dip = levels(c).lo;
          return f < 0.3 ? st.v0 - (st.v0 - dip) * exhale(f / 0.3) : dip + (st.v0 - dip) * inhale((f - 0.3) / 0.7);
        }
        const [lo, hi] = levels(c).bellows;  /* Bhastrika bellows: forceful both ways, rounded */
        return lo + (hi - lo) * 0.5 * (1 - Math.cos(2 * Math.PI * f));
      }
      case "rest": {
        const tide = TIDAL.base + TIDAL.amp * 0.5 * (1 - Math.cos(2 * Math.PI * t / TIDAL.period)) * smoothstep((st.dur - t) / 2);
        const k = smoothstep(t / 3);
        return st.v0 * (1 - k) + tide * k;
      }
    }
    return st.v0;
  }

  /* Audio: master, soft bells, continuous guide (tone follows volume, breath noise follows airflow) */
  const A = { ctx: null, master: null, vol: 45, muted: false };
  function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    if (!A.ctx) { try { A.ctx = new AC(); A.master = A.ctx.createGain(); A.master.connect(A.ctx.destination); setVol(A.vol, A.muted); } catch (e) { A.ctx = null; return null; } }
    if (A.ctx.state === "suspended") A.ctx.resume();
    return A.ctx;
  }
  function setVol(v, muted) {
    A.vol = v; A.muted = muted;
    if (A.master) A.master.gain.setTargetAtTime(muted ? 0 : Math.pow(v / 100, 2), A.ctx.currentTime, 0.05);
  }
  function tone(freq, dur, type, vol, delay, freqEnd, attack) {
    const c = A.ctx; if (!c || A.muted || A.vol === 0) return;
    try {
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + (delay || 0), at = attack || 0.03;
      o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(A.master); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { }
  }
  /* Soft bell: fundamental + quiet octave partial, slow attack, long decay */
  function bell(freq, dur, vol, delay) {
    tone(freq, dur || 1.6, "sine", vol || 0.09, delay, null, 0.04);
    tone(freq * 2, (dur || 1.6) * 0.6, "sine", (vol || 0.09) * 0.25, delay, null, 0.04);
  }
  const PHASE_BELL = { in: 392, hold: 349.2, out: 329.6, holdEmpty: 293.7, rest: 261.6, rapid: 329.6 };
  function phaseTone(kind) { if (PHASE_BELL[kind]) bell(PHASE_BELL[kind], 1.6, 0.08); }
  function endTone() { bell(392, 2.6, 0.08); bell(493.9, 2.6, 0.07, 0.3); bell(587.3, 3.2, 0.07, 0.6); }

  const G = { nodes: null };
  function guideStart() {
    const c = ensureAudio(); if (!c || G.nodes) return;
    try {
      const out = c.createGain(); out.gain.value = 0; out.connect(A.master);
      const o1 = c.createOscillator(), o2 = c.createOscillator();
      o1.type = "sine"; o2.type = "sine"; o1.frequency.value = 174.61; o2.frequency.value = 261.63;
      const tg = c.createGain(), g2 = c.createGain(); tg.gain.value = 0; g2.gain.value = 0.45;
      o1.connect(tg); o2.connect(g2); g2.connect(tg); tg.connect(out);
      const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;   /* pinkish noise: soft, breathy */
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11; }
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.7; bp.frequency.value = 600;
      const ng = c.createGain(); ng.gain.value = 0;
      src.connect(bp); bp.connect(ng); ng.connect(out);
      o1.start(); o2.start(); src.start();
      out.gain.setTargetAtTime(1, c.currentTime, 0.4);
      G.nodes = { out, o1, o2, tg, ng, bp, src };
    } catch (e) { G.nodes = null; }
  }
  function guideUpdate(norm, flow) {
    const n = G.nodes; if (!n || !A.ctx) return;
    const t = A.ctx.currentTime, r = Math.pow(2, norm * 4 / 12);
    n.o1.frequency.setTargetAtTime(174.61 * r, t, 0.1); n.o2.frequency.setTargetAtTime(261.63 * r, t, 0.1);
    n.tg.gain.setTargetAtTime(0.03 + 0.06 * norm, t, 0.15);
    n.ng.gain.setTargetAtTime(Math.min(0.5, flow * 1.6), t, 0.06);
    n.bp.frequency.setTargetAtTime(450 + 650 * norm, t, 0.12);
  }
  function guideStop() {
    const n = G.nodes; if (!n) return; G.nodes = null;
    try { n.out.gain.setTargetAtTime(0, A.ctx.currentTime, 0.25); } catch (e) { }
    setTimeout(() => { try { n.o1.stop(); n.o2.stop(); n.src.stop(); n.out.disconnect(); } catch (e) { } }, 1600);
  }

  const VIB = { in: [70], hold: [30, 60, 30], out: [180], holdEmpty: [30, 60, 30, 60, 30], rapid: [40, 40, 40], rest: [300] };
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }

  /* Runner */
  class Runner {
    constructor(cfg, opts) {
      this.cfg = cfg; this.o = opts || {}; this.steps = buildSteps(cfg);
      this.i = 0; this.cycles = 0; this.running = false; this.started = false;
      this.raf = 0; this.timer = 0; this.wake = null; this.lastTick = 0;
      this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.starts = []; let acc = 0; for (const s of this.steps) { this.starts.push(acc); acc += s.dur; }
      this.cycleDur = acc;
      this.repeats = cfg.type === "cycle" || cfg.type === "viloma";
      const L = levels(cfg); let lo = Infinity, hi = -Infinity;
      for (const s of this.steps) { lo = Math.min(lo, s.v0, s.v1); hi = Math.max(hi, s.v0, s.v1); }
      if (cfg.type === "rapid") lo = Math.min(lo, L.lo);
      if (cfg.type === "bhastrika") hi = Math.max(hi, L.bellows[1]);
      if (L.tidal) { lo = TIDAL.base; hi = TIDAL.base + TIDAL.amp; }
      if (!(hi - lo > 0.01)) { lo = TIDAL.base; hi = TIDAL.base + TIDAL.amp; }
      this.range = [lo, hi];
      this.lastV = null; this.flow = 0;
    }
    opt(k) { const v = this.o[k]; return typeof v === "function" ? v() : v; }
    /* Seconds since start, frozen while paused */
    elapsed() {
      if (!this.started) return this.endedAt || 0;
      return ((this.running ? performance.now() : this.pausedAt) - this.startedAt) / 1000;
    }
    /* Lung volume (fraction of TLC) at a given time of the exercise; works for past and future */
    volAt(sec) {
      const c = this.cfg, steps = this.steps;
      if (c.tech === "asvini" && c.type !== "rest") return { v: TIDAL.base + TIDAL.amp * 0.5 * (1 - Math.cos(2 * Math.PI * sec / TIDAL.period)), kind: "rest" };
      if (!steps.length) return { v: TIDAL.base, kind: "rest" };
      let s = sec;
      if (this.repeats) s = ((sec % this.cycleDur) + this.cycleDur) % this.cycleDur;
      else if (s < 0) return { v: steps[0].v0, kind: "rest" };
      else if (s >= this.cycleDur) { const last = steps[steps.length - 1]; return { v: stepVolume(last, last.dur, c), kind: "rest" }; }
      let i = 0; while (i + 1 < steps.length && this.starts[i + 1] <= s) i++;
      const st = steps[i];
      return { v: stepVolume(st, s - this.starts[i], c), kind: st.kind };
    }
    norm(v) { return Math.max(0, Math.min(1, (v - this.range[0]) / (this.range[1] - this.range[0]))); }
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
      this.running = true; this.wakeOn(); guideStart();
      cancelAnimationFrame(this.raf);
      const loop = () => { this.update(); if (this.running) this.raf = requestAnimationFrame(loop); };
      this.raf = requestAnimationFrame(loop);
      clearInterval(this.timer); this.timer = setInterval(() => this.update(), 200);
    }
    pause() { if (!this.running) return; this.running = false; this.pausedAt = performance.now(); this.halt(); }
    stop() { if (this.started) this.endedAt = this.elapsed(); this.running = false; this.started = false; this.halt(); }
    halt() { cancelAnimationFrame(this.raf); clearInterval(this.timer); this.wakeOff(); guideStop(); }
    enter(st) {
      this.lastTick = 0;
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
      const v = this.volAt(this.elapsed()).v, n = this.norm(v);
      const dt = this.lastNow ? Math.max(0.008, (now - this.lastNow) / 1000) : 0.016;
      const rawFlow = this.lastV == null ? 0 : Math.abs(v - this.lastV) / dt;
      this.flow += (rawFlow - this.flow) * Math.min(1, dt / 0.08);
      this.lastV = v; this.lastNow = now;
      guideUpdate(n, this.flow);
      let cd;
      if (st.kind === "rapid") {
        const iv = 60 / st.tempo, beat = Math.floor(t / iv);
        cd = String(Math.min(st.count, beat + 1));
      } else {
        const left = Math.max(1, Math.ceil(st.dur - t));
        cd = st.dur > 90 ? Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0") : String(left);
        if (this.opt("tick") && this.cfg.type !== "bhastrika" && this.cfg.type !== "rest") {
          const u = this.cfg.unit || 1, k = Math.floor(t / u);
          if (k > this.lastTick && t < st.dur - 0.15) { this.lastTick = k; tone(220, 0.12, "sine", 0.05, 0, null, 0.012); }
        }
      }
      let sc = 0.42 + 0.58 * n;
      if (this.reduced) sc = st.kind === "in" || st.kind === "hold" ? 0.85 : 0.6;
      this.o.onFrame && this.o.onFrame({ step: st, t, p, scale: sc, cd, v, norm: n });
    }
    async wakeOn() { try { if ("wakeLock" in navigator) this.wake = await navigator.wakeLock.request("screen"); } catch (e) { this.wake = null; } }
    wakeOff() { try { if (this.wake) this.wake.release(); } catch (e) { } this.wake = null; }
  }

  window.BreathEngine = { KIND, REF, loadPreset, buildSteps, cycleSecs, totalSecs, maxHold, ensureAudio, setVol, tone, bell, endTone, vibrate, Runner, curves: { inhale, exhale } };
})();
