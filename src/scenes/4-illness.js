'use strict';
// 第 4 段：三种失稳。一块比一屏宽的黑板分三栏，镜头逐栏走：
//   一 · 阿尔茨海默 = isoPlug（插头差一点够到 → 蓝光照上去插进去 → 落回，圈出「取出的路」）
//   二 · 精神分裂   = isoPatch（线缆各摆各的 → 蓝光照上去同步摆动、变绿）
//   三 · 抑郁       = isoPhosphor（点阵熄灭 → 一道蓝光扫过重新点亮）
// 第 9 句琪露诺发问时镜头退远看三栏全貌，三栏上方各打一个粉色问号；段末擦净，只留一小段粉笔虚线（下一段「还有一段路」的起点）。
// 措辞照 docs/来源.md：每栏都标「小鼠实验」，不说治好、不说病因。顶层名字带 S4 / s4 前缀。
const S4LINES = seq(1.0, [
  ['那么，心灵的苦难呢？抑郁、精神分裂、阿尔茨海默病。', { pause: .2, hold: .8 }],
  ['它们是这套系统，在不同层面上的失稳。', { hold: 1.6 }],
  ['早期阿尔茨海默病模型的小鼠，像是忘了一件事。', { who: 'satori', pause: .3, hold: 2.8 }],
  ['用光重新点亮那段记忆留下的细胞，它又想起来了。', { pause: .2, hold: 1.8 }],
  ['有的记忆还在，坏掉的是取出它的路。', { who: 'satori', pause: .3, hold: 2.4 }],
  ['精神分裂患者的脑里，一种快节律常常对不齐。', { pause: 1.9, hold: 1.6 }],
  ['在小鼠身上驱动一类抑制性神经元，就能把这种节律带起来。', { pause: .2, hold: 2.2 }],
  ['慢性应激的小鼠，按节律点亮多巴胺神经元，类抑郁的行为就减轻了。', { who: 'satori', pause: 1.9, hold: 3.0 }],
  ['那是不是开个灯，病就好了？', { who: 'cirno', mood: 'confused', pause: 1.6, hold: 1.4 }],
]);
const s4T = i => S4LINES[i][0], s4E = i => S4LINES[i][1];
const S4DUR = s4E(8) + 2.0;

// 三栏（板坐标）：宽 640，栏距 1110——镜头停在一栏时，上一栏正好退到帕秋莉身后左侧，不和人物叠在一起；上方 y 80–290 是标题区（只在第一栏上面）
const S4COL = [0, 1, 2].map(i => ({ x0: 600 + i * 1110, y0: 300, w: 640, h: 550 }));
S4COL.forEach(k => { k.x1 = k.x0 + k.w; k.y1 = k.y0 + k.h; k.cx = k.x0 + k.w / 2; });
const S4BADGE = ['一 · 阿尔茨海默', '二 · 精神分裂', '三 · 抑郁'];
const S4CAM_ALL = [2030, 730, .455];   // 退远看全貌：三栏落在屏幕 x 310–1610、y 155–510（避开两人和琪露诺冒头的右下角）

// 抑郁栏的蓝光轨迹：从左到右蛇形扫过点阵（u 0..17，v 0..10），出发时刻相对扫光开始
const S4TRAIL_N = 40;
const s4Trail = t0 => Array.from({ length: S4TRAIL_N }, (_, k) => [k / (S4TRAIL_N - 1) * 17, 5 + 4.3 * Math.sin(k * .62), t0 + k * .055]);

