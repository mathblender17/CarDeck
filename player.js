'use strict'
const { segPath, isAudioName, cleanTitle, displayText, compareNames, fmtTime, parseYouTube, bandEdges, angleToVolume, L } = CarDeck
const $ = id => document.getElementById(id)
const COL = { vfd: '#8BF2FF', mint: '#6CFFC4', hot: '#F4FEFF', amber: '#FFB238', red: '#FF3A2C', violet: '#8A6BFF' }
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const MODES = ['SPECTRUM ANALYZER', 'OSCILLOSCOPE']
const BOOT = 2700, READ = reduced ? 0 : 1300, BOOT_TEXT = 'NIGHTLINE NX-2002 DSP'

$('unit').innerHTML = UNIT_SVG

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) } catch { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
}

const S = {
  discs: Array(6).fill(null), slot: 0, playing: false, shuffle: false, repeat: 0, mode: 0,
  vol: store.get('vol', .6), muted: false, msg: '', msgUntil: 0, fold: store.get('fold', false)
}
const say = (text, ms = 2600) => { S.msg = text; S.msgUntil = performance.now() + ms }
const disc = () => S.discs[S.slot]
let booting = !reduced, bootStart = null, reading = null, readTimer

// --- overlays sit on the drawing by its own coordinates, so they scale with it
const pct = (el, x, y, w, h) => {
  const v = L.view
  Object.assign(el.style, { left: (x - v.x) / v.w * 100 + '%', top: (y - v.y) / v.h * 100 + '%', width: w / v.w * 100 + '%', height: h / v.h * 100 + '%' })
}
const G = L.glass, C = L.C
pct($('screen'), G.x, G.y, G.w, G.h)
pct($('ring'), C.x - 182, C.y - 182, 364, 364)
pct($('disc'), C.x - 98, C.y - 98, 196, 196)
pct($('spindle'), C.x - 33, C.y - 33, 66, 66)
pct($('knob'), C.x - 198, C.y - 198, 396, 396)

const screen = $('screen').getContext('2d'), ringCtx = $('ring').getContext('2d')
let unitScale = 1
function fit() {
  const dpr = Math.min(devicePixelRatio || 1, 2), box = $('stage').getBoundingClientRect()
  unitScale = box.width / L.view.w * dpr
  $('screen').width = G.w * unitScale; $('screen').height = G.h * unitScale
  $('ring').width = $('ring').height = 364 * unitScale
  drawRing()
}
new ResizeObserver(fit).observe($('stage'))

// --- local audio, with a real analyser
const audio = new Audio()
let actx, analyser, gain, freq, wave, edges, objectUrl, fails = 0
function ensureAudio() {
  if (!actx) {
    actx = new AudioContext()
    analyser = actx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = .55
    analyser.minDecibels = -82; analyser.maxDecibels = -14
    gain = actx.createGain()
    actx.createMediaElementSource(audio).connect(analyser)
    analyser.connect(gain); gain.connect(actx.destination)
    freq = new Uint8Array(analyser.frequencyBinCount); wave = new Uint8Array(analyser.fftSize)
    edges = bandEdges(L.spec.n, actx.sampleRate, analyser.fftSize)
    applyVolume()
  }
  if (actx.state === 'suspended') actx.resume()
}
const blocked = e => { if (e.name === 'NotAllowedError') say('PRESS PLAY') }
function playLocalTrack(i, autoplay = true) {
  const d = disc()
  d.track = i
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = URL.createObjectURL(d.tracks[i].file)
  audio.src = objectUrl
  if (autoplay) { ensureAudio(); audio.play().catch(blocked) }
  refresh()
}
audio.addEventListener('play', () => { S.playing = true; refresh() })
audio.addEventListener('playing', () => { fails = 0 })
audio.addEventListener('pause', () => { S.playing = false; refresh() })
audio.addEventListener('ended', () => advance(true))
audio.addEventListener('error', () => {
  if (!audio.getAttribute('src') || disc()?.kind !== 'local') return
  // shortcut: an unreadable track is skipped, not reported per file; a whole bad disc stops
  if (++fails >= disc().tracks.length) { fails = 0; S.playing = false; say('CANNOT READ DISC', 5000); refresh(); return }
  say('READ ERROR - SKIP'); advance(true, true)
})

