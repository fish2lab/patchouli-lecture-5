'use strict';
// 第 5 段：还有一段路。安静的一段。
// 段首黑板中央一条短粉笔虚线（上一段留下的）→ 立起来变成分栏线：左「小鼠」右「人」。
// 左栏：小鼠 + 一串绿钩 → DNA 和开关「先改基因，装上开关」；右栏：人形轮廓 →「很难做到」→ 戴上护目镜、数出 1 2 3「一位患者 · 部分恢复视觉」。
// 第 4 句：两栏下方一条粉笔虚线的路，从「可被理解」通往「能被治愈」，只画了约 1/4，剩下是很淡的点。段末擦净，中央留一个点（下一段思维导图的中心）。
// 顶层名字带 S5 / s5 前缀。
const S5LINES = seq(1.0, [
  ['没那么简单。这些结果几乎都来自小鼠。', { mood: 'annoyed', hold: .3 }],
  ['光遗传要先改基因，给细胞装上开关，在人脑里很难做到。', { pause: .2, hold: .4 }],
  ['人身上最接近的一次，是一位失明多年的患者，戴上护目镜后，能数出桌上的东西。', { who: 'satori', pause: .3, hold: .5 }],
  ['能被理解，离能被治愈，还有一段路。', { pause: .4, hold: .6 }],
]);
const s5T = i => S5LINES[i][0], s5E = i => S5LINES[i][1];
const S5DUR = s5E(3) + 2.4;   // 关键句后静 1.2 秒以上，再擦黑板

// 版面（板坐标 = 屏幕坐标，镜头只在第 3 句轻推右栏）
const S5DIV = 950;                       // 分栏线 x
const S5MX = 670, S5MY = 300;            // 小鼠中心
const S5HX = 1080;                       // 人形中线
const S5ROAD = { x0: 728, x1: 1186, y: 690 };

// 小鼠（侧面，鼻尖朝右），相对中心的单位坐标
const S5MOUSE = spline([[-70, 14], [-60, -22], [-22, -40], [22, -34], [58, -16], [94, 6], [66, 20], [24, 34], [-28, 38], [-62, 30]], 5, true);
const S5TAIL = spline([[-68, 18], [-98, 26], [-118, 6], [-136, 14], [-152, -6]], 5);
const s5m = pts => pts.map(([u, v]) => [S5MX + u, S5MY + v]);
// 人形轮廓（头 + 肩 + 躯干）
const S5BODY = spline([[1006, 470], [1008, 344], [1030, 304], [1064, 288], [1096, 288], [1130, 304], [1152, 344], [1154, 470]], 6);
// 患者眼前的三个小方块
const S5BOX = [[1206, 384], [1270, 378], [1334, 386]];

