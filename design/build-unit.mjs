// Draws the static body of the unit; the player paints everything live on top. Run: node build-unit.mjs
import { writeFileSync } from 'node:fs'
import '../core.js'

const { ghostPath, L } = globalThis.CarDeck
const COL = { vfd: '#8BF2FF', mint: '#6CFFC4', hot: '#F4FEFF', amber: '#FFB238', red: '#FF3A2C', violet: '#8A6BFF', lilac: '#D9CCFF', el: '#4FB2FF' }
const C = L.C
const f = n => +n.toFixed(2)
const out = []
const add = s => out.push(s)
const ghost = (cells, g, color) => add(`<path d="${cells.map(x => ghostPath(x, g.y, g.W, g.H, g.t)).join('')}" fill="${color}" opacity=".07"/>`)
const row = g => Array.from({ length: g.n ?? 4 }, (_, i) => g.x + i * g.p)

// --- primitives
const polar = (r, a) => [C.x + r * Math.cos(a), C.y + r * Math.sin(a)]
function wedge(r, a, b, fill) {
  const [p, q] = [polar(r, a), polar(r, b)]
  return `<path d="M${C.x} ${C.y}L${f(p[0])} ${f(p[1])}A${r} ${r} 0 0 1 ${f(q[0])} ${f(q[1])}Z" fill="${fill}"/>`
}
const svgText = (s, x, y, size, fill, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`
const T = (...a) => add(svgText(...a))
const micro = (s, x, y, fill = '#AEB5BF', anchor = 'start', id = '') => T(s, x, y, 10.5, fill, `class="mc" text-anchor="${anchor}" ${id && `id="${id}"`}`)
const key = (act, label, inner, cls = '') => add(`<g class="key ${cls}" data-act="${act}" role="button" tabindex="0" aria-label="${label}">${inner}</g>`)

// --- defs
add(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -30 1300 760" width="100%" role="group" aria-label="Night Line car stereo">
<style>text{font-family:Michroma,Arial,sans-serif}.mc{font-family:'Saira Condensed',Arial Narrow,sans-serif;font-weight:600;letter-spacing:.09em}
.key{cursor:pointer;outline:none}.key:hover{filter:brightness(1.12)}.key.down{transform:translateY(1.5px)}.key.down,.key.lit{filter:brightness(1.6) saturate(1.3)}.key:focus-visible{outline:2px solid #fff;outline-offset:2px}
.led{opacity:0}.led.on{opacity:1}.preset text{opacity:.4}.preset.loaded text{opacity:1}.preset.cur text{fill:#fff}</style>
<defs>
<filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="glowS" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="brushed" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".006 .95" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .9 0 0 0 -.32"/></filter>
<filter id="drop" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity=".75"/></filter>
<linearGradient id="trim" x2="0" y2="1"><stop offset="0" stop-color="#1D1E23"/><stop offset=".05" stop-color="#0B0C0F"/><stop offset=".9" stop-color="#08090B"/><stop offset="1" stop-color="#222329"/></linearGradient>
<linearGradient id="silver" x2="0" y2="1"><stop offset="0" stop-color="#F2F4F7"/><stop offset=".1" stop-color="#C4CAD2"/><stop offset=".48" stop-color="#8B929C"/><stop offset=".52" stop-color="#B5BBC4"/><stop offset="1" stop-color="#6A717B"/></linearGradient>
<linearGradient id="band" x2="0" y2="1"><stop offset="0" stop-color="#F4F6F9"/><stop offset=".42" stop-color="#B8BEC7"/><stop offset=".46" stop-color="#7C838E"/><stop offset="1" stop-color="#A9B0BA"/></linearGradient>
<linearGradient id="key" x2="0" y2="1"><stop offset="0" stop-color="#34363D"/><stop offset=".16" stop-color="#1C1D22"/><stop offset="1" stop-color="#0B0C0E"/></linearGradient>
<linearGradient id="keySil" x2="0" y2="1"><stop offset="0" stop-color="#FAFBFC"/><stop offset=".5" stop-color="#C2C8D0"/><stop offset=".55" stop-color="#8F96A0"/><stop offset="1" stop-color="#C9CED6"/></linearGradient>
<linearGradient id="rim" x2="0" y2="1"><stop offset="0" stop-color="#E9ECF0"/><stop offset="1" stop-color="#555B65"/></linearGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#6A7DFF" stop-opacity="0"/><stop offset="1" stop-color="#6A7DFF" stop-opacity=".1"/></linearGradient>
<linearGradient id="floor" x2="0" y2="1"><stop offset="0" stop-color="${COL.violet}" stop-opacity=".25"/><stop offset="1" stop-color="${COL.violet}" stop-opacity="1"/></linearGradient>
<radialGradient id="hub" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#AEB4BD"/><stop offset="1" stop-color="#5D636C"/></radialGradient>
<radialGradient id="face" cx=".3" cy=".5" r=".9"><stop offset="0" stop-color="#2C2548"/><stop offset="1" stop-color="#0B0A14"/></radialGradient>
<clipPath id="glass"><path d="M282 132H1036a10 10 0 0 1 10 10V552a10 10 0 0 1-10 10H282a10 10 0 0 1-10-10V541.4A200 200 0 0 0 272 146.6V142a10 10 0 0 1 10-10Z"/></clipPath>
<clipPath id="plate"><rect x="34" y="34" width="1172" height="632" rx="18"/></clipPath>
</defs>`)