// --- YouTube has to stay visible, so it plays in the monitor; its audio cannot be analysed
let yt, ytLoading, ytFails = 0
function loadYT() {
  if (ytLoading) return ytLoading
  ytLoading = new Promise((resolve, reject) => {
    if (location.protocol === 'file:') return reject(new Error('needs-http'))
    window.onYouTubeIframeAPIReady = () => {
      const p = new YT.Player('yt', {
        width: '100%', height: '100%', playerVars: { playsinline: 1, rel: 0, origin: location.origin },
        events: { onReady: () => resolve(p), onStateChange: onYTState, onError: e => ytError(e.data) }
      })
    }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.onerror = () => reject(new Error('offline'))
    document.head.append(s)
  }).catch(e => { ytLoading = null; throw e })
  return ytLoading
}
// 101 and 150 mean the owner blocks embedding; no player outside YouTube can get past that
function ytError(code) {
  const d = disc(), blockedByOwner = code === 101 || code === 150
  S.playing = false; refresh()
  if (d?.kind === 'yt' && d.list && ++ytFails < (yt.getPlaylist?.()?.length || 1)) { say('BLOCKED BY OWNER - SKIPPING', 1800); setTimeout(() => { if (disc() === d) yt.nextVideo() }, 1000); return }
  say(blockedByOwner ? 'OWNER BLOCKS THIS OUTSIDE YOUTUBE' : 'TUBE WILL NOT PLAY THIS', 9000)
}
function onYTState(e) {
  const d = disc(); if (d?.kind !== 'yt') return
  S.playing = e.data === YT.PlayerState.PLAYING
  if (S.playing) ytFails = 0
  const title = yt.getVideoData?.().title
  if (title) { d.title = title; d.tracks = yt.getPlaylist?.() || [title]; d.track = Math.max(0, yt.getPlaylistIndex?.() ?? 0) }
  if (e.data === YT.PlayerState.ENDED && !d.list && S.repeat) { yt.seekTo(0); yt.playVideo() }
  refresh()
}
async function startYT(d) {
  $('monitor').hidden = false
  try {
    yt = await loadYT()
    if (disc() !== d) return
    applyVolume(); yt.setLoop(!!S.repeat); yt.setShuffle(S.shuffle)
    if (d.list) yt.loadPlaylist({ list: d.list, listType: 'playlist', index: d.track })
    else yt.loadVideoById(d.video)
  } catch (e) {
    $('monitor').hidden = true
    say(e.message === 'needs-http' ? 'TUBE NEEDS LOCAL SERVER' : 'TUBE OFFLINE', 6000)
  }
}

