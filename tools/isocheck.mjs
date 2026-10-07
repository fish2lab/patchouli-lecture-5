// 检查等轴测粉笔图（src/lec/iso.js）：每个图在 8 秒演示里均匀取 N 帧拼成联系表 → out/iso/<fig>.jpg，并打印每帧耗时。
// 页面有报错时退出码 1。
//   node tools/isocheck.mjs terrain plug patch phosphor --n 12
//   node tools/isocheck.mjs plug --at 3,7.8      只出这几秒的整帧 → out/iso/<fig>-<t>.png
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openFilm, ROOT } from './browser.mjs';
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; };
const figs = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
const n = +arg('n', 12), cell = +arg('cell', 480), at = arg('at', '');
if (!figs.length) { console.error('用法：node tools/isocheck.mjs <fig...> [--n 12] [--cell 480] [--at 2.5,4]'); process.exit(2); }
const out = resolve(ROOT, 'out/iso'); mkdirSync(out, { recursive: true });
let bad = false;
for (const id of figs) {
  const { browser, page, errors } = await openFilm('fig=' + id, { html: resolve(ROOT, 'iso.html'), wait: '__ready' });
  const dur = await page.evaluate(() => window.__isoDur);
  if (!dur) { console.error('找不到图 ' + id); await browser.close(); process.exit(2); }
  if (at) for (const t of at.split(',').map(Number)) {
    const url = await page.evaluate(tt => __isoAt(tt), t); const f = resolve(out, `${id}-${t}.png`); writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', f);
  } else {
    const url = await page.evaluate(({ n, cell, dur }) => {
      const cols = 4, rows = Math.ceil(n / cols), ch = Math.round(cell * 9 / 16), pad = 22, sheet = document.createElement('canvas');
      sheet.width = cols * cell; sheet.height = rows * (ch + pad); const g = sheet.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '14px monospace';
      for (let k = 0; k < n; k++) { const t = (dur - .02) * k / Math.max(1, n - 1); __isoAt(t);
        const x = (k % cols) * cell, y = Math.floor(k / cols) * (ch + pad); g.drawImage(document.getElementById('cv'), x, y, cell, ch); g.fillStyle = '#ddd'; g.fillText(t.toFixed(2) + 's', x + 4, y + ch + 16); }
      return sheet.toDataURL('image/jpeg', .9);
    }, { n, cell, dur });
    const f = resolve(out, `${id}.jpg`); writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', f);
  }
  await page.evaluate(() => __isoBench(8));   // 预热
  const b = await page.evaluate(() => __isoBench(40));
  console.log(`${id}: 图本身 ${b.fig.toFixed(2)} ms/帧，整帧（黑板 + 粉笔层 + 图）${b.frame.toFixed(2)} ms/帧（1080p）`);
  await browser.close();
  if (errors.length) { console.error(`${id} page errors:\n` + [...new Set(errors)].join('\n')); bad = true; }
}
process.exit(bad ? 1 : 0);
