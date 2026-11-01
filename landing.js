'use strict'
const { segPath, ghostPath } = CarDeck
const $ = id => document.getElementById(id)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const W = 1600, H = 900, UNIT = { x: 452, y: 656, w: 390 }
const NIGHT = { sky: '#02040f', blue: '#1a56c8', road: '#17327f', wall: '#4f66b4', lamp: '#bfe2ff' }

$('unitIn').innerHTML = UNIT_SVG
$('adUnit').innerHTML = UNIT_SVG

// --- the scene is a fixed drawing, scaled to cover the window
const scene = $('scene')
function fit() {
  const vw = innerWidth, vh = $('hero').clientHeight, narrow = vw < 1000
  // on narrow windows the whole stereo must fit, even if the sky runs out above it
  const k = narrow ? Math.min(Math.max(vw / W, vh / H), vw / (UNIT.w + 20)) : Math.max(vw / W, vh / H)
  const x = narrow ? Math.min(0, Math.max(vw - W * k, vw / 2 - (UNIT.x + UNIT.w / 2) * k)) : (vw - W * k) / 2
  scene.style.transform = `translate(${x}px,${vh - H * k}px) scale(${k})`
}
addEventListener('resize', fit); fit()

// --- the car is a cel silhouette: flat darks, one blue rim of light off the road
const cells = (n, x, p, y, w, h, t) => Array.from({ length: n }, (_, i) => ghostPath(x + i * p, y, w, h, t)).join('')
let bars = ''
for (let i = 0; i < 34; i++) { const h = 8 + (i / 33) ** 1.8 * 44; bars += `<rect x="${942 + i * 7.3}" y="${532 - h}" width="5" height="${h}"/>` }
const RIM = '#4c7cff'
$('dash').innerHTML = `
<defs>
  <filter id="h-glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <linearGradient id="h-stack" x2="0" y2="1"><stop offset="0" stop-color="#8a93a6"/><stop offset=".5" stop-color="#3f4656"/><stop offset="1" stop-color="#151925"/></linearGradient>
</defs>
<path d="M0 0H1600V22H0Z" fill="#03040a"/>
<path d="M0 0H120L0 340Z" fill="#03040a"/><path d="M120 0L0 340" stroke="${RIM}" stroke-width="2" stroke-opacity=".7"/>
<path d="M1600 0H1470L1600 372Z" fill="#03040a"/><path d="M1470 0L1600 372" stroke="${RIM}" stroke-width="2" stroke-opacity=".7"/>
<g><rect x="800" y="10" width="14" height="30" fill="#05060c"/><rect x="662" y="30" width="290" height="80" rx="14" fill="#05060c" stroke="#2c3f74" stroke-width="2"/>
  <rect x="672" y="39" width="270" height="62" rx="8" fill="#08122e"/><path d="M672 80Q800 58 942 76V93Q942 101 934 101H680Q672 101 672 93Z" fill="#132a6a"/><circle cx="790" cy="62" r="3" fill="#ff3a2c"/><circle cx="806" cy="62" r="3" fill="#ff3a2c"/></g>

<path d="M0 668C170 640 320 628 470 626C620 624 760 632 850 646L1600 628V900H0Z" fill="#070a14"/>
<path d="M0 668C170 640 320 628 470 626C620 624 760 632 850 646" fill="none" stroke="${RIM}" stroke-width="2.4"/>
<path d="M1400 668L1600 628" stroke="${RIM}" stroke-width="2"/>
<path d="M0 760C120 730 280 712 430 712V900H0Z" fill="#0b1020"/>
<path d="M250 630L640 618L690 638" fill="none" stroke="#02030a" stroke-width="6" stroke-linecap="round"/>

<g fill="#03040a" stroke="#22325e">${[0, 1].map(i => `<rect x="${64 + i * 150}" y="680" width="132" height="52" rx="7"/>`).join('')}</g>
<g stroke="#121a33" stroke-width="3">${[0, 1].flatMap(i => [0, 1, 2, 3, 4].map(k => `<path d="M${74 + i * 150} ${689 + k * 8}h112"/>`)).join('')}</g>
<text x="66" y="782" font-family="Michroma,Arial" font-size="13" fill="#47598a" letter-spacing="3">DOHC 24V TWIN TURBO</text>

<path d="M434 650Q434 638 446 638H848Q860 638 860 650V900H434Z" fill="url(#h-stack)"/>
<rect x="444" y="648" width="406" height="244" rx="5" fill="#030407"/>

<g transform="translate(0 118)">
  <path d="M842 660L900 498Q916 452 966 452H1282Q1332 452 1348 498L1406 660Z" fill="#0b1020"/>
  <path d="M900 498Q916 452 966 452H1282Q1332 452 1348 498" fill="none" stroke="${RIM}" stroke-width="2.4"/>
  <path d="M884 648L928 508Q938 472 976 472H1272Q1310 472 1320 508L1364 648Z" fill="#04050a"/>
  <rect x="938" y="474" width="256" height="62" fill="#180a00"/>
  <g id="bars" fill="#ff9a2a" filter="url(#h-glow)" opacity=".1">${bars}</g>
  <path d="${cells(3, 1204, 38, 482, 30, 46, 5)}" fill="#ff7a1a" opacity=".1"/>
  <path id="speed" d="" fill="#ff7a1a" filter="url(#h-glow)"/>
  <g transform="rotate(-5 1066 496)"><rect x="1012" y="478" width="110" height="44" fill="#f6e27a"/><text x="1020" y="497" font-family="Segoe Print,Bradley Hand,cursive" font-size="13" fill="#2a2410">speedo —</text><text x="1020" y="514" font-family="Segoe Print,Bradley Hand,cursive" font-size="13" fill="#2a2410">call mechanic</text></g>
  <g transform="translate(1056 596)">${[0, 1, 2].flatMap(c => [0, 1].map(r => `<rect x="${c * 46}" y="${r * 24}" width="40" height="19" rx="2" fill="#6d1810"/>`)).join('')}
    <g fill="#ff3b2e" filter="url(#h-glow)"><rect x="46" width="40" height="19" rx="2"/><rect y="24" width="40" height="19" rx="2"/></g></g>
  <rect x="958" y="590" width="30" height="16" rx="3" fill="#2be07b" filter="url(#h-glow)"/><rect x="1252" y="590" width="30" height="16" rx="3" fill="#2f6bff" filter="url(#h-glow)"/>

  <circle cx="1124" cy="858" r="272" fill="none" stroke="#111a33" stroke-width="58"/>
  <path d="M900 700A272 272 0 0 1 1300 650" fill="none" stroke="${RIM}" stroke-width="2.6" stroke-linecap="round" transform="translate(-6 -22)"/>
  <path d="M880 800L1040 790V860L900 900Z" fill="#111a33"/><path d="M1368 800L1208 790V860L1348 900Z" fill="#111a33"/>
  <path d="M1012 770Q1012 748 1036 748H1212Q1236 748 1236 770V900H1012Z" fill="#0e1426" stroke="#22325e"/>
</g>
<circle cx="1500" cy="800" r="46" fill="#05060c" stroke="#22325e" stroke-width="2"/><circle cx="1500" cy="800" r="30" fill="#2b3142"/><rect x="1494" y="778" width="12" height="44" rx="4" fill="#0b0d14"/>`