// --- transport
const clearPlayers = () => { clearTimeout(readTimer); reading = null; audio.pause(); if (yt) yt.pauseVideo?.(); $('monitor').hidden = disc()?.kind !== 'yt' }
function startDisc() {
  const d = disc(); clearPlayers()
  if (!d) { refresh(); return }
  if (d.kind === 'local') ensureAudio()
  reading = d; refresh()
  readTimer = setTimeout(() => {
    reading = null
    if (d.kind === 'local') {
      playLocalTrack(d.track)
      say(d.tracks.length === 1 ? '1 TRACK' : d.tracks.length + ' TRACKS', 1400)
    } else startYT(d)
    refresh()
  }, READ)
}
function togglePlay() {
  if (reading) return
  const d = disc()
  if (!d) { openTray(); return }
  if (d.kind === 'yt') { if (!yt) return startYT(d); S.playing ? yt.pauseVideo() : yt.playVideo(); return }
  ensureAudio()
  if (audio.paused) { if (!audio.getAttribute('src')) playLocalTrack(d.track); else audio.play().catch(blocked) } else audio.pause()
}
function advance(auto, skipping) {
  const d = disc(); if (!d || reading) return
  if (d.kind === 'yt') { if (d.list) yt?.nextVideo(); return }
  const n = d.tracks.length
  if (auto && S.repeat === 2 && !skipping) return playLocalTrack(d.track)
  let i = d.track + 1
  if (S.shuffle && n > 1) { do i = Math.floor(Math.random() * n); while (i === d.track) }
  if (i >= n) {
    if (auto && !S.repeat) { S.playing = false; playLocalTrack(0, false); return }
    i = 0
  }
  playLocalTrack(i)
}
function back() {
  const d = disc(); if (!d || reading) return
  if (d.kind === 'yt') { if (d.list) yt?.previousVideo(); else yt?.seekTo(0); return }
  if (audio.currentTime > 3) audio.currentTime = 0
  else playLocalTrack((d.track - 1 + d.tracks.length) % d.tracks.length)
}
function seek(delta) {
  const d = disc(); if (!d) return
  if (d.kind === 'yt') yt?.seekTo(Math.max(0, yt.getCurrentTime() + delta), true)
  else if (isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration - .1, Math.max(0, audio.currentTime + delta))
}
function selectSlot(i) {
  const was = disc()
  S.slot = i
  if (!disc()) { if (was) clearPlayers(); refresh(); openTray(); return }
  if (disc() !== was) startDisc()
}
function eject() {
  if (!disc()) return say('NO DISC')
  clearPlayers(); audio.removeAttribute('src'); audio.load()
  S.discs[S.slot] = null; S.playing = false
  $('monitor').hidden = true; say('EJECT'); refresh()
}
function jumpToSource(kind) {
  for (let k = 1; k <= 6; k++) {
    const i = (S.slot + k) % 6
    if (S.discs[i]?.kind === kind) { if (i !== S.slot) selectSlot(i); else if (kind === 'yt') toggleFold(); else say('LOCAL'); return }
  }
  openTray(kind)
}

// YouTube's rules forbid hiding the player while it plays, so folded means small, not gone
function toggleFold() {
  S.fold = !S.fold; store.set('fold', S.fold); refresh()
  say(S.fold ? 'SCREEN FOLDED' : 'SCREEN OPEN', 1400)
}
$('fold').onclick = toggleFold

// --- volume
function applyVolume() {
  const v = S.muted ? 0 : S.vol
  if (gain) gain.gain.value = v * v
  yt?.setVolume?.(v * 100)
  const k = $('knob'); k.setAttribute('aria-valuenow', Math.round(S.vol * 100))
  $('stage').querySelector('[data-act=mute] text').setAttribute('fill', S.muted ? '#C8200F' : '#16181C')
  drawRing()
}
function setVolume(v) { S.vol = Math.min(1, Math.max(0, v)); S.muted = false; store.set('vol', S.vol); applyVolume() }
function drawRing(level = S.vol) {
  const x = ringCtx, s = unitScale, n = 45, on = Math.round(level * (n - 1)) + (level > 0 ? 1 : 0)
  x.setTransform(s, 0, 0, s, 182 * s, 182 * s); x.clearRect(-182, -182, 364, 364)
  x.lineWidth = 3.6
  for (let i = 0; i < n; i++) {
    const a = (135 + i * 270 / (n - 1)) * Math.PI / 180, lit = i < on && !S.muted
    x.strokeStyle = lit ? COL.vfd : '#24303C'; x.shadowColor = COL.vfd; x.shadowBlur = lit ? 6 * s : 0
    x.beginPath(); x.moveTo(Math.cos(a) * 158, Math.sin(a) * 158); x.lineTo(Math.cos(a) * 176, Math.sin(a) * 176); x.stroke()
  }
}

