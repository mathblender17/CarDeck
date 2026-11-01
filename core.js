// Pure logic shared by the drawing script, the player and the tests.
(function (root) {
  const f = n => +n.toFixed(2)

  function hex(a, b, t, vertical) {
    const h = t / 2
    return vertical
      ? [[a[0], a[1]], [a[0] + h, a[1] + h], [b[0] + h, b[1] - h], [b[0], b[1]], [b[0] - h, b[1] - h], [a[0] - h, a[1] + h]]
      : [[a[0], a[1]], [a[0] + h, a[1] - h], [b[0] - h, b[1] - h], [b[0], b[1]], [b[0] - h, b[1] + h], [a[0] + h, a[1] + h]]
  }
  function diag(a, b, t) {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(dx, dy), [nx, ny] = [-dy / l * t / 2, dx / l * t / 2]
    return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]
  }
  function segments(W, H, t) {
    const g = t * 0.32, m = H / 2, c = W / 2, i = t * 0.5
    return {
      a: hex([i + g, i], [W - i - g, i], t), d: hex([i + g, H - i], [W - i - g, H - i], t),
      g1: hex([i + g, m], [c - g, m], t), g2: hex([c + g, m], [W - i - g, m], t),
      f: hex([i, i + g], [i, m - g], t, 1), e: hex([i, m + g], [i, H - i - g], t, 1),
      b: hex([W - i, i + g], [W - i, m - g], t, 1), c: hex([W - i, m + g], [W - i, H - i - g], t, 1),
      i: hex([c, t + g], [c, m - g], t * .8, 1), l: hex([c, m + g], [c, H - t - g], t * .8, 1),
      h: diag([t * 1.3, t * 1.3], [c - t * .7, m - t * .7], t * .72), j: diag([W - t * 1.3, t * 1.3], [c + t * .7, m - t * .7], t * .72),
      k: diag([t * 1.3, H - t * 1.3], [c - t * .7, m + t * .7], t * .72), m: diag([W - t * 1.3, H - t * 1.3], [c + t * .7, m + t * .7], t * .72)
    }
  }
  // 1 and 2 stand for the two halves of the middle bar
  const GLYPH = {
    0: 'abcdef', 1: 'bc', 2: 'ab12ed', 3: 'ab2cd', 4: 'f12bc', 5: 'af12cd', 6: 'afedc12', 7: 'abc', 8: 'abcdef12', 9: 'abcdf12',
    A: 'abcef12', B: 'abcd2il', C: 'adef', D: 'abcdil', E: 'adef1', F: 'aef1', G: 'acdef2', H: 'bcef12', I: 'adil', J: 'bcde', K: 'ef1jm', L: 'def',
    M: 'bcefhj', N: 'bcefhm', O: 'abcdef', P: 'abef12', Q: 'abcdefm', R: 'abef12m', S: 'acdf12', T: 'ail', U: 'bcdef', V: 'efkj', W: 'bcefkm',
    X: 'hjkm', Y: 'hjl', Z: 'adjk', '-': '12', '+': '12il', '/': 'jk', "'": 'i', '&': 'adefhm', '#': 'abcdef12ilhjkm'
  }
  const SKEW = .09
  const poly = (pts, x, y, H) => 'M' + pts.map(p => f(p[0] + (H - p[1]) * SKEW + x) + ' ' + f(p[1] + y)).join('L') + 'Z'
  const glyphKeys = ch => [...(GLYPH[ch] || '')].map(k => k === '1' ? 'g1' : k === '2' ? 'g2' : k)

  function segPath(ch, x, y, W, H, t) {
    const seg = segments(W, H, t)
    return glyphKeys(ch).map(k => poly(seg[k], x, y, H)).join('')
  }
  function ghostPath(x, y, W, H, t) {
    const seg = segments(W, H, t)
    return Object.values(seg).map(p => poly(p, x, y, H)).join('')
  }

  const AUDIO_EXT = /\.(mp3|m4a|aac|flac|wav|ogg|oga|opus|weba)$/i
  const isAudioName = name => AUDIO_EXT.test(name)

  function cleanTitle(name) {
    const base = name.split(/[\\/]/).pop().replace(/\.[^.]+$/, '').replace(/_/g, ' ')
    return (base.replace(/^\d{1,3}\s*[-._)]+\s*|^\d{1,3}\s+(?=\D)/, '').trim() || base).trim()
  }
  // Keeps only what the segments can draw
  const displayText = s => s.toUpperCase().replace(/[^A-Z0-9\-+/'& ]+/g, ' ').replace(/\s+/g, ' ').trim()
  const compareNames = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

  function fmtTime(s) {
    if (!isFinite(s) || s < 0) s = 0
    const m = Math.min(99, Math.floor(s / 60))
    return String(m).padStart(2, '0') + String(s >= 6000 ? 59 : Math.floor(s % 60)).padStart(2, '0')
  }

  function parseYouTube(text) {
    let u
    try { u = new URL(text.trim()) } catch { return null }
    if (!/^https?:$/.test(u.protocol)) return null
    const host = u.hostname.replace(/^(www|m|music)\./, '')
    const ok = id => (id && /^[\w-]{6,64}$/.test(id) ? id : null)
    let video = null
    if (host === 'youtu.be') video = ok(u.pathname.slice(1))
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)
      video = ok(m ? m[1] : u.searchParams.get('v'))
    } else return null
    const list = ok(u.searchParams.get('list'))
    return video || list ? { video, list } : null
  }

  // Log-spaced FFT bin edges so each band covers a similar musical width
  function bandEdges(n, sampleRate, fftSize, lo = 40, hi = 16000) {
    const bins = fftSize / 2, hz = sampleRate / fftSize, edges = []
    for (let i = 0; i <= n; i++) edges.push(Math.min(bins, Math.max(1, Math.round(lo * (hi / lo) ** (i / n) / hz))))
    for (let i = 1; i <= n; i++) if (edges[i] <= edges[i - 1]) edges[i] = edges[i - 1] + 1
    return edges
  }

  // Maps a pointer angle on the knob to 0..1 across its 270 degree sweep
  function angleToVolume(dx, dy) {
    let a = Math.atan2(dy, dx) * 180 / Math.PI - 135
    while (a < 0) a += 360
    if (a > 270) a = a > 315 ? 0 : 270
    return a / 270
  }

  root.CarDeck = {
    segPath, ghostPath, isAudioName, cleanTitle, displayText, compareNames, fmtTime, parseYouTube, bandEdges, angleToVolume,
    L: {
      C: { x: 240, y: 344 }, glass: { x: 272, y: 132, w: 774, h: 430 }, view: { x: -30, y: -30, w: 1300, h: 760 },
      label: { x: 396, y: 152, W: 30, H: 46, t: 5.2, p: 38 }, slot: { x: 576, y: 152, W: 30, H: 46, t: 5.2, p: 38 },
      time: { xs: [686, 728, 793.6, 835.6], colon: 770, y: 152, W: 34, H: 46, t: 6 },
      spec: { n: 46, rows: 20, x: 458, pitch: 12.48, cw: 8.8, ch: 4.8, rp: 8, base: 394 },
      road: { vx: 760, vy: 424, floor: 506 }, mode: { x: 902, y: 470, w: 128, h: 30 },
      tick: { x: 384, y: 518, W: 20, H: 30, t: 3.4, p: 25.6, n: 25 }
    }
  }
})(globalThis)
