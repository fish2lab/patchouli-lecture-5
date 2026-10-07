'use strict';
// 第 6 段：结尾「物质的、可被理解的」。照 V8 黑板报收尾：主张原句用粗粉笔写在黑板中央、关键词边写边划线；
// 然后镜头右移到干净的一侧（板坐标 x 约 1900–2900），画一张粉笔思维导图回顾三章，最后写求助的话、片尾出处。
// 最后一段：不擦黑板（不用 ogOutro），最后 1 秒画面静止、稍稍变暗。顶层名字带 S6 / s6 前缀。
const S6LINES = seq(.8, [
  ['我读得出难过。现在，我也知道它从哪里来了。', { who: 'satori', hold: .3 }],
  ['抑郁、精神分裂、阿尔茨海默病，它们各不相同。', { pause: .2 }],
  ['却都指向同一个事实。', { hold: .2 }],
  ['心灵的苦难，有其物质的、可被理解的机制。', { who: 'satori', mood: 'smile', pause: .2, hold: 1.5 }],
  ['那我心情不好的时候呢？', { who: 'cirno', pause: 2.4 }],
  ['找人说说，也可以去看医生。简介里有心理援助热线。', { mood: 'smile', hold: .6 }],
]);
const s6T = i => S6LINES[i][0], s6E = i => S6LINES[i][1], s6D = i => s6E(i) - s6T(i);
const S6DUR = s6E(5) + 3.0;
const S6MX = 1440;                       // 思维导图的板坐标偏移（镜头右移 1440 后，板坐标 = 屏幕坐标 + 1440）
const s6m = (x, y) => [x + S6MX, y];

// 中央三行（板坐标 = 屏幕坐标）
const S6R1 = '抑郁、精神分裂、阿尔茨海默病', S6R2A = '它们各不相同，', S6R2B = '却都指向同一个事实';
const S6R3 = '心灵的苦难，', S6R4 = '有其物质的、可被理解的机制';
const S6Y = [215, 330, 490, 600], S6SZ = [64, 52, 72, 72];

// ---- 导图里的四枝（屏幕坐标设计，画时 +S6MX）：根（椭圆边）、枝端、标签位置/对齐、涂鸦 ----
const S6EL = { x: 910, y: 370, rx: 215, ry: 92 };
const S6BR = [
  { from: [1060, 305], to: [1150, 215], text: '见光就开的通道', tx: 1130, ty: 160, al: 'center', dood: 's6DoodChannel', dx: 1340, dy: 150 },
  { from: [1065, 440], to: [1140, 530], text: '光遗传学：拨开关看行为', tx: 1215, ty: 582, al: 'right', dood: 's6DoodSwitch', dx: 1010, dy: 648 },
  { from: [760, 440], to: [690, 530], text: '三种失稳', tx: 640, ty: 582, al: 'center', dood: 's6DoodTrio', dx: 640, dy: 648 },
  { from: [755, 305], to: [690, 215], text: '还有一段路：多来自小鼠', tx: 690, ty: 160, al: 'center', dood: 's6DoodRoad', dx: 690, dy: 192 },
];