// --- loading discs
const tray = $('tray')
function openTray(kind) {
  $('trayTitle').textContent = 'Load disc ' + (S.slot + 1)
  $('trayMsg').textContent = ''
  if (!tray.open) tray.showModal()
  if (kind === 'yt') $('ytUrl').focus()
}
function loadFiles(list) {
  const tracks = [...list].filter(f => f.type.startsWith('audio/') || isAudioName(f.name))
    .sort((a, b) => compareNames(a.webkitRelativePath || a.name, b.webkitRelativePath || b.name))
    .map(file => ({ file, title: cleanTitle(file.name), ext: (file.name.split('.').pop() || '').toUpperCase() }))
  if (!tracks.length) { $('trayMsg').textContent = 'No audio files found there.'; if (!tray.open) say('NO AUDIO FILES'); return }
  clearPlayers()
  S.discs[S.slot] = { kind: 'local', tracks, track: 0 }
  fails = 0; tray.close(); startDisc()
}
$('pickFolder').onclick = () => $('folderIn').click()
$('pickFiles').onclick = () => $('filesIn').click()
$('folderIn').onchange = e => { loadFiles(e.target.files); e.target.value = '' }
$('filesIn').onchange = e => { loadFiles(e.target.files); e.target.value = '' }
$('trayClose').onclick = () => tray.close()
$('ytForm').onsubmit = e => {
  e.preventDefault()
  const id = parseYouTube($('ytUrl').value)
  if (!id) { $('trayMsg').textContent = 'That is not a YouTube video or playlist link.'; return }
  clearPlayers()
  S.discs[S.slot] = { kind: 'yt', ...id, track: 0, tracks: [], title: 'LOADING' }
  $('ytUrl').value = ''; tray.close(); startDisc()
}
const stage = $('stage')
stage.addEventListener('dragover', e => e.preventDefault())
stage.addEventListener('drop', e => { e.preventDefault(); loadFiles(e.dataTransfer.files) })

// --- keys
const ACT = {
  open: () => openTray(), eject, play: togglePlay, prev: back, next: () => advance(false),
  local: () => jumpToSource('local'), tube: () => jumpToSource('yt'),
  mute: () => { S.muted = !S.muted; applyVolume(); say(S.muted ? 'MUTE' : 'SOUND ON') },
  shuffle: () => { S.shuffle = !S.shuffle; yt?.setShuffle?.(S.shuffle); say(S.shuffle ? 'RANDOM ON' : 'RANDOM OFF'); refresh() },
  repeat: () => { S.repeat = (S.repeat + 1) % 3; yt?.setLoop?.(!!S.repeat); say(['REPEAT OFF', 'REPEAT DISC', 'REPEAT TRACK'][S.repeat]); refresh() },
  disp: () => { S.mode = (S.mode + 1) % MODES.length; refresh() }
}
function run(act) {
  const k = stage.querySelector(`[data-act="${act}"]`)
  k?.classList.add('lit'); setTimeout(() => k?.classList.remove('lit'), 170)
  act.startsWith('disc') ? selectSlot(+act.slice(4)) : ACT[act]?.()
}
let holdTimer, holdLoop, held = false
stage.addEventListener('pointerdown', e => {
  const k = e.target.closest('.key'); if (!k) return
  k.classList.add('down')
  const act = k.dataset.act
  if (act !== 'prev' && act !== 'next') return
  holdTimer = setTimeout(() => { held = true; holdLoop = setInterval(() => seek(act === 'next' ? 5 : -5), 140) }, 450)
})
const release = () => { clearTimeout(holdTimer); clearInterval(holdLoop); document.querySelectorAll('.key.down').forEach(k => k.classList.remove('down')) }
addEventListener('pointerup', release); addEventListener('pointercancel', release)
stage.addEventListener('click', e => {
  const k = e.target.closest('.key'); if (!k) return
  if (held) { held = false; return }
  run(k.dataset.act)
})
stage.addEventListener('keydown', e => {
  const k = e.target.closest('.key')
  if (k && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); run(k.dataset.act) }
})
addEventListener('keydown', e => {
  if (tray.open || e.target.tagName === 'INPUT') return
  const step = { ArrowUp: .03, ArrowDown: -.03 }[e.key]
  if (step) { e.preventDefault(); setVolume(S.vol + step) }
  else if (e.key === ' ') { e.preventDefault(); run('play') }
  else if (e.key === 'ArrowRight') run('next')
  else if (e.key === 'ArrowLeft') run('prev')
  else if (e.key === 'v' && disc()?.kind === 'yt') toggleFold()
})

// --- knob: drag the ring for volume, tap the disc to play or pause
const knob = $('knob')
const fromCentre = e => { const r = knob.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2, r.width / 2] }
let dragging = false
knob.addEventListener('pointerdown', e => {
  const [dx, dy, R] = fromCentre(e)
  if (Math.hypot(dx, dy) < R * .5) return run('play')
  dragging = true; knob.setPointerCapture(e.pointerId); setVolume(angleToVolume(dx, dy))
})
knob.addEventListener('pointermove', e => { if (dragging) { const [dx, dy] = fromCentre(e); setVolume(angleToVolume(dx, dy)) } })
knob.addEventListener('pointerup', () => { dragging = false })
knob.addEventListener('wheel', e => { e.preventDefault(); setVolume(S.vol - Math.sign(e.deltaY) * .03) }, { passive: false })