// the cluster has been dying for months: no real reading, only stray segments and the odd twitch
const GARBLE = ['-', '0', '1', '8', ' ', ' ']
function twitch() {
  const pick = () => GARBLE[Math.floor(Math.random() * GARBLE.length)]
  $('speed').setAttribute('d', [pick(), pick(), pick()].map((c, i) => segPath(c, 1204 + i * 38, 482, 30, 46, 5)).join(''))
  const spark = Math.random() < .3
  $('bars').setAttribute('opacity', spark ? .8 : .1)
  setTimeout(twitch, reduced ? 4000 : spark ? 70 + Math.random() * 120 : 500 + Math.random() * 2600)
}
twitch()

// --- the road: drawn small and scaled up, which gives the soft look of a video tape
const BUF = 2 / 3, RW = 1600, RH = 660
const road = $('road').getContext('2d')
road.scale(BUF, BUF)
const bg = document.createElement('canvas'); bg.width = RW; bg.height = RH
const DROP = 46, HY = 392, BOTTOM = 660, CX = 620, WIDTH = 1600
const yAt = t => HY + (BOTTOM - HY) * t
let bend = 300
const cAt = t => CX + bend * (1 - t) ** 2.4
const xAt = (t, o) => cAt(t) + o * WIDTH * t
let seedN = 11
const rnd = () => { seedN = (seedN * 16807) % 2147483647; return seedN / 2147483647 }
const beacons = []