// ---- 小涂鸦（板坐标中心 x,y；p 画出进度） ----
const s6seg = (p, i, n) => clamp(p * n - i, 0, 1);
function s6DoodChannel(lc, x, y, p) {   // 膜上一个通道：两段膜、两根门柱、一道蓝光、几个离子
  ckLine(lc, [[x - 60, y - 10], [x - 16, y - 10]], { w: 4, color: 'muted', p: s6seg(p, 0, 4), seed: 601 });
  ckLine(lc, [[x + 16, y - 10], [x + 60, y - 10]], { w: 4, color: 'muted', p: s6seg(p, 0, 4), seed: 602 });
  ckLine(lc, [[x - 60, y + 14], [x - 16, y + 14]], { w: 4, color: 'muted', p: s6seg(p, 0, 4), seed: 603 });
  ckLine(lc, [[x + 16, y + 14], [x + 60, y + 14]], { w: 4, color: 'muted', p: s6seg(p, 0, 4), seed: 604 });
  ckLine(lc, [[x - 15, y - 24], [x - 15, y + 28]], { w: 5, p: s6seg(p, 1, 4), seed: 605 });
  ckLine(lc, [[x + 15, y - 24], [x + 15, y + 28]], { w: 5, p: s6seg(p, 1, 4), seed: 606 });
  ckArrow(lc, [x - 52, y - 58], [x - 20, y - 30], { color: 'blue', w: 4, head: 11, p: s6seg(p, 2, 4), seed: 607 });
  if (p > .85) { lc.fillStyle = CK.yellow; for (const [ox, oy] of [[0, -38], [-2, 2], [3, 40]]) { lc.beginPath(); lc.arc(x + ox, y + oy, 4.5, 0, TAU); lc.fill(); } }
}
function s6DoodSwitch(lc, x, y, p) {    // 墙上的电灯开关：面板、拨杆
  ckShape(lc, rectPts(x - 24, y - 34, 48, 68, 8), { w: 4, p: s6seg(p, 0, 2), seed: 611 });
  ckLine(lc, [[x, y + 4], [x + 6, y - 22]], { w: 7, color: 'yellow', p: s6seg(p, 1, 2), seed: 612 });
  if (p > .7) { lc.fillStyle = CK.ink; lc.beginPath(); lc.arc(x, y + 6, 5, 0, TAU); lc.fill(); }
}
function s6DoodTrio(lc, x, y, p) {      // 三种失稳的小记号：插头、乱线、点阵
  const a = s6seg(p, 0, 3), b = s6seg(p, 1, 3), d = s6seg(p, 2, 3);
  ckShape(lc, rectPts(x - 92, y - 14, 30, 28, 4), { w: 4, p: a, seed: 621 });
  ckLine(lc, [[x - 62, y - 7], [x - 48, y - 7]], { w: 4, p: a, seed: 622 }); ckLine(lc, [[x - 62, y + 7], [x - 48, y + 7]], { w: 4, p: a, seed: 623 });
  const wv = []; for (let k = 0; k <= 16; k++) wv.push([x - 26 + k * 3.3, y + Math.sin(k * 1.3) * 12 * (k % 3 ? 1 : -.6)]);
  ckLine(lc, wv, { w: 4, color: 'pink', p: b, seed: 624, smooth: true });
  if (d > 0) { lc.fillStyle = CK.muted; for (let i = 0; i < 9; i++) { if (i / 9 > d) break; const gx = x + 58 + (i % 3) * 16, gy = y - 16 + Math.floor(i / 3) * 16; lc.beginPath(); lc.arc(gx, gy, 3.6, 0, TAU); lc.fill(); } }
}
function s6DoodRoad(lc, x, y, p) {      // 一小段实线，后面是长长的虚线
  ckLine(lc, [[x - 160, y], [x - 100, y]], { w: 5, color: 'green', p: s6seg(p, 0, 2), seed: 631 });
  ckLine(lc, [[x - 92, y], [x + 160, y]], { w: 4, color: 'muted', dash: [16, 14], p: s6seg(p, 1, 2), seed: 632 });
}
const S6DOOD = { s6DoodChannel, s6DoodSwitch, s6DoodTrio, s6DoodRoad };

