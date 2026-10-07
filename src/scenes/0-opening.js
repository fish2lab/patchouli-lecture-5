'use strict';
// 第 0 段：开场。琪露诺问诺贝尔奖是不是发给了会读心的人；古明地觉登场：读得出难过，读不出为什么。
// 帕秋莉接过「为什么」，黑板上用粉笔点出一颗大脑（约 860 亿个神经元），点与点之间跑起信号。段末板擦擦净，只留一个点（下一段长成绿藻）。
// 样板段：本集的画风、节奏、站位以这一段为准。顶层名字带 S0 / s0 前缀。
const S0LINES = seq(1.0, [
  ['帕秋莉！今年的诺贝尔奖，是不是发给会读心的人了？', { who: 'cirno', mood: 'proud' }],
  ['发给了一把开关。', { mood: 'annoyed', pause: .2, hold: .3 }],
  ['会读心的是我。古明地觉，地灵殿的主人。', { who: 'satori', pause: .3 }],
  ['可我只读得出一个人在难过，读不出他为什么难过。', { who: 'satori', mood: 'sad', pause: .2, hold: .8 }],
  ['今天就讲这个为什么。人脑里大约有八百六十亿个神经元。', { pause: .3, hold: .4 }],
  ['记忆、情感，整个精神世界，都靠它们之间的电信号和化学信号传递。', { pause: .2, hold: 1.2 }],
]);
const s0T = i => S0LINES[i][0], s0E = i => S0LINES[i][1];
const S0DUR = s0E(5) + 1.6;

// 大脑轮廓（侧面，额叶朝左），以 (0,0) 为中心、宽约 2 的单位坐标
const S0BRAIN = spline([[-1, .05], [-.95, -.35], [-.7, -.62], [-.3, -.78], [.15, -.76], [.55, -.6], [.86, -.3], [.98, .02], [.9, .26], [.68, .36], [.55, .52], [.3, .58], [.1, .46], [-.15, .5], [-.5, .44], [-.82, .3]], 4, true);
const S0BC = [905, 640], S0BS = 265;   // 中心、缩放（板坐标）
const s0bp = ([u, v]) => [S0BC[0] + u * S0BS, S0BC[1] + v * S0BS];
function s0Inside(pts, x, y) { let n = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) n = !n; } return n; }
// 神经元点（载入时算一次的常量，确定性）
const S0DOTS = (() => { const r = rng(4001), out = []; let guard = 0;
  while (out.length < 420 && guard++ < 6000) { const u = r() * 2 - 1, v = r() * 1.4 - .8; if (!s0Inside(S0BRAIN, u, v)) continue;
    const p = s0bp([u, v]); if (out.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 13)) continue; out.push([p[0], p[1], r()]); }
  return out; })();
// 每个点连最近的两个点
const S0LINKS = (() => { const out = [];
  S0DOTS.forEach((p, i) => { const near = S0DOTS.map((q, j) => [j, Math.hypot(q[0] - p[0], q[1] - p[1])]).filter(a => a[0] !== i).sort((a, b) => a[1] - b[1]).slice(0, 2);
    for (const [j, d] of near) if (j > i && d < 60) out.push([i, j]); });
  return out; })();