// --- chassis
add(`<rect width="1240" height="700" rx="22" fill="url(#trim)"/><rect x="2" y="2" width="1236" height="696" rx="20" fill="none" stroke="#000"/>`)
add(`<rect x="26" y="26" width="1188" height="648" rx="24" fill="url(#silver)"/><rect x="34" y="34" width="1172" height="632" rx="18" fill="#08090C"/>`)
add(`<g clip-path="url(#plate)"><rect x="34" y="120" width="250" height="454" fill="url(#silver)"/><rect x="34" y="34" width="1172" height="92" fill="url(#band)"/><rect x="34" y="120" width="250" height="454" filter="url(#brushed)" opacity=".5"/><rect x="34" y="34" width="1172" height="92" filter="url(#brushed)" opacity=".5"/></g>`)

// disc slot and top band
add(`<rect x="300" y="82" width="890" height="16" rx="8" fill="#20232A"/><rect x="310" y="86" width="870" height="7" rx="3.5" fill="#000"/><rect x="310" y="97" width="870" height="1" fill="#fff" opacity=".65"/>`)
T('NIGHTLINE', 302, 70, 17, '#14161A', 'letter-spacing="3"')
micro('NX-2002  INTEGRATED DISC RECEIVER WITH DSP  ·  50W×4', 1188, 68, '#272A30', 'end')

// silver corner keys
for (const [x, y, w, l, act, label] of [[56, 54, 142, 'OPEN / CLOSE', 'open', 'Load a disc'], [56, 96, 96, 'EJECT', 'eject', 'Eject this disc'], [56, 532, 96, 'MUTE', 'mute', 'Mute']]) {
  key(act, label, `<g filter="url(#drop)"><rect x="${x}" y="${y}" width="${w}" height="32" rx="5" fill="url(#keySil)" stroke="#2A2D33"/></g>` + svgText(l, x + w / 2, y + 21, 10.5, '#16181C', `text-anchor="middle" letter-spacing=".5"`))
}

// --- display glass
add(`<path d="M282 132H1036a10 10 0 0 1 10 10V552a10 10 0 0 1-10 10H282a10 10 0 0 1-10-10V541.4A200 200 0 0 0 272 146.6V142a10 10 0 0 1 10-10Z" fill="#02030A" stroke="#454B56" stroke-width="2"/>`)
add(`<g clip-path="url(#glass)">`)

