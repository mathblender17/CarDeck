// Run: node core.test.mjs
import assert from 'node:assert/strict'
import './core.js'
const { cleanTitle, displayText, fmtTime, parseYouTube, bandEdges, angleToVolume, compareNames, isAudioName, segPath } = globalThis.CarDeck

assert.equal(cleanTitle('Album/03 - Night Drive.mp3'), 'Night Drive')
assert.equal(cleanTitle('12 Tollway.flac'), 'Tollway')
assert.equal(cleanTitle('99 Problems.mp3'), 'Problems')
assert.equal(cleanTitle('1979.mp3'), '1979')
assert.equal(cleanTitle('my_song.wav'), 'my song')

assert.equal(displayText("Don't Stop (Live)!"), "DON'T STOP LIVE")
assert.equal(displayText('गीत'), '')

assert.equal(fmtTime(104), '0144')
assert.equal(fmtTime(NaN), '0000')
assert.equal(fmtTime(7000), '9959')

const v = 'dQw4w9WgXcQ', l = 'PLabc123def'
assert.deepEqual(parseYouTube(`https://www.youtube.com/watch?v=${v}&list=${l}`), { video: v, list: l })
assert.deepEqual(parseYouTube(`https://youtu.be/${v}?si=x`), { video: v, list: null })
assert.deepEqual(parseYouTube(`https://music.youtube.com/playlist?list=${l}`), { video: null, list: l })
assert.deepEqual(parseYouTube(`https://youtube.com/shorts/${v}`), { video: v, list: null })
assert.equal(parseYouTube('https://evil.example/watch?v=' + v), null)
assert.equal(parseYouTube('javascript:alert(1)'), null)
assert.equal(parseYouTube('not a url'), null)
assert.equal(parseYouTube('https://youtube.com/watch?v=a"><b'), null)

const e = bandEdges(46, 48000, 2048)
assert.equal(e.length, 47)
assert.ok(e.every((x, i) => !i || x > e[i - 1]), 'every band has at least one bin')
assert.ok(e.at(-1) <= 1024 + 46)

assert.equal(angleToVolume(-1, 1), 0)
assert.equal(angleToVolume(1, 1), 1)
assert.ok(Math.abs(angleToVolume(0, -1) - .5) < 1e-9)
assert.equal(angleToVolume(-.01, 1), 0)
assert.equal(angleToVolume(.01, 1), 1)

assert.ok(compareNames('2 b.mp3', '10 a.mp3') < 0)
assert.ok(isAudioName('a.FLAC') && !isAudioName('cover.jpg'))
for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-#') assert.ok(segPath(ch, 0, 0, 20, 30, 3).length, ch)
console.log('ok')
