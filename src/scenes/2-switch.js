'use strict';
// 第 2 段：把开关装进神经元。上一段留下的通道小图标镶到一个粉笔神经元的胞体膜上；蓝光一照，放电脉冲沿轴突跑过去，光灭就安静。
// 镜头右移到第二块板：「光遗传学」+ 诺奖徽章，旁边 isoTerrain 被光点扫过、柱子升起；「脑区 ？ 行为」的问号被板擦擦掉，改写成箭头。
// 段末擦净，视野中央留一个电灯开关拨杆小图标（下一段的起点）。顶层名字带 S2 / s2 前缀。
//
// 板坐标布局：第一块板 cam.x = 960（神经元，x 520–1360）；第二块板 cam.x = 2300（字 x 1860–2350，isoTerrain 中心 2480；镜头移过去后神经元整个出画）。
const S2LINES = seq(1.0, [
  ['二零零五年，戴瑟罗斯团队把这个通道装进了神经元。', { pause: .2, hold: .4 }],
  ['蓝光一照，神经元就放电；光一灭，它就安静。快到毫秒。', { pause: .2, hold: 1.2 }],
  ['这套方法叫光遗传学。今年的诺贝尔奖，就发给了它。', { who: 'satori', pause: .3, hold: .8 }],
  ['可是看脑子，不是早就能看了吗？', { who: 'cirno', mood: 'confused', pause: .2 }],
  ['以前只能看到，某个脑区和某种行为一起出现，说不清谁导致了谁。', { pause: .2, hold: .6 }],
  ['现在能拨开关。拨一下，看行为变不变。', { mood: 'smug', pause: .2, hold: 1.2 }],
  ['从一起出现，到谁导致谁。', { who: 'satori', pause: .3, hold: .9 }],
]);
const s2T = i => S2LINES[i][0], s2E = i => S2LINES[i][1];
const S2DUR = s2E(6) + 1.6;
const S2CX2 = 2300;   // 第二块板的镜头中心 x

// ===================== 神经元（第一块板） =====================
const S2SOMA = [690, 486], S2SR = 58;
const S2CH = [S2SOMA[0], S2SOMA[1] - S2SR];   // 通道镶在胞体膜顶上
const S2SOMAPTS = ellPts(S2SOMA[0], S2SOMA[1], S2SR, S2SR * .94, 40, .2);
// 树突：主干 + 分叉（向左、左上、左下、正下）
const S2DEND = [
  [[640, 456], [600, 420], [566, 372]], [[600, 420], [556, 424]], [[566, 372], [548, 330]], [[566, 372], [592, 330]],
  [[636, 500], [590, 530], [546, 548]], [[590, 530], [572, 584]],
  [[676, 542], [668, 604], [642, 652]], [[668, 604], [700, 650]],
  [[650, 446], [632, 398], [640, 350]],
];
// 轴突：胞体右侧伸出、略起伏，末端三分叉
const S2AXON = spline([[746, 490], [860, 478], [980, 498], [1100, 476], [1220, 492], [1268, 488]], 5);
const S2TERM = [[[1268, 488], [1314, 446], [1350, 430]], [[1268, 488], [1324, 490], [1360, 498]], [[1268, 488], [1310, 534], [1340, 556]]];
const S2AXL = pathLen(S2AXON);
// s2At：轴突上弧长比例 u 处的点；s2Sub：u0..u1 那一截折线
function s2At(u) { let d = clamp(u, 0, 1) * S2AXL; for (let i = 1; i < S2AXON.length; i++) { const a = S2AXON[i - 1], b = S2AXON[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= l) return [lerp(a[0], b[0], d / l), lerp(a[1], b[1], d / l)]; d -= l; } return S2AXON.at(-1).slice(); }
function s2Sub(u0, u1) { const out = [s2At(u0)]; let acc = 0; for (let i = 1; i < S2AXON.length; i++) { acc += Math.hypot(S2AXON[i][0] - S2AXON[i - 1][0], S2AXON[i][1] - S2AXON[i - 1][1]); const u = acc / S2AXL; if (u > u0 && u < u1) out.push(S2AXON[i]); } out.push(s2At(u1)); return out; }

