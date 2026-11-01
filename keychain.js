'use strict'
// The one thing in the car that is his. Touch it and it swings; pull it down and it stays with you; tap it to hang it back.
;(function (root) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const style = document.createElement('style')
  style.textContent = `.keychain{position:absolute;left:0;top:0;width:70px;height:172px;padding:0;border:0;background:none;cursor:grab;touch-action:none;transform-origin:35px 0;will-change:transform}
.keychain:active{cursor:grabbing}.keychain:focus-visible{outline:2px solid #fff;outline-offset:2px}
.keychain svg{display:block;width:100%;height:100%;overflow:visible;transition:filter 1.2s}
.keychain.comfort svg{filter:drop-shadow(0 0 9px #ffd98a)}`
  document.head.append(style)

  const LINKS = [0, 1, 2, 3, 4].map(i => `<ellipse cx="35" cy="${10 + i * 11}" rx="3.2" ry="6" fill="none" stroke="#c9ced6" stroke-width="1.8"/>`).join('')
  const ART = `<svg viewBox="0 0 70 172" aria-hidden="true">${LINKS}
    <circle cx="35" cy="72" r="10" fill="none" stroke="#d8dde4" stroke-width="2.6"/>
    <path d="M16 86Q16 78 24 78H46Q54 78 54 86V150Q54 160 44 160H26Q16 160 16 150Z" fill="#b08d4f" stroke="#6e5328" stroke-width="2"/>
    <path d="M21 84Q21 82 24 82H46Q49 82 49 85V120Q40 102 21 112Z" fill="#d2b06c"/>
    <circle cx="35" cy="90" r="4" fill="#0a0d14" stroke="#6e5328"/>
    <path d="M24 122l14 7M30 140l18-5M22 146l7-3M40 118l6 9" stroke="#7d6132" stroke-width="1.1" stroke-linecap="round"/></svg>`

  function mount(parent) {
    const el = document.createElement('button')
    el.className = 'keychain'; el.type = 'button'; el.setAttribute('aria-label', 'Keychain. Press to touch it.'); el.innerHTML = ART
    parent.append(el)
    let ang = 0, vel = 0, x = 0, y = 0, off = false, down = null, last = 0
    const scale = () => (parent.offsetParent ? parent.offsetParent.getBoundingClientRect().width / parent.offsetParent.offsetWidth : 1) || 1
    const flick = v => { vel += v }
    function tick(now) {
      const dt = Math.min(40, now - last) / 16.7; last = now
      vel += (-.012 * ang - .022 * vel) * dt
      ang += vel * dt
      if (!off && !down) { x *= .86; y *= .86 }
      const idle = reduced || off ? 0 : Math.sin(now / 1300) * 1.4 + Math.sin(now / 410) * .35
      el.style.transform = `translate(${x}px,${y}px) rotate(${ang + idle}deg)`
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
