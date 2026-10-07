// 检查粉笔音效：离线混出一段的声音 → out/sfx-<段>.wav，打印峰值（全混音和只有粉笔声各一个）和事件数。页面报错时退出码 1。
//   node tools/sfxcheck.mjs            默认 opening
//   node tools/sfxcheck.mjs board      别的段
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openFilm, ROOT } from './browser.mjs';
const key = process.argv[2] || 'opening';
mkdirSync(resolve(ROOT, 'out'), { recursive: true });
const { browser, page, errors } = await openFilm('scene=' + key);
let code = 0;
try {
  const r = await page.evaluate(async () => {
    const dur = __film.DUR, b64 = await mixdownWav(0, dur);
    // 只混粉笔声，量它自己的峰值（同样过 master 1.8）
    const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * dur), sr), g = oac.createGain(); g.gain.value = 1.8; g.connect(oac.destination);
    const n = sfxMix(oac, g, 0, 0, dur), buf = await oac.startRendering(); let pk = 0;
    for (let ch = 0; ch < 2; ch++) for (const v of buf.getChannelData(ch)) pk = Math.max(pk, Math.abs(v));
    return { b64, n, sfxPeak: pk, dur, auto: !SFX_EV[FILM.T[0].key] };
  });
  const wav = Buffer.from(r.b64, 'base64'); let pk = 0;
  for (let o = 44; o + 1 < wav.length; o += 2) pk = Math.max(pk, Math.abs(wav.readInt16LE(o)));
  const db = x => (20 * Math.log10(Math.max(x, 1e-9))).toFixed(1);
  const f = resolve(ROOT, `out/sfx-${key}.wav`); writeFileSync(f, wav);
  console.log(`wrote ${f}  (${r.dur.toFixed(2)} s)`);
  console.log(`全混音峰值 ${db(pk / 32767)} dBFS；粉笔声单独峰值 ${db(r.sfxPeak)} dBFS`);
  console.log(`sfx 事件 ${r.n} 个${r.auto ? '（未登记，自动推断）' : ''}`);
} catch (e) { console.error(e); code = 1; }
await browser.close();
if (errors.length) { console.error('page errors:\n' + [...new Set(errors)].join('\n')); code = 1; }
process.exit(code);
