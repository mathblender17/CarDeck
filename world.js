'use strict'
// The city outside the player: one long seamless strip, slid by the compositor so it costs the audio nothing.
;(function () {
  const WIDE = 2400, TALL = 760, GROUND = 700
  let seed = 41
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }

  function paint(x) {
    const sky = x.createLinearGradient(0, 0, 0, TALL)
    ;[[0, '#010818'], [.3, '#04205f'], [.58, '#0a4bb8'], [.8, '#1697ea'], [.93, '#6fdcff'], [1, '#d8fbff']].forEach(s => sky.addColorStop(...s))
    x.fillStyle = sky; x.fillRect(0, 0, WIDE, TALL)

    const twice = fn => { fn(0); fn(-WIDE) }
    // big thin orbits across the sky, the swoosh on every 2002 logo
    twice(o => {
      x.lineWidth = 2
      for (const [cx, rx, ry, a] of [[700, 900, 260, .28], [1900, 1100, 300, .22], [1300, 700, 180, .16]]) {
        x.strokeStyle = `rgba(160,235,255,${a})`
        x.beginPath(); x.ellipse(cx + o, 330, rx, ry, -.08, 0, 7); x.stroke()
      }
    })

    // a suspension bridge strung with lights, out on the bay
    twice(o => {
      x.strokeStyle = '#bff2ff'; x.lineWidth = 2; x.shadowColor = '#6fdcff'; x.shadowBlur = 8
      for (const [a, b] of [[300, 1000], [1000, 1700]]) {
        x.beginPath(); x.moveTo(a + o, 470); x.quadraticCurveTo((a + b) / 2 + o, 640, b + o, 470); x.stroke()
      }
      x.fillStyle = '#e6fbff'
      for (const tx of [300, 1000, 1700]) x.fillRect(tx + o - 6, 462, 12, 200)
      x.shadowBlur = 0
    })

    // glass towers: long horizontal bands of light, curved crowns and aerials
    const tower = (bx, w, top, tone) => {
      const bands = []
      for (let wy = top + 16; wy < GROUND - 6; wy += 13) bands.push([wy, .2 + rnd() * .75, rnd()])
      twice(o => {
        const g = x.createLinearGradient(bx + o, 0, bx + o + w, 0)
        g.addColorStop(0, tone); g.addColorStop(.5, '#0d3f93'); g.addColorStop(1, tone)
        x.fillStyle = g
        x.beginPath(); x.moveTo(bx + o, GROUND); x.lineTo(bx + o, top + 22); x.quadraticCurveTo(bx + o + w / 2, top - 22, bx + o + w, top + 22); x.lineTo(bx + o + w, GROUND); x.fill()
        for (const [wy, a, r] of bands) { x.fillStyle = r < .75 ? '#bdf4ff' : '#7fa8ff'; x.globalAlpha = a; x.fillRect(bx + o + 6, wy, w - 12, 3.2) }
        x.globalAlpha = 1
        x.strokeStyle = '#cfefff'; x.lineWidth = 2
        x.beginPath(); x.moveTo(bx + o + w / 2, top); x.lineTo(bx + o + w / 2, top - 46); x.stroke()
      })
    }
    for (let bx = 0; bx < WIDE; bx += 70 + rnd() * 50) tower(bx, 78, 430 + rnd() * 130, '#07286a')
    ;[[70, 124, 190], [250, 100, 280], [470, 140, 130], [650, 96, 240], [860, 160, 96], [1060, 110, 230], [1260, 126, 160], [1430, 96, 260], [1610, 146, 120], [1800, 104, 230], [2010, 136, 150], [2190, 116, 250]].forEach(b => tower(b[0], b[1], b[2], '#04163f'))

    // wall-sized screens and signs of the broadband era
    const screen = (sx, sy, sw, sh, text, a, b, size) => twice(o => {
      const g = x.createLinearGradient(sx + o, sy, sx + o + sw, sy + sh); g.addColorStop(0, a); g.addColorStop(1, b)
      x.shadowColor = a; x.shadowBlur = 24; x.fillStyle = g; x.fillRect(sx + o, sy, sw, sh); x.shadowBlur = 0
      x.strokeStyle = '#e6fbff'; x.lineWidth = 2; x.strokeRect(sx + o, sy, sw, sh)
      x.fillStyle = '#fff'; x.font = `700 ${size}px "Yu Gothic",Meiryo,"Noto Sans JP",sans-serif`; x.textAlign = 'center'
      x.fillText(text, sx + o + sw / 2, sy + sh / 2 + size * .36)
    })
    screen(486, 206, 108, 60, 'モバイル', '#00d4ff', '#0050ff', 20)
    screen(880, 170, 120, 66, 'ブロードバンド', '#ff2bd6', '#6a2bff', 15)
    screen(1280, 240, 86, 48, 'CD-R', '#39ffb0', '#008cff', 24)
    screen(1626, 196, 112, 62, 'ネットカフェ', '#ffe14a', '#ff7a2a', 18)
    screen(2026, 230, 104, 56, 'ゲーセン', '#00d4ff', '#7a2bff', 20)

    x.fillStyle = '#020a20'; x.fillRect(0, GROUND - 22, WIDE, TALL)
    x.strokeStyle = '#6fdcff'; x.lineWidth = 2; x.shadowColor = '#6fdcff'; x.shadowBlur = 12
    x.beginPath(); x.moveTo(0, GROUND - 22); x.lineTo(WIDE, GROUND - 22); x.stroke()
    x.fillStyle = '#e6fbff'
    for (let px = 12; px < WIDE; px += 34) x.fillRect(px, GROUND - 27, 10, 2.6)
    x.shadowBlur = 0; x.textAlign = 'left'
  }

  for (const c of document.querySelectorAll('.strip')) {
    c.width = WIDE; c.height = TALL
    seed = 41; paint(c.getContext('2d'))
  }

  const text = '23:41 LEFT THE OFFICE   >>   COVERED THE LATE SHIFT FOR THE NEW GUY AGAIN   >>   NEW MESSAGE: thanks for tonight, boss   >>   SPEEDOMETER STILL BROKEN   >>   NO TIME FOR THE MECHANIC   >>   TOKYO BAY BEHIND YOU   >>   SAVED: MOTORCYCLE LISTINGS (3)   >>   KEEP GOING   >>   '
  for (const el of document.querySelectorAll('.tick span')) el.textContent = text

  const world = document.getElementById('world')
  world.insertAdjacentHTML('beforeend', `
  <svg class="trinket" id="flip" viewBox="0 0 110 210">
    <rect x="16" y="2" width="78" height="96" rx="10" fill="#b9c2d0" stroke="#5e6878" stroke-width="2"/>
    <rect x="25" y="12" width="60" height="72" rx="4" fill="#0a2a66"/>
    <rect x="25" y="12" width="60" height="13" fill="#7fd8ff"/>
    <path d="M31 36h48M31 47h48M31 58h36" stroke="#7fe8ff" stroke-width="3"/><rect x="29" y="31" width="52" height="11" fill="none" stroke="#a6ff4d" stroke-width="1.6"/>
    <rect x="38" y="96" width="34" height="10" fill="#6a7486"/>
    <rect x="12" y="104" width="86" height="102" rx="12" fill="#9aa4b4" stroke="#5e6878" stroke-width="2"/>
    <rect x="20" y="112" width="70" height="86" rx="8" fill="#06080e"/>
    <circle cx="55" cy="130" r="11" fill="none" stroke="#39b6ff" stroke-width="2.4"/>
    <g stroke="#39b6ff" stroke-width="2.4" fill="none"><path d="M26 154q29 8 58 -2M26 168q29 8 58 -2M26 182q29 8 58 -2M42 148v44M68 148v44"/></g>
  </svg>
  <svg class="trinket" id="wallet" viewBox="0 0 186 118" role="button" tabindex="0" aria-label="Play Automatic">
    <rect x="6" y="14" width="174" height="100" rx="12" fill="#17191f" stroke="#3a4050" stroke-width="2"/>
    <circle cx="66" cy="62" r="42" fill="#d9e2ee"/><circle cx="66" cy="62" r="42" fill="url(#cdr)"/><circle cx="66" cy="62" r="12" fill="#17191f"/>
    <text x="44" y="42" font-size="11" font-family="Comic Sans MS,Segoe Print,cursive" fill="#14181f" transform="rotate(-8 44 42)">automatic</text>
    <rect x="118" y="26" width="52" height="76" rx="4" fill="#252a35"/><path d="M122 44h44M122 62h44M122 80h44" stroke="#3a4050" stroke-width="2"/>
    <defs><linearGradient id="cdr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fe8ff" stop-opacity=".5"/><stop offset=".5" stop-color="#ffd6f5" stop-opacity=".45"/><stop offset="1" stop-color="#fff3b8" stop-opacity=".45"/></linearGradient></defs>
  </svg>
  <svg class="trinket" id="listing" viewBox="0 0 170 130">
    <path d="M6 22L150 6L164 112L18 126Z" fill="#e9e4d6"/><path d="M6 22L150 6L152 18L8 34Z" fill="#3a4258"/>
    <path d="M26 54h46M24 66h40M26 78h46M24 90h30M26 102h44" stroke="#8a8676" stroke-width="3"/>
    <g fill="none" stroke="#1a1c24" stroke-width="3"><circle cx="102" cy="82" r="12"/><circle cx="142" cy="78" r="12"/><path d="M102 82l16-20h14l10 16M118 62l-4 18h28"/></g>
    <ellipse cx="122" cy="76" rx="42" ry="30" fill="none" stroke="#d42a2a" stroke-width="2.4" transform="rotate(-6 122 76)"/>
  </svg>`)
})()