// --- labels that only change on events, so the drawing is not repainted every frame
function refresh() {
  const d = disc(), n = String(S.slot + 1).padStart(2, '0'), yt_ = d?.kind === 'yt'
  const total = d ? d.tracks.length : 0
  $('trk').textContent = d && total ? `TRK ${String(d.track + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}` : 'TRK --'
  $('fmt').textContent = !d ? 'NO DISC' : yt_ ? 'YOUTUBE  SIM EQ' : d.tracks[d.track].ext + '  STEREO'
  $('src').textContent = !d ? '---' : yt_ ? 'TUBE' : 'LOCAL'
  $('mini').textContent = 'DISC ' + (d ? n : '--')
  $('mode').textContent = MODES[S.mode]
  $('led-local').classList.toggle('on', d?.kind === 'local')
  $('led-tube').classList.toggle('on', !!yt_)
  $('led-shuffle').classList.toggle('on', S.shuffle)
  $('led-repeat').classList.toggle('on', !!S.repeat)
  $('led-disp').classList.toggle('on', S.mode > 0)
  document.querySelectorAll('.preset').forEach((k, i) => { k.classList.toggle('loaded', !!S.discs[i]); k.classList.toggle('cur', i === S.slot && !!S.discs[i]) })
  document.body.classList.toggle('moving', S.playing)
  document.body.classList.toggle('fold', S.fold)
  $('fold').textContent = S.fold ? 'OPEN SCREEN' : 'FOLD SCREEN'
  const spin = $('disc'); spin.classList.toggle('spin', !!d); spin.classList.toggle('hold', !S.playing); spin.classList.toggle('reading', !!reading)
  document.title = S.playing ? title() + ' - CarDeck' : 'CarDeck'
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = S.playing ? 'playing' : 'paused'
    if (d) navigator.mediaSession.metadata = new MediaMetadata({ title: title() })
  }
}
const title = () => { const d = disc(); return !d ? '' : d.kind === 'yt' ? d.title : d.tracks[d.track].title }
for (const [a, fn] of [['play', () => togglePlay()], ['pause', () => togglePlay()], ['previoustrack', back], ['nexttrack', () => advance(false)]]) {
  try { navigator.mediaSession?.setActionHandler(a, fn) } catch {}
}

// --- display
const glyphCache = new Map()
function glyph(ch, g) {
  const k = ch + g.W
  if (!glyphCache.has(k)) glyphCache.set(k, new Path2D(segPath(ch, 0, 0, g.W, g.H, g.t)))
  return glyphCache.get(k)
}
function seg(text, xs, g, color) {
  const p = new Path2D()
  ;[...text].forEach((ch, i) => { if (ch !== ' ') p.addPath(glyph(ch, g), new DOMMatrix([1, 0, 0, 1, xs(i), g.y])) })
  screen.fillStyle = color; screen.fill(p)
}
const levels = new Float32Array(L.spec.n), peaks = new Float32Array(L.spec.n)
let road = 0, bass = 0, last = 0, cityGlow = 0

