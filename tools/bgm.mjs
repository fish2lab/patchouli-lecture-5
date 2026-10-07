// 背景音乐：从一份东方原曲的 MIDI 扒谱里取出旋律、伴奏、低音的音符，写成 src/bgm-data.js，由 core.js 的 score() 用 WebAudio 重新编配（八音盒 + 柔钢琴 + 低音，放慢）。
//   node tools/bgm.mjs <扒谱.mid>
// 本集原曲：少女さとり ～ 3rd eye（东方地灵殿，ZUN）。扒谱来自 AyHa1810/touhou-midi-collection 的 Hisaraito 版（18 轨，480 tpb）。
// MIDI 文件不进仓库，仓库里只有挑出来的音符和我们自己的编配。轨号是 @tonejs/midi 读出来的下标（和 MTrk 顺序不同）：8 长笛（A 段主旋律、B 段副旋律），14 小号（B 段主旋律），21 钢琴，6 贝斯。
import pkg from '@tonejs/midi';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const { Midi } = pkg;
const ROOT = resolve(new URL('..', import.meta.url).pathname);
const file = process.argv[2]; if (!file) { console.error('用法：node tools/bgm.mjs <扒谱.mid>'); process.exit(2); }
const midi = new Midi(readFileSync(file)), ppq = midi.header.ppq;
const B = 4;   // 每小节拍数
// part 名 → [轨号, 小节范围（含两端，可多段）]
const PICK = {
  mel: [[8, [0, 40]], [14, [42, 74]]],   // 主旋律：A 段长笛，B 段小号
  counter: [[8, [42, 74]]],              // 副旋律：B 段的长笛
  piano: [[21, [0, 74]]],
  bass: [[6, [0, 74]]],
};
const parts = {};
for (const [name, picks] of Object.entries(PICK)) {
  const out = [];
  for (const [ti, ...ranges] of picks) for (const n of midi.tracks[ti].notes) {
    const beat = n.ticks / ppq, bar = Math.floor(beat / B);
    if (!ranges.some(([a, b]) => bar >= a && bar <= b)) continue;
    out.push([+beat.toFixed(3), +(n.durationTicks / ppq).toFixed(3), n.midi, +n.velocity.toFixed(2)]);
  }
  out.sort((a, b) => a[0] - b[0] || a[2] - b[2]);
  parts[name] = out;
}
const lenBeats = 75 * B;
const js = `'use strict';\n// 由 tools/bgm.mjs 生成，别手改。原曲：少女さとり ～ 3rd eye（东方地灵殿，ZUN）；音符取自 touhou-midi-collection 的 Hisaraito 扒谱，编配在 core.js 的 score()。\n// 每个音：[拍, 时值（拍）, MIDI 音高, 力度 0..1]\nconst BGM = ${JSON.stringify({ lenBeats, parts })};\n`;
writeFileSync(resolve(ROOT, 'src/bgm-data.js'), js);
console.log('src/bgm-data.js：', Object.entries(parts).map(([k, v]) => `${k} ${v.length}`).join('，'), `，${lenBeats} 拍，${(js.length / 1024).toFixed(0)} KB`);