// header line
const ln = (a, b, c, d, col, w = 1.6) => add(`<path d="M${a} ${b}L${c} ${d}" stroke="${col}" stroke-width="${w}" fill="none"/>`)
ghost(row(L.label), L.label, COL.vfd)
ghost(row({ ...L.slot, n: 2 }), L.slot, COL.vfd)
ghost(L.time.xs, L.time, COL.vfd)
add(`<g filter="url(#glowS)">`)
ln(900, 175, 1028, 175, COL.vfd); ln(1028, 175, 1018, 169, COL.vfd); ln(1028, 175, 1018, 181, COL.vfd)
ln(900, 188, 1028, 188, COL.violet, 1.2)
add(`</g>`)
micro('TRK --', 900, 166, COL.vfd, 'start', 'trk'); micro('NO DISC', 1030, 166, COL.mint, 'end', 'fmt')
micro('SOURCE', 336, 150, COL.amber); micro('---', 336, 163, COL.hot, 'start', 'src')

// spectrum: unlit cells only, the player lights them
const { n: N, rows: ROWS, x: X0, pitch: PITCH, cw: CW, ch: CH, rp: RP, base: BASE } = L.spec
let cells = ''
for (let i = 0; i < N; i++) for (let k = 0; k < ROWS; k++) cells += `M${f(X0 + i * PITCH)} ${BASE - k * RP}h${CW}v${CH}h-${CW}Z`
add(`<path d="${cells}" fill="${COL.vfd}" opacity=".055"/>`)
;['31', '63', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'].forEach((s, i) => micro(s, X0 + i * 63, 416, '#7FD9E6'))

// night road floor: the fan is fixed, the player moves the cross lines and dashes
const { vx: VX, vy: VY, floor: FLOOR } = L.road
add(`<g stroke="url(#floor)" stroke-width="1.1" fill="none">`)
for (let i = -16; i <= 16; i++) add(`<path d="M${VX} ${VY}L${VX + i * 86} ${FLOOR}"/>`)
add(`</g>`)
add(`<path d="M272 ${VY}H1046" stroke="${COL.amber}" stroke-opacity=".22" stroke-width="1.4"/>`)
add(`<g fill="none" stroke="${COL.mint}" stroke-width="1.1" filter="url(#glowS)">`)
;[10, 20, 30, 40].forEach(r => add(`<ellipse cx="506" cy="470" rx="${r * 1.5}" ry="${r * .5}"/>`))
add(`</g>`)
micro('DISC --', 438, 498, COL.mint, 'start', 'mini')
add(`<rect x="${L.mode.x}" y="${L.mode.y}" width="${L.mode.w}" height="${L.mode.h}" rx="2" fill="#3A2BC8" stroke="${COL.violet}"/>`)
T('MODE', 966, 482, 7, COL.lilac, `text-anchor="middle"`); micro('SPECTRUM ANALYZER', 966, 495, '#fff', 'middle', 'mode')

// title ticker
add(`<rect x="272" y="510" width="774" height="52" fill="#040409"/><path d="M272 510H1046" stroke="#2B2E38"/>`)
micro('TITLE', 334, 538, COL.amber)
ghost(row(L.tick), L.tick, COL.amber)
add(`<rect x="272" y="132" width="774" height="430" fill="url(#sheen)"/></g>`)

// --- control: ring and chrome dial; the volume ticks and spinning disc are live
add(`<circle cx="${C.x}" cy="${C.y}" r="198" fill="#050507" stroke="url(#rim)" stroke-width="3"/>`)
add(`<circle cx="${C.x}" cy="${C.y}" r="188" fill="none" stroke="${COL.el}" stroke-width="2.4" filter="url(#glow)"/>`)
micro('VOL', C.x, C.y + 172, '#8FB6D6', 'middle')
add(`<g filter="url(#drop)"><circle cx="${C.x}" cy="${C.y}" r="146" fill="#222"/></g><g>`)
// spun metal: two hard highlights plus fine lathe streaks
for (let i = 0; i < 360; i++) {
  const t = i * Math.PI / 180, l = .34 + .62 * Math.abs(Math.cos(t + .55)) ** 14 + .3 * Math.abs(Math.sin(t + .55)) ** 8 + .05 * Math.sin(t * 37) + .03 * Math.sin(t * 91)
  const g = Math.round(Math.min(1, l) * 255)
  add(wedge(146, t, t + .025, `rgb(${g},${Math.min(255, g + 3)},${Math.min(255, g + 8)})`))
}
add(`</g><circle cx="${C.x}" cy="${C.y}" r="146" fill="none" stroke="#000" stroke-width="2"/><circle cx="${C.x}" cy="${C.y}" r="141" fill="none" stroke="#fff" stroke-opacity=".6"/><circle cx="${C.x}" cy="${C.y}" r="102" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="3"/>`)

// --- right column keys
const SIDE = [['LOCAL', 'DISC IN', 'local', 'Local files'], ['TUBE', 'AUX 1', 'tube', 'YouTube'], ['SHUF', 'RANDOM', 'shuffle', 'Shuffle'], ['RPT', 'REPEAT', 'repeat', 'Repeat'], ['DISP', 'MODE', 'disp', 'Display mode']]
SIDE.forEach(([l, s, act, label], i) => {
  const y = 134 + i * 86, d = `M1098 ${y}H1180a8 8 0 0 1 8 8V${y + 64}a8 8 0 0 1-8 8H1098a36 36 0 0 1 0-72Z`
  key(act, label, `<path d="${d}" fill="url(#rim)" filter="url(#drop)"/><path d="M1098 ${y + 2}H1180a6 6 0 0 1 6 6V${y + 64}a6 6 0 0 1-6 6H1098a34 34 0 0 1 0-68Z" fill="url(#face)"/>`
    + `<circle class="led" id="led-${act}" cx="1084" cy="${y + 36}" r="4.5" fill="${COL.mint}" filter="url(#glow)"/>`
    + svgText(l, 1136, y + 38, 13.5, COL.lilac, `text-anchor="middle" filter="url(#glowS)"`) + svgText(s, 1136, y + 54, 10.5, '#9C8FD8', `class="mc" text-anchor="middle"`))
})

// --- bottom row
add(`<rect x="34" y="574" width="1172" height="1.5" fill="#6A717B"/>`)
const ICON = {
  prev: 'M-4 -9V9L-14 0ZM10 -9V9L0 0Z', next: 'M4 9V-9L14 0ZM-10 9V-9L0 0Z',
  play: 'M-15 -9V9L-1 0ZM5 -9h5v18h-5ZM14 -9h5v18h-5Z'
}
function bottomKey(x, w, act, name, label, icon, cls) {
  key(act, name, `<g filter="url(#drop)"><rect x="${x}" y="600" width="${w}" height="48" rx="10" fill="url(#key)" stroke="#000"/><rect x="${x + .75}" y="600.75" width="${w - 1.5}" height="46.5" rx="9.5" fill="none" stroke="${COL.el}" stroke-opacity=".5"/></g>`
    + (icon ? `<path transform="translate(${x + w / 2} 624)" d="${icon}" fill="${COL.el}" filter="url(#glowS)"/>` : svgText(label, x + w / 2, 630, 15, COL.el, `text-anchor="middle" filter="url(#glowS)"`)), cls)
}
bottomKey(56, 84, 'prev', 'Previous track, hold to seek', '', ICON.prev)
bottomKey(150, 84, 'play', 'Play or pause', '', ICON.play)
bottomKey(244, 84, 'next', 'Next track, hold to seek', '', ICON.next)
for (let i = 0; i < 6; i++) bottomKey(356 + i * 104, 92, 'disc' + i, 'Disc ' + (i + 1), String(i + 1), '', 'preset')
micro('TRACK / SEEK', 192, 593, '#8D95A1', 'middle')
micro('DISC CHANGER', 662, 593, '#8D95A1', 'middle')
add(`<circle cx="1046" cy="624" r="17" fill="url(#hub)"/><circle cx="1046" cy="624" r="9" fill="#050505"/>`); micro('AUX IN', 1046, 593, '#8D95A1', 'middle')
bottomKey(1094, 86, 'cabin', 'Road sound', 'ROAD')
add(`<circle class="led" id="led-cabin" cx="1137" cy="590" r="3.5" fill="${COL.mint}" filter="url(#glow)"/>`)
add(`</svg>`)

const svg = out.join('\n')
writeFileSync(new URL('../unit.js', import.meta.url), 'window.UNIT_SVG = ' + JSON.stringify(svg) + '\n')
console.log('bytes', svg.length)