function paintCity() {
  const x = bg.getContext('2d')
  const sky = x.createLinearGradient(0, 0, 0, 262)
  sky.addColorStop(0, NIGHT.sky); sky.addColorStop(.5, '#071142'); sky.addColorStop(.86, '#0f2f8e'); sky.addColorStop(1, NIGHT.blue)
  x.fillStyle = sky; x.fillRect(0, 0, RW, RH)
  x.fillStyle = '#ffffff'
  for (let i = 0; i < 90; i++) { x.globalAlpha = rnd() * .5; x.fillRect(rnd() * RW, rnd() * 170, 1.5, 1.5) }
  x.globalAlpha = 1
  // painted cloud bands catching the city glow
  x.fillStyle = '#2a4fc0'
  for (const [cx, cy, w] of [[300, 196, 520], [1050, 214, 700], [640, 150, 340], [1330, 160, 300]]) { x.globalAlpha = .13; x.beginPath(); x.ellipse(cx, cy, w / 2, 7, 0, 0, 7); x.fill() }
  x.globalAlpha = 1
  const glow = x.createLinearGradient(0, 240, 0, 274)
  glow.addColorStop(0, '#6fd0ff00'); glow.addColorStop(.7, '#7fdcffcc'); glow.addColorStop(1, '#bff2ff')
  x.fillStyle = glow; x.fillRect(0, 240, RW, 34)

  // towers with an even grid of office lights, tips marked in red
  const tower = (bx, w, top, tone) => {
    x.fillStyle = tone; x.fillRect(bx, top, w, 300 - top)
    for (let wy = top + 8; wy < 276; wy += 7) for (let wx = bx + 4; wx < bx + w - 4; wx += 6) {
      if (rnd() < .4) { const r = rnd(); x.fillStyle = r < .72 ? '#e8f2ff' : r < .9 ? '#ffd79a' : '#7fd8ff'; x.globalAlpha = .3 + rnd() * .55; x.fillRect(wx, wy, 3.4, 3); x.globalAlpha = 1 }
    }
    beacons.push([bx + 3, top - 2], [bx + w - 3, top - 2])
  }
  ;[[60, 70, 196], [150, 54, 214], [980, 66, 176], [1054, 74, 128], [1136, 62, 158], [1204, 86, 94], [1300, 70, 146], [1384, 62, 184], [1456, 88, 120], [1552, 60, 170]].forEach(b => tower(b[0], b[1], b[2], '#060a22'))
  // roof sign on the tallest block
  x.fillStyle = '#0e2c8a'; x.fillRect(1208, 72, 78, 22); x.strokeStyle = '#8fd0ff'; x.lineWidth = 1.5; x.strokeRect(1208, 72, 78, 22)
  x.fillStyle = '#dff2ff'; x.font = '11px Michroma,Arial'; x.textAlign = 'center'; x.fillText('CARDECK', 1247, 87); x.textAlign = 'left'

  // the low city: a black band with scattered lights
  x.fillStyle = '#03050f'
  x.beginPath(); x.moveTo(0, RH); x.lineTo(0, 272)
  for (let bx = 0; bx < RW; bx += 16 + rnd() * 34) { const h = 262 + rnd() * 14; x.lineTo(bx, h); x.lineTo(bx + 18, h) }
  x.lineTo(RW, 270); x.lineTo(RW, RH); x.fill()
  for (let i = 0; i < 240; i++) { const r = rnd(); x.fillStyle = r < .6 ? '#cfe6ff' : r < .85 ? '#ffc98a' : '#ff5a4a'; x.globalAlpha = .25 + rnd() * .6; x.fillRect(rnd() * RW, 280 + rnd() * 120, 2, 1.6) }
  x.globalAlpha = 1

  // the far elevated road, a string of lights bending down to the right
  const fy = px => 300 + 34 * Math.max(0, Math.min(1, (px - 640) / 500)) ** 2 + (px > 1140 ? (px - 1140) * .02 : 0)
  x.strokeStyle = '#7fdcff'; x.lineWidth = 3; x.shadowColor = '#7fdcff'; x.shadowBlur = 12
  x.beginPath(); for (let px = 0; px <= RW; px += 8) px ? x.lineTo(px, fy(px)) : x.moveTo(px, fy(px)); x.stroke()
  x.fillStyle = '#f2fbff'
  for (let px = 8; px < RW; px += 27) { x.beginPath(); x.ellipse(px, fy(px) - 5, 4, 2.6, 0, 0, 7); x.fill() }
  x.shadowBlur = 0
}