function s0Draw(c, tau, L) {
  ckRoom(c, tau);
  const cam = ckCam(tau, [[0, CKB.cx, CKB.cy, 1], [s0T(4), CKB.cx, CKB.cy, 1], [s0T(4) + 2.2, CKB.cx + 10, CKB.cy + 40, 1.05], [S0DUR - 1.4, CKB.cx + 10, CKB.cy + 40, 1.05]]);
  let pen = null, outro = null;
  ckLayer(c, cam, lc => {
    // 左上：「2026 诺贝尔奖」→ 帕秋莉答「一把开关」
    const a = ckWrite(lc, tau, '2026 诺贝尔生理学或医学奖', 520, 150, s0T(0) + .4, { size: 46, spc: .06 });
    ckText(lc, '2026 诺贝尔生理学或医学奖', 520, 150, { size: 46, p: a.p });
    const b = ckWrite(lc, tau, '→ 一把开关', 560, 222, s0T(1) + .1, { size: 46, spc: .1 });
    ckText(lc, '→ 一把开关', 560, 222, { size: 46, color: 'yellow', p: b.p });
    // 右上：觉读心的两行
    const r1 = '读得出：难过', r2 = '读不出：为什么';
    const c1 = ckWrite(lc, tau, r1, 980, 300, s0T(3) + .5, { size: 50, spc: .1 }), c2 = ckWrite(lc, tau, r2, 980, 380, s0T(3) + 2.1, { size: 50, spc: .1 });
    ckText(lc, r1, 980, 300, { size: 50, color: 'muted', p: c1.p });
    ckText(lc, '读不出：', 980, 380, { size: 50, color: 'muted', p: clamp(c2.p * 7 / 4, 0, 1) });
    ckText(lc, '为什么', 980 + zhWidth(lc, '读不出：', 50), 380, { size: 50, color: 'pink', p: clamp(c2.p * 7 / 3 - 4 / 3, 0, 1) });
    // 帕秋莉接过「为什么」：黄圈圈住
    ckRing(lc, '为什么', 980 + zhWidth(lc, '读不出：', 50), 380, 50, 'yellow', sm(s0T(4) + .2, s0T(4) + 1, tau), 41);
    // 大脑：轮廓先画，点按 hash 次序在 2.6 秒内点满
    const tb = s0T(4) + 1.4;
    ckLine(lc, S0BRAIN.map(s0bp), { color: 'muted', w: 4, close: true, smooth: true, p: sm(tb - .6, tb + .6, tau), seed: 43 });
    ckLine(lc, [[-.05, -.76], [.02, -.5], [-.04, -.2], [.06, .05]].map(s0bp), { color: 'muted', w: 3, smooth: true, p: sm(tb + .3, tb + 1, tau), seed: 44 });   // 中央沟
    const shown = S0DOTS.filter(d => tau > tb + d[2] * 2.6);
    lc.fillStyle = CK.ink; for (const d of shown) { const s = 2.6 + (d[2] * 7 % 1) * 2; lc.fillRect(d[0] - s / 2, d[1] - s / 2, s, s); }
    // 数字
    const tn = s0T(4) + 2.4, n = Math.round(860 * sm(tn, tn + 1.6, tau, easeOut));
    if (tau > tn) { ckText(lc, `约 ${n} 亿`, 1200, 560, { size: 72, color: 'yellow', heavy: true }); ckText(lc, '个神经元', 1206, 620, { size: 40, color: 'muted' }); }
    // 第 6 句：点与点之间连线，信号沿线跑（蓝 = 电，黄 = 化学）
    const tl = s0T(5) + .3, lk = sm(tl, tl + 1.8, tau);
    if (lk > 0) {
      lc.save(); lc.strokeStyle = alpha(CK.muted, .45); lc.lineWidth = 1.4; lc.beginPath();
      S0LINKS.forEach(([i, j], k) => { if (hash(k, 45) > lk) return; const p = S0DOTS[i], q = S0DOTS[j]; lc.moveTo(p[0], p[1]); lc.lineTo(q[0], q[1]); }); lc.stroke(); lc.restore();
      S0LINKS.forEach(([i, j], k) => { if (k % 3 || hash(k, 45) > lk) return; const per = 1.1 + hash(k, 46) * 1.4, u = ((tau - tl) / per + hash(k, 47)) % 1, p = S0DOTS[i], q = S0DOTS[j];
        lc.fillStyle = k % 2 ? CK.blue : CK.yellow; lc.globalAlpha = Math.sin(u * Math.PI); lc.beginPath(); lc.arc(lerp(p[0], q[0], u), lerp(p[1], q[1], u), 3.6, 0, TAU); lc.fill(); lc.globalAlpha = 1; });
      const lab = ckWrite(lc, tau, '电信号 · 化学信号', 1200, 700, tl + .6, { size: 40, spc: .08 });
      ckText(lc, '电信号', 1200, 700, { size: 40, color: 'blue', p: clamp(lab.p * 9 / 3, 0, 1) });
      ckText(lc, ' · ', 1200 + zhWidth(lc, '电信号', 40), 700, { size: 40, color: 'muted', p: clamp(lab.p * 9 / 3 - 1, 0, 1) });
      ckText(lc, '化学信号', 1200 + zhWidth(lc, '电信号 · ', 40), 700, { size: 40, color: 'yellow', p: clamp(lab.p * 9 / 4 - 5 / 4, 0, 1) });
      if (lab.writing) pen = lab;
    }
    for (const w of [a, b, c1, c2]) if (w.writing) pen = w;
    // 段末：板擦擦净，只留下一个点（下一段从这个点长出绿藻）
    outro = ogOutro(lc, tau, S0DUR, cam);
    if (tau > S0DUR - .5) { lc.fillStyle = CK.ink; lc.globalAlpha = sm(S0DUR - .5, S0DUR - .2, tau); lc.beginPath(); lc.arc(CKB.cx, CKB.cy, 7, 0, TAU); lc.fill(); lc.globalAlpha = 1; }
  });
  // 粉笔头跟着正在写的字
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau); ckDust(c, sp, tau, true, 48); }
  ogEraser(c, cam, outro);
  // 人物
  const satReading = tau > s0T(2) && tau < s0E(3);
  ogPch(c, tau, L, { pose: tau > s0T(4) && tau < s0T(5) + 2 ? 'point' : 'lecture', gesture: .6 });
  ogSat(c, tau, L, { pose: satReading ? 'read' : 'stand', read: satReading ? sm(s0T(2), s0T(2) + .6, tau) : 0, eyeLook: [-.6, .3] });
  ogCirno(c, tau, L, S0LINES);
}
scene({ order: 0, key: 'opening', title: '开场', dur: S0DUR, lines: S0LINES, fn: s0Draw });
// 粉笔音效（src/lec/sfx.js）：[段内秒, 种类, 时长]。时间照上面 ckWrite 的 t0，时长 = 字数 × spc。
{ const tb = s0T(4) + 1.4, tn = s0T(4) + 2.4, tl = s0T(5) + .3;
  sfx('opening', [
    [s0T(0) + .4, 'chalk', 15 * .06],            // 2026 诺贝尔生理学或医学奖
    [s0T(1) + .1, 'chalk', 6 * .1],              // → 一把开关
    [s0T(3) + .5, 'chalk', 6 * .1],              // 读得出：难过
    [s0T(3) + 2.1, 'chalk', 7 * .1],             // 读不出：为什么
    [s0T(4), 'whoosh', 2.2],                     // 镜头推近
    [s0T(4) + .2, 'line', .8],                   // 黄圈圈住「为什么」
    [tb - .6, 'line', 1.2],                      // 大脑轮廓
    [tb + .3, 'line', .7],                       // 中央沟
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => [tb + .15 + k * .3, 'tap']),   // 点出神经元
    [tn, 'tap'], [tn + 1.6, 'tap'],              // 数字落定
    [tl, 'line', 1.8],                           // 点与点之间连线
    [tl + .6, 'chalk', 9 * .08],                 // 电信号 · 化学信号
    [S0DUR - 1.25, 'felt', 1.0],                 // 段末擦黑板（ogOutro）
  ]); }
