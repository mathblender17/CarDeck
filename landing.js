'use strict'
const $ = id => document.getElementById(id)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

$('unitIn').innerHTML = UNIT_SVG
$('adUnit').innerHTML = UNIT_SVG
const scene = $('scene'), car = CarScene($('hero')), UNIT = car.UNIT
new IntersectionObserver(e => { car.run(e[0].isIntersecting) }).observe($('hero'))

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
