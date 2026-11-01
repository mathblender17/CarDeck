'use strict'
// The city outside the player: one long seamless strip, slid by the compositor so it costs the audio nothing.
;(function () {
  if (document.documentElement.dataset.theme) return
  const WIDE = 2400, TALL = 760, GROUND = 700
  let seed = 23
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }

  function paint(x) {
    const sky = x.createLinearGradient(0, 0, 0, TALL)
    ;[[0, '#04041a'], [.3, '#160e52'], [.56, '#3e1a86'], [.76, '#a22c7e'], [.9, '#ef6a6e'], [1, '#ffb27a']].forEach(s => sky.addColorStop(...s))
    x.fillStyle = sky; x.fillRect(0, 0, WIDE, TALL)
    x.fillStyle = '#fff'
    for (let i = 0; i < 160; i++) { x.globalAlpha = rnd() * .55; x.fillRect(rnd() * WIDE, rnd() * 300, 1.6, 1.6) }
    x.globalAlpha = 1

    // every shape is drawn twice, a strip apart, so the strip joins up
    const twice = fn => { fn(0); fn(-WIDE) }
    const tower = (bx, w, top, tone) => {
      const windows = []
      for (let wy = top + 12; wy < GROUND - 4; wy += 11) for (let wx = bx + 7; wx < bx + w - 7; wx += 9) if (rnd() < .46) windows.push([wx, wy, rnd(), .34 + rnd() * .6])
      twice(o => {
        x.fillStyle = tone; x.fillRect(bx + o, top, w, GROUND - top)
        x.fillStyle = '#ffffff10'; x.fillRect(bx + o, top, 3, GROUND - top)
        for (const [wx, wy, r, a] of windows) { x.fillStyle = r < .68 ? '#eaf3ff' : r < .9 ? '#ffd79a' : '#7fd8ff'; x.globalAlpha = a; x.fillRect(wx + o, wy, 5.4, 4.6) }
        x.globalAlpha = 1
        x.fillStyle = '#ff4030'; x.shadowColor = '#ff4030'; x.shadowBlur = 8
        x.fillRect(bx + o + 2, top - 3, 4, 4); x.fillRect(bx + o + w - 6, top - 3, 4, 4); x.shadowBlur = 0
      })
    }
    for (let bx = 0; bx < WIDE; bx += 62 + rnd() * 54) tower(bx, 72, 420 + rnd() * 150, '#1a1250')
    ;[[60, 120, 170], [196, 96, 260], [420, 130, 120], [566, 100, 230], [810, 150, 90], [976, 104, 210], [1210, 120, 150], [1346, 92, 250], [1560, 140, 110], [1716, 100, 220], [1950, 130, 140], [2100, 110, 240], [2250, 120, 180]].forEach(b => tower(b[0], b[1], b[2], '#0b0a2c'))

    // rooftop boards from the boom: land, stocks, golf memberships, all going up
    const sign = (sx, sy, sw, sh, text, fill, ink, size) => twice(o => {
      x.shadowColor = fill; x.shadowBlur = 22; x.fillStyle = fill; x.fillRect(sx + o, sy, sw, sh); x.shadowBlur = 0
      x.fillStyle = ink; x.font = `700 ${size}px "Yu Gothic",Meiryo,"Noto Sans JP",sans-serif`; x.textAlign = 'center'
      x.fillText(text, sx + o + sw / 2, sy + sh / 2 + size * .36)
    })
    sign(436, 66, 98, 44, '不動産', '#ff3a6a', '#fff', 26)
    sign(826, 34, 118, 46, '株式', '#ffd24a', '#3a1a00', 30)
    sign(1224, 96, 92, 40, 'ゴルフ', '#39e0b0', '#04201a', 24)
    sign(1574, 56, 112, 44, 'ディスコ', '#7a6bff', '#fff', 22)
    sign(1964, 86, 102, 44, 'カラオケ', '#ff8a2a', '#fff', 20)
    const vertical = (sx, sy, text, c) => twice(o => {
      x.fillStyle = '#05041a'; x.fillRect(sx + o - 17, sy - 26, 34, text.length * 28 + 12)
      x.shadowColor = c; x.shadowBlur = 14; x.fillStyle = c; x.font = '700 22px "Yu Gothic",Meiryo,"Noto Sans JP",sans-serif'; x.textAlign = 'center'
      ;[...text].forEach((ch, i) => x.fillText(ch, sx + o, sy + i * 28)); x.shadowBlur = 0
    })
    vertical(320, 420, 'ホテル', '#ff5aa8'); vertical(700, 390, '喫茶店', '#59e6ff'); vertical(1120, 430, '洋酒', '#ffd24a'); vertical(1500, 400, '居酒屋', '#ff5a4a'); vertical(1880, 420, '夜景', '#6dffb0')

    // the elevated expressway, a string of lamps along the base of the towers
    x.fillStyle = '#050416'; x.fillRect(0, GROUND - 22, WIDE, TALL)
    x.strokeStyle = '#ffd9a0'; x.lineWidth = 2; x.shadowColor = '#ffb46a'; x.shadowBlur = 10
    x.beginPath(); x.moveTo(0, GROUND - 22); x.lineTo(WIDE, GROUND - 22); x.stroke()
    x.fillStyle = '#fff3d8'
    for (let px = 10; px < WIDE; px += 40) x.fillRect(px, GROUND - 28, 8, 3.5)
    x.shadowBlur = 0; x.textAlign = 'left'
  }

  for (const c of document.querySelectorAll('.strip')) {
    c.width = WIDE; c.height = TALL
    seed = 23; paint(c.getContext('2d'))
  }

  // the index only ever climbs; nobody on this road has heard the word bubble
  let index = 38915
  const fmt = n => n.toLocaleString('en-US')
  function ticker() {
    index += 1 + Math.floor(Math.random() * 9)
    const text = `日経平均 ${fmt(index)} ▲   地価 過去最高 ▲   ゴルフ会員権 ▲   タクシー 一万円札で手を振る ▲   全部 上がる ▲   `
    for (const el of document.querySelectorAll('.tick span')) el.textContent = text
  }
  ticker(); setInterval(ticker, 4000)
})()