function s5Draw(c, tau, L) {
  ckRoom(c, tau);
  const cam = ckCam(tau, [[0, CKB.cx, CKB.cy, 1], [s5T(2), CKB.cx, CKB.cy, 1], [s5T(2) + 1.6, CKB.cx + 50, CKB.cy - 20, 1.03],
    [s5E(2), CKB.cx + 50, CKB.cy - 20, 1.03], [s5T(3) + .2, CKB.cx, CKB.cy, 1]]);
  let pen = null, outro = null;
  const take = w => { if (w.writing) pen = w; };
  ckLayer(c, cam, lc => {
    // 段首：中央一条短虚线（0.6 秒后才出现）→ 第 1 句立起来变成分栏线
    const d0 = sm(.6, .95, tau), mv = sm(s5T(0) + .3, s5T(0) + 1.2, tau);
    const A = [lerp(900, S5DIV, mv), lerp(452, 112, mv)], B = [lerp(1020, S5DIV, mv), lerp(452, 560, mv)];
    ckLine(lc, [A, [lerp(A[0], B[0], .5), lerp(A[1], B[1], .5)], B], { color: 'muted', w: 4, dash: [16, 14], p: d0, seed: 5101 });

    // ---------- 第 1 句：左「小鼠」+ 一串钩；右「人」+ 人形 ----------
    const t1 = s5T(0);
    const wm = ckWrite(lc, tau, '小鼠', 725, 172, t1 + 1.0, { size: 56, align: 'center', spc: .14 }); take(wm);
    ckText(lc, '小鼠', 725, 172, { size: 56, align: 'center', p: wm.p });
    ckUnderline(lc, '小鼠', 725, 172, 56, 'muted', sm(t1 + 1.3, t1 + 1.6, tau), 5102, 'center');
    const pm = sm(t1 + 1.4, t1 + 2.3, tau);
    ckLine(lc, s5m(S5MOUSE), { w: 4.5, close: true, smooth: true, p: pm, seed: 5103 });
    ckLine(lc, s5m(circPts(44, -40, 15, 20)), { w: 4, close: true, p: sm(t1 + 2.0, t1 + 2.3, tau), seed: 5104 });   // 耳朵
    ckLine(lc, s5m(S5TAIL), { w: 4, smooth: true, p: sm(t1 + 2.1, t1 + 2.5, tau), seed: 5105 });
    ckLine(lc, s5m([[-32, 36], [-38, 52]]), { w: 4, p: sm(t1 + 2.2, t1 + 2.4, tau), seed: 5106 });
    ckLine(lc, s5m([[32, 30], [38, 48]]), { w: 4, p: sm(t1 + 2.2, t1 + 2.4, tau), seed: 5107 });
    for (const dy of [-6, 4]) ckLine(lc, s5m([[90, 4], [112, dy]]), { w: 2.6, color: 'muted', p: sm(t1 + 2.3, t1 + 2.5, tau), seed: 5108 + dy });   // 胡须
    if (pm >= 1) { lc.fillStyle = CK.ink; lc.beginPath(); lc.arc(S5MX + 66, S5MY - 6, 3.6, 0, TAU); lc.fill(); }
    // 一串绿钩：实验结果几乎都来自这里
    for (let k = 0; k < 6; k++) { const x = 572 + k * 56, y = 428, s = 34;
      ckLine(lc, [[x - s * .5, y], [x - s * .12, y + s * .38], [x + s * .55, y - s * .45]], { color: 'green', w: 5, p: sm(t1 + 2.4 + k * .16, t1 + 2.6 + k * .16, tau), seed: 5110 + k }); }
    const wh = ckWrite(lc, tau, '人', 1175, 172, t1 + 3.2, { size: 56, align: 'center', spc: .16 }); take(wh);
    ckText(lc, '人', 1175, 172, { size: 56, align: 'center', p: wh.p });
    ckUnderline(lc, '人', 1175, 172, 56, 'muted', sm(t1 + 3.4, t1 + 3.6, tau), 5120, 'center');
    ckLine(lc, circPts(S5HX, 236, 36, 28), { w: 4.5, close: true, p: sm(t1 + 3.5, t1 + 3.9, tau), seed: 5121 });
    ckLine(lc, S5BODY, { w: 4.5, smooth: true, p: sm(t1 + 3.8, t1 + 4.5, tau), seed: 5122 });

    // ---------- 第 2 句：左边 DNA + 开关「先改基因，装上开关」；右边「很难做到」 ----------
    const t2 = s5T(1);
    const pd = sm(t2 + .3, t2 + 1.1, tau), dx = 812, dy0 = 246, dh = 96;
    const strand = ph => Array.from({ length: 25 }, (_, i) => [dx + Math.sin(i / 24 * TAU * 1.25 + ph) * 15, dy0 + i / 24 * dh]);
    ckLine(lc, strand(0), { w: 3.6, smooth: true, p: pd, seed: 5130 });
    ckLine(lc, strand(Math.PI), { w: 3.6, smooth: true, p: pd, seed: 5131 });
    for (let k = 1; k < 6; k++) { const v = k / 6, y = dy0 + v * dh, s = Math.sin(v * TAU * 1.25) * 15;
      if (Math.abs(s) > 4) ckLine(lc, [[dx - s, y], [dx + s, y]], { color: 'muted', w: 2.6, p: sm(t2 + .8 + k * .06, t2 + 1 + k * .06, tau), seed: 5132 + k }); }
    // 开关：圆角框 + 拨杆（装上后拨一下）
    const px = 880, py = 294, ps = sm(t2 + 1.1, t2 + 1.6, tau);
    ckLine(lc, rectPts(px - 18, py - 32, 36, 64, 10), { color: 'blue', w: 4, close: true, p: ps, seed: 5140 });
    if (ps >= 1) { const fl = sm(t2 + 1.9, t2 + 2.2, tau, easeOutBack), ly = lerp(py + 12, py - 12, fl);
      ckLine(lc, [[px, py], [px, ly]], { color: 'blue', w: 4, seed: 5141 });
      lc.fillStyle = CK.blue; lc.beginPath(); lc.arc(px, ly, 7, 0, TAU); lc.fill(); }
    const s2a = '先改基因，装上开关', w2 = ckWrite(lc, tau, s2a, 562, 512, t2 + .6, { size: 38, spc: .1 }); take(w2);
    ckText(lc, s2a, 562, 512, { size: 38, color: 'muted', p: w2.p });
    const th = s5E(1) - 1.9, w3 = ckWrite(lc, tau, '很难做到', 1182, 300, th, { size: 44, spc: .13 }); take(w3);
    ckText(lc, '很难做到', 1182, 300, { size: 44, color: 'pink', p: w3.p });

    // ---------- 第 3 句：一位患者，戴上护目镜，数出 1 2 3 ----------
    const t3 = s5T(2), pg = sm(t3 + 1.0, t3 + 1.7, tau);
    ckLine(lc, rectPts(S5HX - 34, 220, 68, 24, 9), { w: 4, close: true, p: pg, seed: 5150 });   // 护目镜：一片宽镜面
    ckLine(lc, [[S5HX, 222], [S5HX, 242]], { w: 3, p: pg, seed: 5151 });
    ckLine(lc, [[S5HX - 34, 230], [S5HX - 37, 238]], { w: 3.6, p: pg, seed: 5153 });   // 绑带
    ckLine(lc, [[S5HX + 34, 230], [S5HX + 37, 238]], { w: 3.6, p: pg, seed: 5154 });
    // 眼前的小方块（桌上的东西），逐个画圈计数
    S5BOX.forEach(([bx, by], k) => {
      ckShape(lc, rectPts(bx - 15, by - 15, 30, 30, 3), { w: 4, p: sm(t3 + 2.0 + k * .2, t3 + 2.4 + k * .2, tau), seed: 5160 + k });
      const tr = s5E(2) - 2.6 + k * .55;
      ckLine(lc, ellPts(bx, by, 23, 23, 24, -1.2).concat([[bx + 9, by - 23]]), { color: 'yellow', w: 4, smooth: true, p: sm(tr, tr + .35, tau), seed: 5165 + k });
      ckText(lc, String(k + 1), bx, by + 62, { size: 34, color: 'yellow', align: 'center', p: sm(tr + .25, tr + .4, tau) });
    });
    const s3a = '一位患者 · 部分恢复视觉', w4 = ckWrite(lc, tau, s3a, 992, 530, s5E(2) - .6, { size: 34, spc: .08 }); take(w4);
    ckText(lc, s3a, 992, 530, { size: 34, color: 'muted', p: w4.p });

    // ---------- 第 4 句：一条只画了一小段的路 ----------
    const t4 = s5T(3), R = S5ROAD, ry = x => R.y + Math.sin((x - R.x0) / 70) * 5;
    const wa = ckWrite(lc, tau, '可被理解', 520, R.y + 16, t4 + .2, { size: 46, spc: .12 }); take(wa);
    ckText(lc, '可被理解', 520, R.y + 16, { size: 46, color: 'yellow', p: wa.p });
    const pr = sm(t4 + .9, t4 + 1.9, tau, easeOut), xe = lerp(R.x0, R.x0 + (R.x1 - R.x0) * .25, pr);
    if (pr > 0) { const pts = []; for (let x = R.x0; x <= xe; x += 6) pts.push([x, ry(x)]);
      if (pts.length > 1) ckLine(lc, pts, { w: 5, dash: [18, 13], seed: 5170 });
      if (pr < 1) pen = { head: [xe, ry(xe)] }; }
    // 剩下的路：很淡的点
    const pf = sm(t4 + 1.7, t4 + 2.4, tau);
    if (pf > 0) { lc.fillStyle = CK.muted;
      for (let x = R.x0 + (R.x1 - R.x0) * .25 + 22; x < R.x1; x += 24) { lc.globalAlpha = .28 * pf; lc.beginPath(); lc.arc(x, ry(x), 2.6, 0, TAU); lc.fill(); }
      lc.globalAlpha = 1; }
    const wb = ckWrite(lc, tau, '能被治愈', 1204, R.y + 16, t4 + 2.0, { size: 46, spc: .12 }); take(wb);
    ckText(lc, '能被治愈', 1204, R.y + 16, { size: 46, color: 'muted', p: wb.p });

    // 段末：擦净，中央留一个点（下一段思维导图的中心）
    outro = ogOutro(lc, tau, S5DUR, cam);
    if (tau > S5DUR - .5) { lc.fillStyle = CK.ink; lc.globalAlpha = sm(S5DUR - .5, S5DUR - .2, tau); lc.beginPath(); lc.arc(CKB.cx, CKB.cy, 7, 0, TAU); lc.fill(); lc.globalAlpha = 1; }
  });
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau); ckDust(c, sp, tau, true, 5180); }
  ogEraser(c, cam, outro);
  // 人物：帕秋莉讲，觉在第 3 句指向右栏
  const satTalk = tau > s5T(2) - .2 && tau < s5E(2) + .3;
  ogPch(c, tau, L, { pose: tau > s5T(3) + .6 && tau < s5T(3) + 2.6 ? 'point' : 'lecture', gesture: .5 });
  ogSat(c, tau, L, { pose: satTalk ? 'point' : 'stand', gesture: .7, eyeLook: [-.6, .2] });
}
scene({ order: 5, key: 'limit', title: '还有一段路', dur: S5DUR, lines: S5LINES, fn: s5Draw });