function readSpectrum(now, simulated) {
  const n = L.spec.n
  if (analyser && !simulated) analyser.getByteFrequencyData(freq)
  bass = 0
  for (let i = 0; i < n; i++) {
    let v = 0
    if (simulated) {
      // shortcut: YouTube audio is cross-origin, so its bars are simulated
      const u = i / n, t = now / 170, h = Math.exp(-(((u - .3) / .3) ** 2))
      v = S.playing ? Math.min(1, h * (.5 + .5 * Math.abs(Math.sin(t + i * .7))) + .26 * Math.abs(Math.sin(t * 2.1 + i * 1.9) * Math.cos(t * .4 + i * .3))) : 0
    } else if (analyser) {
      for (let b = edges[i]; b < edges[i + 1] && b < freq.length; b++) v = Math.max(v, freq[b])
      v = (v / 255) ** 1.5
    }
    levels[i] = Math.max(v, levels[i] * .86)
    peaks[i] = levels[i] >= peaks[i] ? levels[i] : Math.max(0, peaks[i] - .011)
    if (i < 6) bass += levels[i] / 6
  }
}
function drawSpectrum(x) {
  const s = L.spec, p = { mint: new Path2D(), hot: new Path2D(), amber: new Path2D() }, red = new Path2D()
  for (let i = 0; i < s.n; i++) {
    const on = Math.round(levels[i] * s.rows), px = s.x + i * s.pitch
    for (let k = 0; k < on; k++) p[k >= 16 ? 'amber' : k >= 11 ? 'hot' : 'mint'].rect(px, s.base - k * s.rp, s.cw, s.ch)
    const top = Math.round(peaks[i] * s.rows)
    if (top > 0) red.rect(px, s.base - Math.min(s.rows - 1, top) * s.rp, s.cw, 3)
  }
  x.shadowBlur = 5 * unitScale
  for (const [k, c] of [['mint', COL.mint], ['hot', COL.hot], ['amber', COL.amber]]) { x.fillStyle = x.shadowColor = c; x.fill(p[k]) }
  x.fillStyle = x.shadowColor = COL.red; x.fill(red)
  x.shadowBlur = 0
}
function drawScope(x, now, simulated) {
  const s = L.spec, w = s.n * s.pitch, mid = s.base - s.rows * s.rp / 2, amp = s.rows * s.rp / 2 - 4
  x.strokeStyle = x.shadowColor = COL.mint; x.shadowBlur = 5 * unitScale; x.lineWidth = 1.8
  x.beginPath()
  if (analyser && !simulated) analyser.getByteTimeDomainData(wave)
  for (let i = 0; i < 300; i++) {
    const v = simulated ? (S.playing ? Math.sin(i * .12 + now / 90) * Math.sin(i * .017 + now / 700) * .7 : 0)
      : analyser ? wave[i * 2] / 128 - 1 : 0
    const px = s.x + i / 299 * w, py = mid - v * amp
    i ? x.lineTo(px, py) : x.moveTo(px, py)
  }
  x.stroke(); x.shadowBlur = 0
}
function drawRoad(x, dt) {
  const { vx, vy, floor } = L.road
  if (S.playing && !reduced) road = (road + dt * (.0006 + bass * .0016)) % 1
  x.lineWidth = 1
  for (let j = 0; j < 8; j++) {
    const u = ((j + road) % 8) / 8, y = vy + u ** 2.3 * (floor - vy)
    x.strokeStyle = `rgba(138,107,255,${.2 + u * .75})`
    x.beginPath(); x.moveTo(G.x, y); x.lineTo(G.x + G.w, y); x.stroke()
  }
  x.fillStyle = COL.amber
  for (let j = 0; j < 5; j++) {
    const u = ((j + road * 5) % 5 + .4) / 5.4, y = vy + u * u * (floor - vy), h = 2 + u * 10, w = 1.2 + u * 5
    if (y + h < floor) x.fillRect(vx - w / 2, y, w, h)
  }
  x.fillStyle = x.shadowColor = COL.red; x.shadowBlur = (4 + bass * 16) * unitScale
  x.fillRect(vx - 11, vy - 6, 7, 3.5); x.fillRect(vx + 4, vy - 6, 7, 3.5)
  x.shadowBlur = 0
}
// A travelling hump in the bars: the power-on sweep and the disc read both use it
function sweep(front, height) {
  for (let i = 0; i < levels.length; i++) levels[i] = Math.max(levels[i], height * Math.exp(-(((i - front) / 4.5) ** 2)) * (.65 + .35 * Math.sin(i * 1.3) ** 2))
}
function bootRing(b) {
  if (b < 500) return 0
  if (b < 1150) return (b - 500) / 650
  return b < 1800 ? 1 - (1 - S.vol) * (b - 1150) / 650 : S.vol
}
function tickerText(now, b) {
  const d = disc()
  if (booting) return (b < 1000 ? '#'.repeat(L.tick.n) : BOOT_TEXT.slice(0, Math.floor((b - 1100) / 45))).padEnd(L.tick.n)
  if (reading) return ('READING DISC ' + '-'.repeat(Math.floor(now / 180) % 4)).padEnd(L.tick.n)
  if (now < S.msgUntil) return S.msg.padEnd(L.tick.n)
  const raw = !d ? 'NO DISC - PRESS OPEN' : displayText(title()) || 'TRACK ' + (d.track + 1)
  if (raw.length <= L.tick.n) return raw.padEnd(L.tick.n)
  const loop = raw + '   -   ', o = Math.floor(now / 260) % loop.length
  return (loop + loop).slice(o, o + L.tick.n)
}
function position() {
  const d = disc()
  if (!d) return [0, 0]
  if (d.kind === 'yt') return yt?.getCurrentTime ? [yt.getCurrentTime() || 0, yt.getDuration() || 0] : [0, 0]
  return [audio.currentTime, audio.duration]
}
function frame(now) {
  const x = screen, s = unitScale, dt = Math.min(50, now - last), d = disc(), simulated = d?.kind === 'yt'
  last = now
  bootStart ??= now
  const b = now - bootStart
  if (booting && (b >= BOOT || d)) { booting = false; drawRing() }
  const lamp = booting && b < 1000
  x.setTransform(s, 0, 0, s, -G.x * s, -G.y * s)
  x.clearRect(G.x, G.y, G.w, G.h)
  // the display warms up unevenly, like a filament catching
  x.globalAlpha = booting ? Math.max(0, Math.min(1, (b - 150) / 450)) * (b < 700 && Math.sin(b / 9) > .55 ? .5 : 1) : 1
  readSpectrum(now, simulated)
  const city = .25 + bass * .75
  if (Math.abs(city - cityGlow) > .02) { cityGlow = city; $('pulse').style.opacity = city.toFixed(2) }
  if (booting) { sweep((b - 450) / 1000 * (L.spec.n + 14) - 7, 1); drawRing(bootRing(b)) }
  if (reading) sweep((1 - Math.cos(now / 240)) / 2 * L.spec.n, .45)
  drawRoad(x, dt)
  x.clearRect(L.mode.x, L.mode.y, L.mode.w, L.mode.h)
  S.mode ? drawScope(x, now, simulated) : drawSpectrum(x)

  const [pos, dur] = position()
  if (dur > 0 && isFinite(dur)) {
    x.strokeStyle = x.shadowColor = COL.amber; x.lineWidth = 1.6; x.shadowBlur = 5 * s
    x.beginPath(); x.moveTo(G.x, L.road.vy); x.lineTo(G.x + G.w * Math.min(1, pos / dur), L.road.vy); x.stroke()
  }
  x.shadowColor = COL.vfd; x.shadowBlur = 7 * s
  const label = lamp ? '####' : simulated ? 'TUBE' : 'DISC', lb = L.label, sl = L.slot, tm = L.time
  seg(label, i => lb.x + i * lb.p, lb, COL.vfd)
  seg(lamp ? '##' : d ? String(S.slot + 1).padStart(2, '0') : '--', i => sl.x + i * sl.p, sl, COL.vfd)
  seg(lamp ? '####' : reading ? '----' : fmtTime(pos), i => tm.xs[i], tm, COL.vfd)
  if (S.playing ? now % 1000 < 700 : true) { x.fillRect(tm.colon, tm.y + 13, 6, 6); x.fillRect(tm.colon - 1.5, tm.y + 30, 6, 6) }
  x.shadowColor = COL.amber; x.shadowBlur = 5 * s
  const tk = L.tick
  seg(tickerText(now, b), i => tk.x + i * tk.p, tk, COL.amber)
  x.shadowBlur = 0
  x.globalAlpha = 1

  // the glass bends around the control, so cut the ring back out
  x.globalCompositeOperation = 'destination-out'
  x.beginPath(); x.arc(C.x, C.y, 200, 0, Math.PI * 2); x.fill()
  x.globalCompositeOperation = 'source-over'
  requestAnimationFrame(frame)
}

$('shade').addEventListener('animationend', e => e.target.remove())
$('disc').addEventListener('animationend', e => e.target.classList.remove('spinup'))
fit(); applyVolume(); refresh()
document.fonts?.ready.then(fit)
requestAnimationFrame(frame)