// s4Beam：一束蓝光（粉笔画）：光源一小截光纤 + 三道射线扇形照到目标，目标周围几道短放射线。p 画出进度
function s4Beam(lc, from, to, p, seed = 1, spread = 34) {
  if (p <= 0) return;
  const [fx, fy] = from, [tx, ty] = to, dx = tx - fx, dy = ty - fy, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  ckLine(lc, [[fx - dx / L * 46, fy - dy / L * 46], [fx, fy]], { color: 'blue', w: 7, p: clamp(p * 3, 0, 1), seed });
  const pr = clamp(p * 1.6 - .25, 0, 1);
  for (let k = -1; k <= 1; k++) ckLine(lc, [[fx + nx * k * 4, fy + ny * k * 4], [lerp(fx, tx, .92) + nx * k * spread, lerp(fy, ty, .92) + ny * k * spread]], { color: 'blue', w: k ? 3 : 4, p: pr, seed: seed + 2 + k, dash: k ? [14, 10] : null });
  const pg = clamp(p * 3 - 2, 0, 1);
  if (pg > 0) for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + .3, r0 = 40, r1 = 40 + 18 * pg;
    ckLine(lc, [[tx + Math.cos(a) * r0, ty + Math.sin(a) * r0 * .7], [tx + Math.cos(a) * r1, ty + Math.sin(a) * r1 * .7]], { color: 'blue', w: 3.5, seed: seed + 10 + k }); }
}
// s4Mark：粉色小问号（写出 + 轻微落下）
function s4Mark(lc, x, y, k) {
  if (k <= 0) return;
  ckText(lc, '？', x, y - (1 - k) * 18, { size: 130, color: 'pink', heavy: true, align: 'center', p: clamp(k * 1.4, 0, 1) });
}