function s6Draw(c, tau0, L) {
  const tau = Math.min(tau0, S6DUR - 1);   // 最后 1 秒整体静止
  ckRoom(c, tau);
  const tm = s6E(3) + .1;                  // 主张写完、停够之后，镜头右移到导图
  const cam = ckCam(tau, [[0, CKB.cx, CKB.cy, 1], [tm, CKB.cx, CKB.cy, 1], [tm + 1.5, CKB.cx + S6MX, CKB.cy, 1]]);
  const pens = [];
  let erasePos = null;
  ckLayer(c, cam, lc => {
    // ================= 第 1 句：「难过 · ← 从哪里来」小字（围着上一段留下的点） =================
    const dot = [CKB.cx, CKB.cy];
    lc.fillStyle = CK.ink; lc.beginPath(); lc.arc(dot[0], dot[1], 7, 0, TAU); lc.fill();
    const a1 = ckWrite(lc, tau, '难过', dot[0] - 30, dot[1] + 16, s6T(0) + .5, { size: 46, align: 'right', spc: .14 });
    ckText(lc, '难过', dot[0] - 30, dot[1] + 16, { size: 46, align: 'right', color: 'muted', p: a1.p }); a1.color = 'ink'; pens.push(a1);
    const a2 = ckWrite(lc, tau, '← 从哪里来', dot[0] + 30, dot[1] + 16, s6T(0) + s6D(0) * .5, { size: 46, spc: .13 });
    ckText(lc, '← 从哪里来', dot[0] + 30, dot[1] + 16, { size: 46, color: 'yellow', p: a2.p }); a2.color = 'yellow'; pens.push(a2);
    erasePos = ckErase(lc, [dot[0] - 170, dot[1] - 50, 470, 100], sm(s6E(0) - .15, s6T(1) + .45, tau, t => t));

    // ================= 第 2–4 句：中央三行粗粉笔 =================
    const cx = CKB.cx;
    // 第一行：口播「抑郁、精神分裂、阿尔茨海默病，」占第 2 句的 15/22
    const sp1 = s6D(1) * 15 / 22 / [...S6R1].length;
    const r1 = ckWrite(lc, tau, S6R1, cx, S6Y[0], s6T(1) + .1, { size: S6SZ[0], align: 'center', spc: sp1 });
    ckText(lc, S6R1, cx, S6Y[0], { size: S6SZ[0], align: 'center', color: 'pink', heavy: true, p: r1.p }); r1.color = 'pink'; pens.push(r1);
    // 第二行：前半「它们各不相同，」在第 2 句后段，后半在第 3 句
    const fw2 = zhWidth(lc, S6R2A + S6R2B, S6SZ[1]), x2 = cx - fw2 / 2;
    const r2a = ckWrite(lc, tau, S6R2A, x2, S6Y[1], s6T(1) + s6D(1) * 15 / 22, { size: S6SZ[1], spc: s6D(1) * 6 / 22 / 7 });
    ckText(lc, S6R2A, x2, S6Y[1], { size: S6SZ[1], heavy: true, p: r2a.p }); r2a.color = 'ink'; pens.push(r2a);
    const x2b = x2 + zhWidth(lc, S6R2A, S6SZ[1]);
    const r2b = ckWrite(lc, tau, S6R2B, x2b, S6Y[1], s6T(2) + .05, { size: S6SZ[1], spc: (s6D(2) - .5) / 9 });
    ckText(lc, S6R2B, x2b, S6Y[1], { size: S6SZ[1], heavy: true, p: r2b.p }); r2b.color = 'ink'; pens.push(r2b);
    // 第三、四行（黄、更大）：第 4 句口播部分（去掉 hold）匀速写完
    const sp4 = (s6D(3) - 1.5 - .3) / ([...S6R3].length + [...S6R4].length);
    const r3 = ckWrite(lc, tau, S6R3, cx, S6Y[2], s6T(3) + .05, { size: S6SZ[2], align: 'center', spc: sp4 });
    ckText(lc, S6R3, cx, S6Y[2], { size: S6SZ[2], align: 'center', color: 'yellow', heavy: true, p: r3.p }); r3.color = 'yellow'; pens.push(r3);
    const t4 = s6T(3) + .05 + [...S6R3].length * sp4;
    const r4 = ckWrite(lc, tau, S6R4, cx, S6Y[3], t4, { size: S6SZ[3], align: 'center', spc: sp4 });
    ckText(lc, S6R4, cx, S6Y[3], { size: S6SZ[3], align: 'center', color: 'yellow', heavy: true, p: r4.p }); r4.color = 'yellow'; pens.push(r4);
    // 写到「物质的」「可被理解的」时各划一道线
    const x4 = cx - zhWidth(lc, S6R4, S6SZ[3]) / 2;
    const u1x = x4 + zhWidth(lc, '有其', S6SZ[3]), u2x = x4 + zhWidth(lc, '有其物质的、', S6SZ[3]);
    ckUnderline(lc, '物质的', u1x, S6Y[3] + 6, S6SZ[3], 'ink', sm(t4 + 5 * sp4, t4 + 5 * sp4 + .4, tau), 641);
    ckUnderline(lc, '可被理解的', u2x, S6Y[3] + 6, S6SZ[3], 'ink', sm(t4 + 11 * sp4, t4 + 11 * sp4 + .5, tau), 642);

    // ================= 第 5–6 句：右侧干净板面上的思维导图 =================
    const ts = tm + 1.0;                    // 骨架开始
    const el = ellPts(S6EL.x + S6MX, S6EL.y, S6EL.rx, S6EL.ry, 44, -.03); el.push([el[0][0] + 16, el[0][1] - 12]);
    ckLine(lc, el, { w: 5, smooth: true, p: sm(ts, ts + .8, tau), seed: 650 });
    const c1 = ckWrite(lc, tau, '心灵的苦难', ...s6m(S6EL.x, S6EL.y - 8), ts + .7, { size: 54, align: 'center', spc: .09 });
    ckText(lc, '心灵的苦难', ...s6m(S6EL.x, S6EL.y - 8), { size: 54, align: 'center', color: 'yellow', heavy: true, p: c1.p }); c1.color = 'yellow'; pens.push(c1);
    const c2 = ckWrite(lc, tau, '有物质的、可被理解的机制', ...s6m(S6EL.x, S6EL.y + 46), ts + 1.2, { size: 30, align: 'center', spc: .045 });
    ckText(lc, '有物质的、可被理解的机制', ...s6m(S6EL.x, S6EL.y + 46), { size: 30, align: 'center', color: 'muted', p: c2.p }); c2.color = 'ink'; pens.push(c2);
    // 四根枝（骨架），一点钟方向起顺时针
    const tb = ts + 1.8;
    S6BR.forEach((b, i) => {
      const a = s6m(...b.from), e = s6m(...b.to), mid = [(a[0] + e[0]) / 2 + (e[1] - a[1]) * .12, (a[1] + e[1]) / 2 - (e[0] - a[0]) * .12];
      ckLine(lc, spline([a, mid, e], 6), { w: 5, color: 'muted', p: sm(tb + i * .22, tb + i * .22 + .3, tau), seed: 660 + i });
      if (tau > tb + i * .22 + .3) { lc.fillStyle = CK.ink; lc.beginPath(); lc.arc(e[0], e[1], 6, 0, TAU); lc.fill(); }
    });
    // 逐枝写字、配涂鸦：从第 5 句开口起，一枝约 1 秒
    const tl0 = Math.max(tb + 1.2, s6T(4) - .3), stride = 1.05;
    S6BR.forEach((b, i) => {
      const t0 = tl0 + i * stride, n = [...b.text].length, spc = Math.min(.07, .62 / n);
      const w = ckWrite(lc, tau, b.text, ...s6m(b.tx, b.ty), t0, { size: 38, align: b.al, spc });
      ckText(lc, b.text, ...s6m(b.tx, b.ty), { size: 38, align: b.al, p: w.p }); w.color = 'ink'; pens.push(w);
      S6DOOD[b.dood](lc, ...s6m(b.dx, b.dy), sm(t0 + n * spc, t0 + n * spc + .38, tau, t => t));
    });
    // 导图下方：求助的话（绿），写完框起来
    const tg = Math.max(tl0 + 4 * stride, s6T(5) + .3), G = '难过的时候：找人说说，也可以看医生', gs = 42;
    const g = ckWrite(lc, tau, G, ...s6m(900, 742), tg, { size: gs, align: 'center', spc: .08 });
    ckText(lc, G, ...s6m(900, 742), { size: gs, align: 'center', color: 'green', p: g.p }); g.color = 'green'; pens.push(g);
    const gw = zhWidth(lc, G, gs), tgb = tg + [...G].length * .08;
    ckShape(lc, rectPts(900 + S6MX - gw / 2 - 30, 742 - gs - 12, gw + 60, gs + 40, 14), { color: 'green', w: 4.5, p: sm(tgb, tgb + .7, tau), seed: 670 });
    // 片尾出处：右下角两行小字
    const tc = S6DUR - 2.6, ca = sm(tc, tc + .5, tau);
    if (ca > 0) {
      ckText(lc, '参考文献与心理援助热线见简介', 1515 + S6MX, 818, { size: 30, align: 'right', color: 'muted', al: ca });
      ckText(lc, '等轴测线框照 hairline（Lucas Marques, MIT）· 黑板画法照 V8 黑板报', 1515 + S6MX, 852, { size: 30, align: 'right', color: 'muted', al: ca });
    }
  });
  // 粉笔头跟着正在写的字
  const pen = pens.filter(w => w.writing).pop();
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau, { color: pen.color }); ckDust(c, sp, tau, true, 648); }
  ogEraser(c, cam, erasePos);
  // 人物
  const reading = tau < s6E(0) + .3, rd = sm(s6T(0) - .4, s6T(0) + .3, tau) * (1 - sm(s6E(0), s6E(0) + .5, tau));
  const pointing = (tau > s6T(1) - .2 && tau < s6E(2) + .3) || (tau > s6T(5) && tau < s6E(5));
  ogPch(c, tau, L, { pose: pointing ? 'point' : 'lecture', gesture: .6 });
  ogSat(c, tau, L, { pose: reading ? 'read' : 'stand', read: rd, eye3: .35 + .65 * sm(s6T(0) - .4, s6T(0) + .4, tau), eyeLook: reading ? [.8, -.2] : [.3, .1] });
  ogCirno(c, tau, L, S6LINES);
  // 最后 1 秒：淡到稍暗
  const dim = sm(S6DUR - 1, S6DUR, tau0);
  if (dim > 0) { c.save(); c.fillStyle = `rgba(8,6,12,${.32 * dim})`; c.fillRect(0, 0, W, H); c.restore(); }
}
scene({ order: 6, key: 'ending', title: '结尾', dur: S6DUR, lines: S6LINES, fn: s6Draw });
