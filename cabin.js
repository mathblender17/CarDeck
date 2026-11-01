'use strict'
// The car around the music, all synthesised: tyres, wind, expansion joints and a small chime.
;(function (root) {
  const KEY = 'cabin'
  let ctx, master, timers = [], running = false, level = .7
  const pref = { get() { try { return localStorage.getItem(KEY) !== 'off' } catch { return true } }, set(on) { try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch {} } }

  function noise(seconds, brown) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate), d = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1
      if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.5 } else d[i] = w
    }
    return buf
  }
  function bed(buf, type, freq, q, gain) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain()
    s.buffer = buf; s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain
    s.connect(f); f.connect(g); g.connect(master); s.start()
    return { f, g }
  }
  function lfo(rate, depth, param) {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); o.start()
  }
  function build() {
    ctx = new (root.AudioContext || root.webkitAudioContext)()
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination)
    const brown = noise(7, true), white = noise(5, false)
    bed(brown, 'lowpass', 240, .6, .95)
    bed(white, 'bandpass', 2300, .5, .02)
    const wind = bed(white, 'bandpass', 640, 1.1, .075)
    lfo(.07, .04, wind.g.gain); lfo(.13, 220, wind.f.frequency)
  }
  function thump(when) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain()
    s.buffer = noise(.2, true); f.type = 'lowpass'; f.frequency.value = 130
    g.gain.setValueAtTime(.5, when); g.gain.exponentialRampToValueAtTime(.001, when + .16)
    s.connect(f); f.connect(g); g.connect(master); s.start(when); s.stop(when + .2)
  }
  function ring(freq, when) {
    const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 1.2 - .6; pan.connect(master)
    ;[[1, .05], [2.76, .018], [5.4, .007]].forEach(([k, a]) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = freq * k
      g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + .006); g.gain.exponentialRampToValueAtTime(.0002, when + 2.8 / k + .4)
      o.connect(g); g.connect(pan); o.start(when); o.stop(when + 3.4)
    })
  }
  const NOTES = [880, 987.8, 1174.7, 1318.5, 1480, 1760]
  function chimeLoop() {
    const n = 1 + Math.floor(Math.random() * 3)
    for (let i = 0; i < n; i++) ring(NOTES[Math.floor(Math.random() * NOTES.length)], ctx.currentTime + .05 + i * (.14 + Math.random() * .3))
    timers.push(setTimeout(chimeLoop, 5000 + Math.random() * 9000))
  }
  function jointLoop() {
    const t = ctx.currentTime + .05
    thump(t); thump(t + .13)
    timers.push(setTimeout(jointLoop, 1700 + Math.random() * 1500))
  }
  const fade = (to, s = 1.8) => { const g = master.gain; g.cancelScheduledValues(ctx.currentTime); g.setValueAtTime(g.value, ctx.currentTime); g.linearRampToValueAtTime(to, ctx.currentTime + s) }

  const Cabin = {
    get on() { return running },
    get wanted() { return pref.get() },
    start() {
      if (!pref.get()) return
      if (!ctx) build()
      ctx.resume()
      if (!running) { running = true; fade(level); jointLoop(); timers.push(setTimeout(chimeLoop, 1800)) }
    },
    stop() { running = false; timers.forEach(clearTimeout); timers = []; if (ctx) fade(0, .5) },
    toggle() { const on = !pref.get(); pref.set(on); on ? Cabin.start() : Cabin.stop(); return on },
    level(v) { level = v; if (running) fade(v, .9) },
    // the disc going home: a soft latch, then the mechanism pulling it in
    insert() {
      if (!ctx || !running) return
      const t = ctx.currentTime, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain()
      o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(150, t + .9)
      f.type = 'lowpass'; f.frequency.value = 500
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .08); g.gain.linearRampToValueAtTime(0, t + 1.1)
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 1.2)
      thump(t + 1.05); ring(1760, t + 1.1)
    }
  }
  root.Cabin = Cabin

  // browsers keep audio silent until the first press
  const unlock = () => { Cabin.start(); if (ctx?.state === 'running' || !pref.get()) { removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock) } }
  addEventListener('pointerdown', unlock); addEventListener('keydown', unlock)
})(globalThis)