function s4Draw(c, tau, L) {
  ckRoom(c, tau);
  const [c1, c2, c3] = S4COL;
  const pan2 = s4T(5) - 1.6, pan3 = s4T(7) - 1.6, back = s4T(8) - 1.3;
  const cam = ckCam(tau, [
    [0, 940, 452, 1], [s4T(2) - .3, 940, 452, 1], [s4T(2) + 1.2, c1.cx, 470, 1.02], [pan2, c1.cx, 470, 1.02],
    [s4T(5), c2.cx, 545, 1], [pan3, c2.cx + 20, 545, 1.02], [s4T(7), c3.cx, 545, 1],
    [back, c3.cx, 545, 1], [s4T(8) + .5, ...S4CAM_ALL], [S4DUR, ...S4CAM_ALL],
  ]);
  const pens = [];
  const W_ = (text, x, y, t0, o = {}) => { const w = ckWrite(lc_, tau, text, x, y, t0, o); ckText(lc_, text, x, y, { ...o, p: w.p }); if (w.writing) pens.push(w); return w; };
  let lc_ = null, outro = null;
  ckLayer(c, cam, lc => {
    lc_ = lc;
    // ---------- 标题区（第 1、2 句） ----------
    W_('心灵的苦难', 572, 142, s4T(0) + .3, { size: 66, heavy: true, spc: .12 });
    const words = '抑郁 · 精神分裂 · 阿尔茨海默病';
    W_(words, 576, 210, s4T(0) + 2.1, { size: 44, color: 'pink', spc: .08 });
    const l2 = W_('同一套系统 · 不同层面的', 576, 272, s4T(1) + .3, { size: 42, spc: .08 });
    W_('失稳', 576 + zhWidth(lc, '同一套系统 · 不同层面的', 42), 272, s4T(1) + .3 + 12 * .08, { size: 42, color: 'pink', spc: .1 });
    ckUnderline(lc, '失稳', 576 + zhWidth(lc, '同一套系统 · 不同层面的', 42), 272, 42, 'pink', sm(s4T(1) + 1.8, s4T(1) + 2.3, tau), 403);
    // ---------- 三栏的粉笔边和徽章：第一栏在第 2 句，后两栏在镜头移过去时 ----------
    const tB = [s4T(1) + 1.6, pan2 + .7, pan3 + .7];
    S4COL.forEach((k, i) => {
      const pb = sm(tB[i], tB[i] + 1.1, tau, t => t);
      ckBorder(lc, k.x0, k.y0, k.w, k.h, CK_BORDERS[i], 'muted', pb, 410 + i * 7);
      ckBadge(lc, S4BADGE[i], k.x0 + 24, k.y0 + 22, CK_TONES[i], sm(tB[i] + .4, tB[i] + 1.4, tau, t => t), 420 + i * 7);
    });
    // 每栏右上角「小鼠实验」：念到小鼠时写上
    const tM = [s4T(2) + .6, s4T(6) + .4, s4T(7) + .5];
    S4COL.forEach((k, i) => W_('小鼠实验', k.x1 - 24 - zhWidth(lc, '小鼠实验', 30), k.y0 + 62, tM[i], { size: 30, color: 'muted', spc: .1 }));

    // ---------- 第一栏：阿尔茨海默 · isoPlug ----------
    {
      const t3 = s4T(2), t4 = s4T(3), t5 = s4T(4), a = t3 + 1.3;   // 插头画好后开始够
      const reach = key(tau, [[0, 0], [a, 0], [a + 1.0, .85], [a + 1.6, .85], [a + 2.2, 0], [a + 2.6, 0], [a + 3.5, .85], [a + 4.1, .85], [a + 4.7, 0],
        [t4 + 1.2, 0], [t4 + 2.4, 1], [t5 + .3, 1], [t5 + 1.1, .85]]);
      const lightOn = sm(t4 + .2, t4 + 1.2, tau, t => t) * (1 - sm(t5 + .1, t5 + .5, tau));
      const glow = sm(t4 + 2.3, t4 + 2.8, tau) * (1 - sm(t5 + .1, t5 + .5, tau));
      const PX = c1.x0 + 240, PY = c1.y0 + 360;
      // 蓝光（在插头前面画，插头的擦底会挡住射线尾端）
      s4Beam(lc, [c1.x1 - 80, c1.y0 + 170], [PX + 10, PY + 20], lightOn, 440, 30);
      const pl = isoPlug(lc, { x: PX, y: PY, s: 330, reach, p: sm(t3, t3 + 1.2, tau, t => t), glow });
      // 第 3 句：早期模型小鼠
      W_('早期模型小鼠', c1.x0 + 40, c1.y0 + 150, t3 + .5, { size: 36, color: 'muted', spc: .09 });
      // 第 4 句：记忆回来了
      W_('记忆回来了', c1.x0 + 40, c1.y1 - 40, t4 + 2.3, { size: 46, color: 'green', spc: .11 });
      // 第 5 句：电线上「记忆 ✓」；插头与插座之间「取出的路」，粉圈圈出
      const cordX = PX + 215, cordY = PY + 30;
      W_('记忆 ✓', cordX, cordY - 34, t5 + .5, { size: 38, color: 'ink', spc: .12 });
      const mid = [(pl.plug[0] + pl.socket[0]) / 2, (pl.plug[1] + pl.socket[1]) / 2];
      if (tau > t5 + 1.1) {
        const rx = c1.x0 + 350, ry = c1.y1 - 40;
        W_('取出的路', rx, ry, t5 + 1.3, { size: 38, color: 'pink', spc: .1 });
        ckRing(lc, '取出的路', rx, ry, 38, 'pink', sm(t5 + 1.9, t5 + 2.5, tau), 447);
        ckArrow(lc, [rx + 20, ry - 50], [mid[0] + 8, mid[1] + 14], { color: 'pink', w: 4, p: sm(t5 + 2.3, t5 + 2.7, tau), head: 14, seed: 448, bend: -20 });
      }
    }

    // ---------- 第二栏：精神分裂 · isoPatch ----------
    {
      const t6 = s4T(5), t7 = s4T(6);
      const sync = sm(t7 + 1.2, t7 + 3.6, tau);
      const light = sm(t7 + .4, t7 + 1.3, tau, t => t);
      const QX = c2.cx + 10, QY = c2.y0 + 290;
      const pp = isoPatch(lc, { x: QX, y: QY, s: 500, tau, sync, p: sm(t6 + .2, t6 + 1.8, tau, t => t) });
      s4Beam(lc, [c2.x1 - 70, c2.y0 + 130], [pp.panel[0] + 60, pp.panel[1] - 10], light, 460, 40);
      W_('快节律对不齐', c2.x0 + 40, c2.y1 - 86, t6 + 1.4, { size: 46, color: 'pink', spc: .1 });
      W_('驱动一类抑制性神经元', c2.x0 + 40, c2.y1 - 34, t7 + 1.0, { size: 38, color: 'muted', spc: .09 });
    }

    // ---------- 第三栏：抑郁 · isoPhosphor ----------
    {
      const t8 = s4T(7), ts = t8 + 3.0, sweepEnd = ts + S4TRAIL_N * .055;
      const lit = key(tau, [[0, 1], [t8 + 1.4, 1], [t8 + 2.8, .15], [ts + .6, .15], [sweepEnd + .4, 1]]);
      const FX = c3.cx, FY = c3.y0 + 275;
      const ph = isoPhosphor(lc, { x: FX, y: FY, s: 540, tau, lit, trail: s4Trail(ts), decay: 1.4, p: sm(t8 - .4, t8 + 1.2, tau, t => t) });
      // 扫光的光头：蓝点 + 从左上来的一道光
      if (tau > ts - .3 && tau < sweepEnd + .3) {
        const u = clamp((tau - ts) / (S4TRAIL_N * .055), 0, 1), k = u * (S4TRAIL_N - 1), hd = ph.at(k / (S4TRAIL_N - 1) * 17, 5 + 4.3 * Math.sin(k * .62));
        const al = sm(ts - .3, ts, tau) * (1 - sm(sweepEnd, sweepEnd + .3, tau));
        lc.globalAlpha = al; ckLine(lc, [[c3.x0 + 120, c3.y0 + 120], hd], { color: 'blue', w: 4, seed: 471, dash: [16, 10] });
        lc.fillStyle = CK.blue; lc.beginPath(); lc.arc(hd[0], hd[1], 9, 0, TAU); lc.fill(); lc.globalAlpha = 1;
      }
      const s1 = '慢性应激小鼠', s2 = '类抑郁行为减轻';
      W_(s1, c3.x0 + 40, c3.y1 - 86, t8 + .6, { size: 38, color: 'muted', spc: .09 });
      W_(s2, c3.x0 + 40, c3.y1 - 34, sweepEnd + .2, { size: 44, color: 'green', spc: .1 });
    }

    // ---------- 第 9 句：三栏上方各一个粉色问号 ----------
    S4COL.forEach((k, i) => s4Mark(lc, k.x1 + 28, k.y0 + 8, sm(s4T(8) + .6 + i * .35, s4T(8) + 1.1 + i * .35, tau, easeOutBack)));

    // ---------- 段末：擦净，只留一小段粉笔虚线（z=0.455 时 ogOutro 按镜头算的擦除框已盖住三栏和标题区） ----------
    outro = ogOutro(lc, tau, S4DUR, cam);
    if (tau > S4DUR - .55) {
      const k = sm(S4DUR - .55, S4DUR - .25, tau, t => t);
      const z = S4CAM_ALL[2], y = S4CAM_ALL[1] + 60 / z;   // 屏幕上约 240 px 长、线宽 6 px
      ckLine(lc, [[S4CAM_ALL[0] - 120 / z, y], [S4CAM_ALL[0] + 120 / z, y]], { color: 'ink', w: 6 / z, dash: [26 / z, 20 / z], p: k, seed: 490 });
    }
  });
  // 粉笔头跟着最后一个正在写的字
  const pen = pens.at(-1);
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau); ckDust(c, sp, tau, true, 49); }
  ogEraser(c, cam, outro);
  // 人物：镜头退远时两人往两边让一步（避开三栏全貌）
  const side = sm(s4T(8) - 1.1, s4T(8) + .3, tau) * (1 - sm(S4DUR - 1.2, S4DUR - .3, tau)), bob = Math.sin(side * Math.PI) * 10;
  const pPoint = (tau > s4T(3) && tau < s4T(3) + 2.6) || (tau > s4T(6) && tau < s4T(6) + 2.4) || (tau > s4T(1) + 1.4 && tau < s4T(1) + 3.2);
  ogPch(c, tau, L, { x: OG.pch.x - 130 * side, y: OG.pch.y - bob, pose: pPoint ? 'point' : 'lecture', gesture: .6 });
  const satRead = (tau > s4T(2) && tau < s4E(2) - 1.5) || (tau > s4T(7) && tau < s4E(7) - 1.6);
  const satPoint = tau > s4T(4) + 1.1 && tau < s4E(4);
  ogSat(c, tau, L, { x: OG.sat.x + 110 * side, y: OG.sat.y - bob, pose: satRead ? 'read' : satPoint ? 'point' : 'stand', gesture: .5,
    read: satRead ? sm(s4T(2), s4T(2) + .6, tau) * (tau < s4E(2) ? 1 : 0) + (tau > s4T(7) ? sm(s4T(7), s4T(7) + .6, tau) : 0) : 0, eyeLook: [-.6, .2] });
  ogCirno(c, tau, L, S4LINES);
}
scene({ order: 4, key: 'illness', title: '三种失稳', dur: S4DUR, lines: S4LINES, fn: s4Draw });
