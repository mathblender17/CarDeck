'use strict'
// The one thing in the car that is his. Touch it and it swings; pull it down and it stays with you; tap it to hang it back.
;(function (root) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const style = document.createElement('style')
  style.textContent = `.keychain{position:absolute;left:0;top:0;width:90px;height:190px;padding:0;border:0;background:none;cursor:grab;touch-action:none;transform-origin:45px 0;will-change:transform}
.kc-game{transform-origin:64px 118px}
.keychain:active{cursor:grabbing}.keychain:focus-visible{outline:2px solid #fff;outline-offset:2px}
.keychain svg{display:block;width:100%;height:100%;overflow:visible;transition:filter 1.2s}
.keychain.comfort svg{filter:drop-shadow(0 0 9px #ffd98a)}`
  document.head.append(style)

  const LINKS = [0, 1, 2, 3].map(i => `<ellipse cx="45" cy="${9 + i * 11}" rx="3.2" ry="6" fill="none" stroke="#c9ced6" stroke-width="1.8"/>`).join('')
  // sky, mountain, sea and farmland sealed under one lens; the game hangs apart, the part of his life still ahead
  const ART = `<svg viewBox="0 0 90 190" aria-hidden="true"><defs>
      <linearGradient id="kc-sky" x2="0" y2="1"><stop offset="0" stop-color="#2a5fc4"/><stop offset=".6" stop-color="#9fd0f2"/><stop offset="1" stop-color="#ffdca8"/></linearGradient>
      <clipPath id="kc-lens"><circle cx="45" cy="86" r="31"/></clipPath></defs>
    ${LINKS}<circle cx="45" cy="50" r="5.5" fill="none" stroke="#d8dde4" stroke-width="2.2"/>
    <circle cx="45" cy="86" r="36" fill="#b08d4f" stroke="#6e5328" stroke-width="2"/>
    <path d="M14 76A32 32 0 0 1 72 66" fill="none" stroke="#e7cd92" stroke-width="2.4" stroke-linecap="round"/>
    <g clip-path="url(#kc-lens)">
      <rect x="10" y="52" width="70" height="40" fill="url(#kc-sky)"/>
      <circle cx="60" cy="68" r="4.5" fill="#fff4d0"/>
      <path d="M12 91L32 62L40 72L47 60L66 91Z" fill="#4a5a8c"/><path d="M47 60L41 70L46 68L49 72L53 67Z" fill="#f4f7fc"/><path d="M32 62L28 68L33 67L37 69Z" fill="#f4f7fc"/>
      <rect x="10" y="88" width="70" height="11" fill="#1f6fb8"/>
      <path d="M16 92q3-2 6 0t6 0M40 95q3-2 6 0t6 0M58 91q3-2 6 0t6 0" fill="none" stroke="#bfe6ff" stroke-width="1.2"/>
      <path d="M10 98Q45 92 80 98V120H10Z" fill="#7fa83c"/>
      <path d="M10 104Q45 98 80 104V110Q45 104 10 110Z" fill="#d9b84a"/>
      <path d="M10 114Q45 108 80 114V120H10Z" fill="#5f8a2e"/>
      <path d="M45 99L34 120M45 99L45 120M45 99L56 120M45 99L24 118M45 99L66 118" stroke="#4d6f24" stroke-width=".9"/>
    </g>
    <path d="M22 66A26 26 0 0 1 44 60" fill="none" stroke="#ffffff" stroke-opacity=".65" stroke-width="2.4" stroke-linecap="round"/>
    <g class="kc-game">
      <path d="M64 118v13" stroke="#c9ced6" stroke-width="1.6" stroke-dasharray="3 2"/>
      <rect x="49" y="131" width="30" height="20" rx="8" fill="#20232c" stroke="#8d95a1" stroke-width="1.4"/>
      <path d="M55 139h7v4h-7ZM56.5 137.500h4v7h-4Z" fill="#d8dde4"/><circle cx="70" cy="139" r="2" fill="#ff5a4a"/><circle cx="74" cy="143" r="2" fill="#4fb2ff"/>
    </g></svg>`

  function mount(parent) {
    const el = document.createElement('button')
    el.className = 'keychain'; el.type = 'button'; el.setAttribute('aria-label', 'Keychain. Press to touch it.'); el.innerHTML = ART
    parent.append(el)
    let ang = 0, vel = 0, x = 0, y = 0, off = false, down = null, last = 0, near = 1
    const game = el.querySelector('.kc-game')
    const scale = () => (parent.offsetParent ? parent.offsetParent.getBoundingClientRect().width / parent.offsetParent.offsetWidth : 1) || 1
    const flick = v => { vel += v }
    function tick(now) {
      const dt = Math.min(40, now - last) / 16.7; last = now
      vel += (-.012 * ang - .022 * vel) * dt
      ang += vel * dt
      if (!off && !down) { x *= .86; y *= .86 }
      const idle = reduced || off ? 0 : Math.sin(now / 1300) * 1.4 + Math.sin(now / 410) * .35
      // in the hand it comes close enough to look at
      near += ((off ? 2.1 : 1) - near) * .1 * dt
      el.style.transform = `translate(${x}px,${y - (near - 1) * 86}px) rotate(${ang + idle}deg) scale(${near})`
      game.style.transform = `rotate(${-(ang + idle) * 1.8}deg)`
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !off) flick(.7) })
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); down = { px: e.clientX, py: e.clientY, x, y, moved: false }; e.preventDefault() })
    el.addEventListener('pointermove', e => {
      if (!down) return
      const k = scale(), dx = (e.clientX - down.px) / k, dy = (e.clientY - down.py) / k
      if (Math.hypot(dx, dy) > 5) down.moved = true
      if (down.moved) { x = down.x + dx; y = down.y + dy; off = true }
    })
    el.addEventListener('pointerup', () => {
      if (down && !down.moved) { if (off) off = false; flick(off ? 0 : 3.4); root.Cabin?.clink() }
      else if (down) root.Cabin?.clink()
      down = null
    })
    el.addEventListener('click', e => { if (e.detail === 0) { flick(3.4); root.Cabin?.clink() } })
    return {
      comfort() { flick(1.6); el.classList.add('comfort'); setTimeout(() => el.classList.remove('comfort'), 3200) }
    }
  }
  root.Keychain = { mount }
})(globalThis)