// lamp glow is one soft sprite, stamped at every lamp
const halo = document.createElement('canvas'); halo.width = halo.height = 128
{ const x = halo.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, '#ffffff'); g.addColorStop(.1, '#d5ecff'); g.addColorStop(.28, '#3f8dffb0'); g.addColorStop(1, '#2a6bff00')
  x.fillStyle = g; x.fillRect(0, 0, 128, 128) }

// the car ahead: boxy 80s saloon, painted once
const car = document.createElement('canvas'); car.width = 320; car.height = 170
{ const x = car.getContext('2d'), p = (d, f) => { x.fillStyle = f; x.fill(new Path2D(d)) }
  p('M26 150H294V166H26Z', '#04050a')
  p('M64 66L92 10Q95 4 104 4H216Q225 4 228 10L256 66Z', '#120d18')
  p('M78 62L100 14H220L242 62Z', '#2a0d1a'); p('M100 14L112 40L208 40L220 14Z', '#47152a')
  p('M14 80Q14 66 30 66H290Q306 66 306 80V146Q306 154 296 154H24Q14 154 14 146Z', '#17101c')
  p('M14 80Q14 66 30 66H290Q306 66 306 80V84H14Z', '#6a6f8c')
  p('M14 134H306V146Q306 154 296 154H24Q14 154 14 146Z', '#8d93ad')
  p('M134 104H186V124H134Z', '#d9dce6'); p('M140 110H180V112H140ZM140 116H172V118H140Z', '#2a2d3c')
  x.shadowColor = '#ff2a1a'; x.shadowBlur = 22
  for (const lx of [24, 196]) { p(`M${lx} 92H${lx + 100}V128H${lx}Z`, '#ff2f1e') }
  x.shadowBlur = 0
  for (const lx of [24, 196]) for (let k = 1; k < 4; k++) p(`M${lx + k * 25 - 1} 92h2v36h-2Z`, '#7a0d08')
}