// 通道小图标：两片门（竖直的圆角板），open 0..1 时两片门绕下端向外张开；s 是整体高度
function s2Channel(lc, x, y, s, open = 0, al = 1) {
  if (al <= 0) return;
  const dw = s * .3, gap = s * .07 + open * s * .12, a = open * .32;
  lc.save(); lc.globalCompositeOperation = 'destination-out'; lc.fillStyle = '#000'; lc.globalAlpha = al;
  lc.fillRect(x - gap - dw - 6, y - s / 2 - 4, 2 * (gap + dw) + 12, s + 8); lc.restore();
  for (const side of [-1, 1]) {
    lc.save(); lc.translate(x + side * (gap + dw / 2), y + s / 2); lc.rotate(side * a);
    ckShape(lc, rectPts(-dw / 2, -s, dw, s, dw * .35), { color: 'ink', w: 4, hatch: 'muted', gap: 9, seed: 2010 + side, al });
    lc.restore();
  }
}
// 电灯开关小图标（段末留给下一段）：圆角面板 + 中间一根向上拨的拨杆
function s2Toggle(lc, x, y, al) {
  if (al <= 0) return;
  ckShape(lc, rectPts(x - 30, y - 46, 60, 92, 10), { color: 'ink', w: 4, seed: 2061, al });
  ckShape(lc, rectPts(x - 9, y - 22, 18, 44, 6), { color: 'ink', w: 3, seed: 2062, al });
  ckLine(lc, [[x, y - 4], [x + 3, y - 34]], { color: 'yellow', w: 7, seed: 2063, al });
  lc.save(); lc.globalAlpha = al; lc.fillStyle = CK.yellow; lc.beginPath(); lc.arc(x + 3, y - 36, 6, 0, TAU); lc.fill(); lc.restore();
}

// 第 2 句：三次「亮—跑—灭」。返回第 k 次的起点
const s2Pulse = k => s2T(1) + .3 + k * 1.45;
// 光照强度（0..1）和通道开度：每次亮 0.75 秒
function s2Light(tau) { let v = 0; for (let k = 0; k < 3; k++) { const t0 = s2Pulse(k); v = Math.max(v, win(t0, t0 + .75, tau, .12)); } return v; }

// isoTerrain 的光点：第 3 句开始扫，第 6 句停住（时间变慢到停，闭式）
const s2Sweep = tau => { const t0 = s2T(2) + 2.2, tf = s2T(5) + .4, d = .5; const te = tau < tf ? tau : tf + d * (1 - Math.exp(-(tau - tf) / d)), s = Math.max(0, te - t0);
  return [4 + 2.4 * Math.sin(s * .9), 4 + 2.4 * Math.sin(s * 1.27 + 1.1)]; };