let travel = 0, last = 0, heroSeen = true
function strip(o, half, from, to, color) {
  const x = road, steps = 22
  x.fillStyle = color; x.beginPath()
  for (let i = 0; i <= steps; i++) { const t = from + (to - from) * i / steps; x.lineTo(xAt(t, o - half), yAt(t)) }
  for (let i = steps; i >= 0; i--) { const t = from + (to - from) * i / steps; x.lineTo(xAt(t, o + half), yAt(t)) }
  x.fill()
}
function draw(now, dt) {
  const x = road
  bend = 300 + 90 * Math.sin(now / 7000)
  travel += dt * .0024
  x.drawImage(bg, -(bend - 300) * .12 - 20, DROP)

  // asphalt
  const a = x.createLinearGradient(0, HY, 0, BOTTOM)
  a.addColorStop(0, '#2c55c2'); a.addColorStop(.35, NIGHT.road); a.addColorStop(1, '#0b1a52')
  x.fillStyle = a; x.beginPath()
  for (let i = 0; i <= 26; i++) { const t = .03 + .97 * i / 26; x.lineTo(xAt(t, -.5), yAt(t)) }
  for (let i = 26; i >= 0; i--) { const t = .03 + .97 * i / 26; x.lineTo(xAt(t, 1.2), yAt(t)) }
  x.fill()

  // the barrier sweeps from the left edge round to the horizon
  x.fillStyle = NIGHT.wall; x.beginPath()
  for (let i = 0; i <= 26; i++) { const t = .03 + .97 * i / 26; x.lineTo(xAt(t, -.5), yAt(t) - 190 * t - 2) }
  for (let i = 26; i >= 0; i--) { const t = .03 + .97 * i / 26; x.lineTo(xAt(t, -.5), yAt(t)) }
  x.fill()
  x.strokeStyle = '#8ea4e8'; x.lineWidth = 2; x.beginPath()
  for (let i = 0; i <= 26; i++) { const t = .03 + .97 * i / 26; x.lineTo(xAt(t, -.5), yAt(t) - 190 * t - 2) }
  x.stroke()
  x.strokeStyle = '#2f4296'; x.lineWidth = 2
  for (let z = 1 + (1.3 - travel % 1.3); z < 26; z += 1.3) { const t = 1 / z, bx = xAt(t, -.5); x.beginPath(); x.moveTo(bx, yAt(t)); x.lineTo(bx, yAt(t) - 190 * t - 2); x.stroke() }

  // lane paint
  strip(-.44, .007, .04, 1, '#d6e4ff')
  strip(-.40, .003, .04, 1, '#0a1544')
  for (let z = 1 + (1.1 - travel % 1.1) - 1.1; z < 24; z += 1.1) {
    if (z < .6) continue
    strip(.26, .009, Math.min(1, 1 / z), Math.min(1, 1 / (z + .5)), '#f2f6ff')
    strip(-.09, .006, Math.min(1, 1 / z), Math.min(1, 1 / (z + .5)), '#c4d4ff')
  }

  // lamps, far to near, so nearer poles sit in front
  const period = 2.6, list = []
  for (let z = 1.02 + (period - travel % period); z < 22; z += period) { list.push([z, .62]); list.push([z + period / 2, -.5]) }
  list.sort((p, q) => q[0] - p[0])
  for (const [z, o] of list) {
    const t = 1 / z, bx = xAt(t, o), by = yAt(t) - (o < 0 ? 190 * t : 0), h = (o < 0 ? 300 : 460) * t, dir = o < 0 ? 1 : -1
    x.strokeStyle = '#a6b4d8'; x.lineWidth = Math.max(1, 9 * t)
    x.beginPath(); x.moveTo(bx, by); x.lineTo(bx, by - h + 30 * t); x.quadraticCurveTo(bx, by - h, bx + dir * 70 * t, by - h); x.stroke()
    const s = 40 + 260 * t
    x.drawImage(halo, bx + dir * 76 * t - s / 2, by - h - s / 2, s, s)
  }

  // the car ahead holds the middle of the frame
  const tc = .5, cx = xAt(tc, .02) + 10 * Math.sin(now / 2600), cy = yAt(tc) + Math.sin(now / 370) * .8, cw = 250, ch = cw * 170 / 320
  x.globalCompositeOperation = 'lighter'
  x.filter = 'blur(9px)'; x.fillStyle = '#ff2a1a30'
  for (const side of [-1, 1]) { x.beginPath(); x.ellipse(cx + side * cw * .29, cy + 40, cw * .15, 44, 0, 0, 7); x.fill() }
  x.filter = 'none'
  x.globalCompositeOperation = 'source-over'
  x.drawImage(car, cx - cw / 2, cy - ch + 4, cw, ch)

  // red tower lamps blink in slow turns
  if (now % 2400 < 1500) { x.fillStyle = '#ff4030'; for (const [bx, by] of beacons) x.fillRect(bx - 1 - (bend - 300) * .12 - 20, by - 1 + DROP, 2.6, 2.6) }
}
new IntersectionObserver(e => { heroSeen = e[0].isIntersecting }).observe($('hero'))
function loop(now) {
  const dt = Math.min(50, now - last); last = now
  if (heroSeen) draw(now, reduced ? 0 : dt)
  requestAnimationFrame(loop)
}

// --- put a disc in: the stereo lights, then we lean in and hand over to the player
function target() {
  const vw = innerWidth, vh = $('hero').clientHeight, S = 1300 / 760, sw = Math.min(vw * .88, vh * .88 * S), k = sw / UNIT.w
  return { k, x: (vw - sw) / 2 - UNIT.x * k, y: (vh - sw / S) / 2 - UNIT.y * k }
}
let going = false
function go() {
  if (going) return
  going = true
  if (reduced) { location.href = 'player.html'; return }
  scrollTo({ top: 0 })
  Cabin.start()
  document.body.classList.add('started')
  setTimeout(() => { Cabin.insert(); document.body.classList.add('seated') }, 620)
  setTimeout(() => {
    const t = target()
    scene.classList.add('zoom')
    scene.style.transform = `translate(${t.x}px,${t.y}px) scale(${t.k})`
  }, 1300)
  setTimeout(() => { $('black').style.opacity = .94 }, 2750)
  setTimeout(() => { location.href = 'player.html' }, 3050)
}
$('start').onclick = $('start2').onclick = go
Keychain.mount($('chainMount'))
const soundLabel = () => { $('sound').textContent = Cabin.wanted ? 'Sound on' : 'Sound off' }
$('sound').onclick = () => { Cabin.toggle(); soundLabel() }
soundLabel()
$('bookmarklet').href = `javascript:location.href='${new URL('player.html', location.href).href}?yt='+encodeURIComponent(location.href)`
addEventListener('pageshow', e => { if (e.persisted) location.reload() })

;(document.fonts ? document.fonts.load('10px Michroma').catch(() => {}) : Promise.resolve()).then(() => {
  paintCity(); requestAnimationFrame(loop)
})