function s2Draw(c, tau, L) {
  ckRoom(c, tau);
  const tp = s2T(2) - .2;
  const cam = ckCam(tau, [[0, CKB.cx, CKB.cy, 1], [tp, CKB.cx, CKB.cy, 1], [tp + 1.6, S2CX2, CKB.cy, 1], [S2DUR, S2CX2, CKB.cy, 1]]);
  let pen = null, outro = null, erasePos = null;
  ckLayer(c, cam, lc => {
    // ---------- 第 1 句：通道从板中央移到胞体膜上，神经元画出来 ----------
    const t0 = s2T(0), mv = sm(t0 + .2, t0 + 1.4, tau);
    const tn = t0 + 1.0;
    ckLine(lc, S2SOMAPTS, { color: 'ink', w: 5, close: true, smooth: true, p: sm(tn, tn + .7, tau), seed: 2020 });
    S2DEND.forEach((d, k) => ckLine(lc, d, { color: 'ink', w: k % 2 ? 3 : 4, smooth: d.length > 2, p: sm(tn + .5 + k * .08, tn + 1.1 + k * .08, tau), seed: 2021 + k }));
    ckLine(lc, S2AXON, { color: 'ink', w: 5, p: sm(tn + 1.1, tn + 2.3, tau), seed: 2032 });
    S2TERM.forEach((d, k) => ckLine(lc, d, { color: 'ink', w: 4, smooth: true, p: sm(tn + 2.2 + k * .1, tn + 2.7 + k * .1, tau), seed: 2033 + k }));
    // 胞体核
    ckLine(lc, ellPts(S2SOMA[0] - 6, S2SOMA[1] + 8, 15, 13, 20), { color: 'muted', w: 3, close: true, smooth: true, p: sm(tn + .6, tn + 1, tau), seed: 2036 });
    const w05 = ckWrite(lc, tau, '2005', 530, 160, t0 + .4, { size: 60, spc: .12 });
    ckText(lc, '2005', 530, 160, { size: 60, color: 'muted', p: w05.p });
    if (w05.writing) pen = w05;

    // ---------- 第 2 句：蓝光照胞体 → 通道开 → 脉冲沿轴突跑 ----------
    const li = s2Light(tau);
    if (li > 0) {
      const ap = [812, 96], ca = [S2CH[0] - 34, S2CH[1] - 10], cb = [S2CH[0] + 34, S2CH[1] - 10];
      ckShape(lc, [ap, cb, ca], { color: 'blue', w: 4, hatch: 'blue', gap: 15, angle: -1.25, seed: 2040, al: li });
      ckLine(lc, [[ap[0] - 22, ap[1] - 8], [ap[0] + 22, ap[1] + 8]], { color: 'blue', w: 6, seed: 2041, al: li });
      // 胞体被照亮的一圈
      ckLine(lc, S2SOMAPTS, { color: 'blue', w: 3, close: true, smooth: true, seed: 2042, al: li * .6 });
    }
    for (let k = 0; k < 3; k++) {
      const ts = s2Pulse(k) + .22, u = (tau - ts) / .75;
      if (u > -.05 && u < 1.25) {
        const h = clamp(u, 0, 1), tail = clamp(u - .16, 0, 1);
        if (h > tail) ckLine(lc, s2Sub(tail, h), { color: 'yellow', w: 8, seed: 2044 + k });
        if (u >= 0 && u <= 1) { const q = s2At(h); lc.save(); lc.fillStyle = CK.yellow; lc.beginPath(); lc.arc(q[0], q[1], 9, 0, TAU); lc.fill(); lc.restore(); }
        // 到末端：三个分叉亮一下
        const ft = win(ts + .72, ts + 1.05, tau, .1);
        if (ft > 0) S2TERM.forEach((d, j) => ckLine(lc, d, { color: 'yellow', w: 5, smooth: true, seed: 2033 + j, al: ft }));
      }
    }
    // 通道：先在板中央（上一段留下的），再移到胞体顶上；光一照就开
    const chOpen = li;
    s2Channel(lc, lerp(CKB.cx, S2CH[0], easeIO(mv)), lerp(CKB.cy, S2CH[1], easeIO(mv)), lerp(60, 50, mv), chOpen);
    // 开门时几颗离子落进胞体
    if (chOpen > .3) for (let k = 0; k < 4; k++) { const u = ((tau * 1.6 + k / 4) % 1); lc.save(); lc.globalAlpha = chOpen * Math.sin(u * Math.PI); lc.fillStyle = CK.yellow; lc.beginPath(); lc.arc(S2CH[0] + (k - 1.5) * 5, S2CH[1] - 26 + u * 64, 3.6, 0, TAU); lc.fill(); lc.restore(); }
    const wms = ckWrite(lc, tau, '毫秒', 1040, 370, s2T(1) + 3.9, { size: 60, spc: .14 });
    ckText(lc, '毫秒', 1040, 370, { size: 60, color: 'yellow', p: wms.p });
    if (wms.writing) pen = wms;

    // ---------- 第 3 句：第二块板，「光遗传学」+ 诺奖徽章 + isoTerrain ----------
    const t2 = s2T(2);
    const wgt = ckWrite(lc, tau, '光遗传学', 1860, 196, t2 + 1.1, { size: 100, spc: .2 });
    ckText(lc, '光遗传学', 1860, 196, { size: 100, color: 'yellow', heavy: true, p: wgt.p });
    ckUnderline(lc, '光遗传学', 1860, 196, 100, 'yellow', sm(t2 + 2, t2 + 2.5, tau), 2050);
    if (wgt.writing) pen = wgt;
    ckBadge(lc, '2026 诺贝尔奖', 1866, 262, 'yellow', sm(t2 + 3.0, t2 + 4.0, tau), 2051);
    const tt = t2 + 1.4;
    const level = lerp(1.35 * sm(t2 + 2.6, t2 + 3.4, tau), 1.9, sm(s2T(5) + .4, s2T(5) + 1.2, tau));   // 拉满：超过 1 让光斑里成片柱子过半高（iso 里高度封顶 1.25 HMAX）
    isoTerrain(lc, { x: 2480, y: 396, s: 540, light: s2Sweep(tau), r: 3.1, level, p: sm(tt, tt + 2.2, tau, t => t), beam: true });

    // ---------- 第 5 句：「脑区  ？  行为」 ----------
    const t4 = s2T(4), sz = 64, ry = 580, xa = 1860, xq = xa + zhWidth(lc, '脑区', sz) + 70, xb = xq + zhWidth(lc, '？', sz) + 70;
    const wa = ckWrite(lc, tau, '脑区', xa, ry, t4 + 1.0, { size: sz, spc: .14 }), wb = ckWrite(lc, tau, '行为', xb, ry, t4 + 1.9, { size: sz, spc: .14 }), wq = ckWrite(lc, tau, '？', xq, ry, t4 + 3.2, { size: sz, spc: .2 });
    ckText(lc, '脑区', xa, ry, { size: sz, p: wa.p }); ckText(lc, '行为', xb, ry, { size: sz, p: wb.p });
    ckText(lc, '？', xq, ry, { size: sz, color: 'pink', heavy: true, p: wq.p });
    for (const w of [wa, wb, wq]) if (w.writing) pen = w;
    // 第 6 句：板擦擦掉问号，写一个黄色箭头
    const t5 = s2T(5);
    erasePos = ckErase(lc, [xq - 8, ry - sz * .95, zhWidth(lc, '？', sz) + 16, sz * 1.25], sm(t5 + .3, t5 + 1.1, tau, t => t));
    const ax0 = xa + zhWidth(lc, '脑区', sz) + 18, ax1 = xb - 18, ay = ry - sz * .35;
    ckArrow(lc, [ax0, ay], [ax1, ay], { color: 'yellow', w: 6, p: sm(t5 + 1.3, t5 + 1.9, tau), head: 22, seed: 2055 });

    // ---------- 第 7 句：「一起出现  →  谁导致谁」 ----------
    const t6 = s2T(6), s6 = 50, y6 = 720, xc = 1860, xd = xc + zhWidth(lc, '一起出现', s6) + 130;
    const wc = ckWrite(lc, tau, '一起出现', xc, y6, t6 + .3, { size: s6, spc: .11 }), wd = ckWrite(lc, tau, '谁导致谁', xd, y6, t6 + 1.3, { size: s6, spc: .11 });
    ckText(lc, '一起出现', xc, y6, { size: s6, color: 'muted', p: wc.p });
    ckArrow(lc, [xd - 100, y6 - 18], [xd - 44, y6 - 18], { color: 'muted', w: 4, p: sm(t6 + 1.0, t6 + 1.3, tau), head: 14, seed: 2057 });
    ckText(lc, '谁导致谁', xd, y6, { size: s6, color: 'yellow', p: wd.p });
    ckRing(lc, '谁导致谁', xd, y6, s6, 'yellow', sm(t6 + 2.0, t6 + 2.6, tau), 2058);
    for (const w of [wc, wd]) if (w.writing) pen = w;

    // ---------- 段末：擦净，视野中央留一个电灯开关 ----------
    outro = ogOutro(lc, tau, S2DUR, cam);
    s2Toggle(lc, cam.x, cam.y, sm(S2DUR - .5, S2DUR - .2, tau));
  });
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau); ckDust(c, sp, tau, true, 2059); }
  ogEraser(c, cam, erasePos);
  ogEraser(c, cam, outro);
  // 人物
  const pchPoint = (tau > s2T(1) && tau < s2E(1)) || (tau > s2T(5) && tau < s2E(5));
  const satPoint = tau > s2T(2) && tau < s2E(2), satRead = tau > s2T(6) - .2 && tau < s2E(6) + .3;
  ogPch(c, tau, L, { pose: pchPoint ? 'point' : 'lecture', gesture: .6 });
  ogSat(c, tau, L, { pose: satRead ? 'read' : satPoint ? 'point' : 'stand', gesture: .5, read: satRead ? sm(s2T(6) - .2, s2T(6) + .4, tau) : 0, eyeLook: [-.6, .2] });
  ogCirno(c, tau, L, S2LINES);
}
scene({ order: 2, key: 'switch', title: '光遗传', dur: S2DUR, lines: S2LINES, fn: s2Draw });
