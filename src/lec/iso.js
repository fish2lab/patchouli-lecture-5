'use strict';
// 等轴测线框图 · 粉笔版（四个图：isoTerrain、isoPlug、isoPatch、isoPhosphor）
//
// 出处：几何、比例和 falloff 曲线照抄 npm 包 @lucasmarkes/hairline（作者 Lucas Marques，MIT 许可，
// 演示 https://hairline.lucasmarkes.com）的 terrain / plug / patch / phosphor 四个图和它的 core/iso（Cam、proj、fit、
// rrect、hull、run、prism、rings）。原包是 SVG + 弹簧 + performance.now 实时步进、跟随鼠标；这里全部改成
// 「参数 → 画面」的闭式纯函数：鼠标换成调用方传进来的参数（光点位置、进度、时间），不存状态，不用 Math.random。
//
//   MIT License · Copyright (c) Lucas Marques
//   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
//   documentation files (the "Software"), to deal in the Software without restriction, including without limitation
//   the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
//   permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright
//   notice and this permission notice shall be included in all copies or substantial portions of the Software.
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
//
// 画法：每个实体先用 destination-out 把自己的轮廓区域从粉笔层里「擦掉」（等于原包的白底遮挡，画家算法从后往前），
// 再用 ckLine 描轮廓。所以这些函数要画在 ckLayer 的 lc 上。线宽 3–5，白粉笔为主，muted 是次要线，黄色是被点亮，蓝色是光。
// 顶层名字一律 iso / ISO 前缀。

// ===================== 等轴测几何（照抄 hairline core/iso） =====================
const ISO_RAD = d => d * Math.PI / 180;
const isoSS = t => t * t * (3 - 2 * t);
// 局部进度：总进度 p 在 [a, b] 里走 0→1
const isoWin = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
function isoCam(azDeg, k, S = 1) { return { az: ISO_RAD(azDeg), k, S, ox: 0, oy: 0 }; }
// 世界 (x, y, z) → 板坐标。返回的函数每次调用时读 C 的 S/ox/oy
function isoProj(C) {
  const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
  return (x, y, z) => { const X = x * c - y * s, Y = x * s + y * c; return [C.ox + C.S * X, C.oy + C.S * (Y * C.k - z * zf)]; };
}
function isoUnproj(C, sx, sy, z) {
  const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
  const X = (sx - C.ox) / C.S, Y = ((sy - C.oy) / C.S + z * zf) / C.k;
  return [X * c + Y * s, -X * s + Y * c];
}
// isoBBox：pts 在 S=1、原点 0 时的投影包围盒 [x0, x1, y0, y1]
function isoBBox(C, pts) {
  const S = C.S, ox = C.ox, oy = C.oy; C.S = 1; C.ox = C.oy = 0;
  const P = isoProj(C); let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  for (const p of pts) { const q = P(p[0], p[1], p[2]); a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]); }
  C.S = S; C.ox = ox; C.oy = oy; return [a, b, c, d];
}
// isoPlace：缩放到 pts 的投影宽度 = s 像素，投影包围盒中心落在 (x, y)（= 原包 fit，外加按宽度定比例）
function isoPlace(C, pts, s, x, y) {
  const [a, b, c, d] = isoBBox(C, pts);
  C.S = s / (b - a); C.ox = x - (a + b) / 2 * C.S; C.oy = y - (c + d) / 2 * C.S;
  return isoProj(C);
}
function isoRRect(u0, v0, u1, v1, r, n = 4) {
  r = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2)); const out = [];
  for (const [cu, cv, a0] of [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]])
    for (let k = 0; k <= n; k++) { const a = ISO_RAD(a0 + 90 * k / n), ca = Math.cos(a), sa = Math.sin(a); out.push({ u: cu + r * ca, v: cv + r * sa, nu: ca, nv: sa }); }
  return out;
}
function isoCirc(R, n = 96) { const out = []; for (let k = 0; k < n; k++) { const a = k / n * TAU, ca = Math.cos(a), sa = Math.sin(a); out.push({ u: R * ca, v: R * sa, nu: ca, nv: sa }); } return out; }
function isoHull(input) {
  const pts = input.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of pts) { while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length > 1 && x(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  lo.pop(); up.pop(); return lo.concat(up);
}
const isoRingAt = (P, ring, z) => ring.map(q => P(q.u, q.v, z));
const isoFacing = C => { const s = Math.sin(C.az), c = Math.cos(C.az); return q => q.nu * s + q.nv * c >= -1e-6; };
// isoRun：环上连续满足 keep 的一段（朝向镜头的那半圈）
function isoRun(ring, keep) {
  const n = ring.length; let s = -1;
  for (let i = 0; i < n; i++) if (keep(ring[i]) && !keep(ring[(i + n - 1) % n])) { s = i; break; }
  if (s < 0) return keep(ring[0]) ? ring.slice() : [];
  const out = []; for (let k = 0; k < n && keep(ring[(s + k) % n]); k++) out.push(ring[(s + k) % n]); return out;
}
// isoPrism：竖直棱柱的轮廓（凸包）和顶面内沿的折痕线
function isoPrism(P, front, ring, inner, z0, z1) {
  return { sil: isoHull(isoRingAt(P, ring, z1).concat(isoRingAt(P, ring, z0))), crease: inner ? isoRingAt(P, isoRun(inner, front), z1) : null };
}
const isoRings = (x0, y0, x1, y1, r, b) => [isoRRect(x0, y0, x1, y1, r), isoRRect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(.3, r - b))];
// isoBand：棱柱朝向镜头的侧面带（上沿 z1、下沿 z0），给斜线阴影用
function isoBand(P, front, ring, z0, z1) { const f = isoRun(ring, front); return isoRingAt(P, f, z1).concat(isoRingAt(P, f.slice().reverse(), z0)); }
function isoExtremes(P, ring) {
  const pr = ring.map(q => P(q.u, q.v, 0)); let a = 0, b = 0, c = 0;
  pr.forEach((p, k) => { if (p[0] < pr[a][0]) a = k; if (p[0] > pr[b][0]) b = k; if (p[1] > pr[c][1]) c = k; });
  return [ring[a], ring[b], ring[c]];
}
function isoFillet(pts, rs, n = 4) {
  const m = pts.length, out = [];
  for (let i = 0; i < m; i++) {
    const a = pts[(i + m - 1) % m], p = pts[i], b = pts[(i + 1) % m], la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const t = Math.min(rs[i], la / 2, lb / 2), p1 = [p[0] + (a[0] - p[0]) / la * t, p[1] + (a[1] - p[1]) / la * t], p2 = [p[0] + (b[0] - p[0]) / lb * t, p[1] + (b[1] - p[1]) / lb * t];
    for (let k = 0; k <= n; k++) { const s = k / n, w = 1 - s; out.push([w * w * p1[0] + 2 * w * s * p[0] + s * s * p2[0], w * w * p1[1] + 2 * w * s * p[1] + s * s * p2[1]]); }
  }
  return out;
}
function isoBez(p0, p1, p2, p3, s) { const a = (1 - s) ** 3, b = 3 * (1 - s) ** 2 * s, c = 3 * (1 - s) * s * s, d = s ** 3; return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1], a * p0[2] + b * p1[2] + c * p2[2] + d * p3[2]]; }

// ===================== 粉笔画实体 =====================
// isoErase：把多边形区域从粉笔层擦掉（遮挡后面的线）。al 随画出进度
function isoErase(lc, pts, al = 1) {
  if (al <= 0 || pts.length < 3) return;
  lc.save(); lc.globalCompositeOperation = 'destination-out'; lc.globalAlpha = clamp(al, 0, 1); lc.fillStyle = '#000'; lc.fill(polyPath(pts)); lc.restore();
}
// isoSolid：擦底 + 轮廓 + 折痕。o = { color, w, crease 颜色, cw, p, seed, erase, amp }
function isoSolid(lc, s, o = {}) {
  const { color = 'ink', w = 4, crease = 'muted', cw = 3, p = 1, seed = 1, erase = true, amp = .8 } = o;
  if (p <= 0) return;
  if (erase) isoErase(lc, s.sil, p * 2.5);
  ckLine(lc, s.sil, { color, w, p, seed, close: true, amp });
  if (s.crease && s.crease.length > 1) ckLine(lc, s.crease, { color: crease, w: cw, p: clamp(p * 2 - 1, 0, 1), seed: seed + 1, amp });
}
// isoHatch：多边形里的斜线阴影（只画阴影，不描边）
function isoHatch(lc, pts, color = 'muted', o = {}) {
  if (pts.length < 3 || (o.al ?? 1) <= 0) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of pts) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
  hatch(lc, polyPath(pts), [x0, y0, x1 - x0, y1 - y0], { gap: o.gap ?? 11, angle: o.angle ?? -.75, color: ckColor(color), w: o.w ?? 2.4, al: .6 * (o.al ?? 1), seed: o.seed ?? 1 });
}
// isoDisc：世界里水平面上的一个小圆点（板坐标填充）
function isoDisc(lc, C, q, r, color, al = 1) {
  if (al <= 0 || r <= 0) return;
  lc.globalAlpha = clamp(al, 0, 1); lc.fillStyle = ckColor(color); lc.beginPath(); lc.ellipse(q[0], q[1], r * C.S, r * C.S * C.k, 0, 0, TAU); lc.fill(); lc.globalAlpha = 1;
}

// ===================== 1. terrain：一群神经元 =====================
// 原包：9×9 根圆角方柱立在圆角方底座上，Cam(45°, 0.5)，柱高 = HMAX × falloff7(到指针距离 / 半径)。
const ISO_T = (() => {
  const N = 9, CELL = 14, FOOT = 11, HMAX = 58, EXT = N * CELL, PB = 5;
  const [pr, pi] = isoRings(-6, -6, EXT + 6, EXT + 6, 9, 2.2), cols = [];
  // 从后往前（i + j 递增）= 原包的绘制顺序
  for (let s = 0; s <= 2 * (N - 1); s++) for (let i = 0; i < N; i++) {
    const j = s - i; if (j < 0 || j >= N) continue;
    const u = i / (N - 1), v = j / (N - 1);
    const h0 = 4 + 25 * Math.exp(-((u - .22) ** 2 + (v - .74) ** 2) / .07) + 12 * Math.exp(-((u - .8) ** 2 + (v - .26) ** 2) / .035);
    const x0 = i * CELL + (CELL - FOOT) / 2, y0 = j * CELL + (CELL - FOOT) / 2, [ring, inner] = isoRings(x0, y0, x0 + FOOT, y0 + FOOT, 2.6, .9);
    cols.push({ i, j, h0: h0 / HMAX, ring, inner });
  }
  const fitPts = [[-6, -6, -PB], [EXT + 6, EXT + 6, -PB], [EXT + 6, -6, -PB], [-6, EXT + 6, -PB], [0, 0, HMAX * .75]];
  return { N, CELL, FOOT, HMAX, EXT, PB, pr, pi, cols, fitPts };
})();
// falloff7：原包 terrain 的折线衰减（u = 距离 / 半径）
const isoFalloff7 = u => u <= 0 ? 1 : u <= .417 ? 1 - u / .417 * .6875 : u <= 1 ? .3125 - (u - .417) / .583 * .2185 : .094;

// isoTerrain(lc, o)
//   o.x, o.y：底座顶面中心（世界 z=0 的格子中心）在板坐标的位置，默认 (960, 470)
//   o.s：整体宽度（底座 + 柱子的投影宽度，像素），默认 560
//   o.light：[u, v] 光点所在格坐标（0..8，可小数；u 沿右上方向，v 沿左上方向，[0,0] 是最后面那根），null = 不照
//   o.r 光照半径（格，默认 1.6）；o.level 0..1 被照处升起的强度；o.p 0..1 画出进度（底座先画，柱子从后往前出现）
//   o.base(i, j) → 0..1 静息高度（单位 = 原包 HMAX），默认是原包静息地形 × 0.45；o.beam 画光纤和蓝色光锥；o.hi 点亮色键
// 返回 { spot: 光点在底座顶面的板坐标（light 为 null 时为底座中心）, lit: 高于一半的柱数 }
function isoTerrain(lc, o = {}) {
  const { x = 960, y = 470, s = 560, light = null, r = 1.6, level = 0, p = 1, base = null, beam = false, hi = 'yellow' } = o;
  const T = ISO_T, C = isoCam(45, .5), P = isoPlace(C, T.fitPts, s, 0, 0);
  const c0 = P(T.EXT / 2, T.EXT / 2, 0); C.ox += x - c0[0]; C.oy += y - c0[1];
  const front = isoFacing(C), pB = isoWin(p, 0, .28);
  // 底座：侧面带斜线阴影 + 轮廓
  if (pB > 0) {
    if (pB >= 1) isoHatch(lc, isoBand(P, front, T.pr, -T.PB, 0), 'muted', { gap: 9, seed: 41 });
    isoSolid(lc, isoPrism(P, front, T.pr, T.pi, -T.PB, 0), { color: 'ink', w: 4, p: pB, seed: 40 });
  }
  const lu = light ? light[0] : null, lv = light ? light[1] : null;
  const mi = light ? clamp(Math.round(lu), 0, T.N - 1) : -1, mj = light ? clamp(Math.round(lv), 0, T.N - 1) : -1;
  let lit = 0, markH = 0;
  const n = T.cols.length;
  for (let k = 0; k < n; k++) {
    const col = T.cols[k], pc = isoWin(p, .22 + .66 * k / n, .22 + .66 * k / n + .12);
    const b0 = base ? base(col.i, col.j) : col.h0 * .45;
    const f = light ? isoFalloff7(Math.hypot(col.i - lu, col.j - lv) / Math.max(.05, r)) : 0;
    const h = Math.max(.6, T.HMAX * Math.min(1.25, b0 + level * f)), on = h > T.HMAX * .5;
    if (on) lit++;
    if (pc > 0) {
      const sp = isoPrism(P, front, col.ring, col.inner, 0, h);
      isoSolid(lc, sp, { color: on ? hi : 'muted', w: on ? 4 : 3, crease: on ? hi : 'muted', cw: 2.5, p: pc, seed: 100 + k * 3 });
      if (on && pc >= 1) isoHatch(lc, isoRingAt(P, col.ring, h), hi, { gap: 8, angle: -.3, al: .8, seed: 200 + k });
    }
    // 光点的 3×3 小点画在被照那根柱子的顶面上（原包的 mark），后面的柱子会挡住它
    if (col.i === mi && col.j === mj) {
      markH = h;
      const pm = isoWin(p, .9, 1);
      if (pm > 0) for (let q = 0; q < 9; q++) {
        const cx = (lu + .5) * T.CELL + (q % 3 - 1) * 2.5, cy = (lv + .5) * T.CELL + (Math.floor(q / 3) - 1) * 2.5;
        isoDisc(lc, C, P(cx, cy, h), q === 4 ? .8 : .55, q === 4 ? 'blue' : 'ink', pm);
      }
    }
  }
  const spot = light ? P((lu + .5) * T.CELL, (lv + .5) * T.CELL, 0) : c0.map((v, i) => v + (i ? y - c0[1] : x - c0[0]));
  // 光纤 + 光锥：从板上方落到被照柱顶
  const pb = isoWin(p, .88, 1);
  if (beam && light && pb > 0) {
    const wx = (lu + .5) * T.CELL, wy = (lv + .5) * T.CELL, top = P(wx, wy, markH), R = Math.max(4, r * T.CELL * .55);
    const tip = [top[0], top[1] - s * .62], ring = isoRingAt(P, isoCirc(R, 28).map(q => ({ u: wx + q.u, v: wy + q.v })), markH);
    let a = 0, b = 0; ring.forEach((q, i) => { if (q[0] < ring[a][0]) a = i; if (q[0] > ring[b][0]) b = i; });
    // 光锥面：tip → 左切点 → 椭圆前半圈 → 右切点
    const arc = [ring[a], ...ring.filter(q => q[1] > top[1]).sort((u, v) => u[0] - v[0]), ring[b]];
    const face = [tip, ...arc];
    if (pb >= 1) isoHatch(lc, face, 'blue', { gap: 13, angle: -1.1, al: .7, seed: 61 });
    ckLine(lc, [tip, ring[a]], { color: 'blue', w: 3.5, p: pb, seed: 62 });
    ckLine(lc, [tip, ring[b]], { color: 'blue', w: 3.5, p: pb, seed: 63 });
    ckLine(lc, ring, { color: 'blue', w: 3, p: pb, seed: 64, close: true });
    // 光纤：一根从上方伸下来的细管，末端一个小套圈
    ckLine(lc, [[tip[0] - 5, tip[1]], [tip[0] - 5, tip[1] - 900]], { color: 'ink', w: 3, p: pb, seed: 65 });
    ckLine(lc, [[tip[0] + 5, tip[1]], [tip[0] + 5, tip[1] - 900]], { color: 'ink', w: 3, p: pb, seed: 66 });
    ckLine(lc, [[tip[0] - 9, tip[1] - 2], [tip[0] + 9, tip[1] - 2]], { color: 'blue', w: 4, p: pb, seed: 67 });
  }
  return { spot, lit };
}

// ===================== 2. plug：一个突触连接 =====================
// 原包：x=0 竖墙面上一块圆角方插座面板（面朝 +x），地上躺一只两脚插头；拉动时插头沿弧线升起、转身、对准插孔。
const ISO_P = (() => {
  const G = { PT: 3, PH: 21, ZC: 30, PR: 7, B: 1.4, HOLE: 2.6, HS: 8, RECESS: 13, BW: 11, BH: 6.5, BR: 4.5, BL: 18, PIN: 2, PL: 11, SL: 7, S0: 4.6, S1: 3, CR: 1.8, REST: [48, 8], YAW: 100, TURN: .7 };
  const pose = isoPlugPose, at = isoPlugAt, ext = [];
  for (const x of [0, -G.PT]) for (const y of [-G.PH, G.PH]) for (const z of [G.ZC - G.PH, G.ZC + G.PH]) ext.push([x, y, z]);
  for (const s of [0, 1]) { const o = pose(s, G); for (const a of [-G.BW, G.BW]) for (const b of [-G.BH, G.BH]) for (const d of [G.PL, -G.BL - G.SL]) ext.push(at(o, a, b, d)); }
  // 原包的电线终点和裁切线是按 400×320 的 viewBox 定的：在原尺度（S=2.8，fit 到 (200,166)）里算一次，换成比例
  const C = isoCam(45, .5, 2.8), [a0, b0, c0, d0] = isoBBox(C, ext);
  C.ox = 200 - (a0 + b0) / 2 * 2.8; C.oy = 166 - (c0 + d0) / 2 * 2.8;
  const end = [...isoUnproj(C, 440, 150, G.CR), G.CR], edge = (398 - 200) / ((b0 - a0) * 2.8);
  const face = isoRRect(-G.PH, G.ZC - G.PH, G.PH, G.ZC + G.PH, G.PR, 6), lip = isoRRect(-G.PH + G.B, G.ZC - G.PH + G.B, G.PH - G.B, G.ZC + G.PH - G.B, G.PR - G.B, 6);
  const box = k => isoRRect(-G.BW + k, -G.BH + k, G.BW - k, G.BH - k, G.BR - k), rod = k => isoCirc(G.PIN - k, 12);
  const rounded = (f, rr, d, dir) => [0, 30, 60, 90].map(a => [f(rr * (1 - Math.sin(ISO_RAD(a)))), d + dir * rr * (1 - Math.cos(ISO_RAD(a)))]);
  const shell = [...rounded(box, 2, 0, -1), ...rounded(box, 2, -G.BL, 1)];
  return { G, ext, end, edge, face, lip, box, rod, rounded, shell, inner: box(2), recess: isoCirc(G.RECESS, 48), hole: isoCirc(G.HOLE, 16), s0: isoCirc(G.S0, 16), s1: isoCirc(G.S1, 16), bend: [G.REST[0] + 18, G.REST[1] - 52, G.CR] };
})();
// 插头姿态：s 0..1 沿原包的弧线（位置线性 + z 走 sin，偏航 100°→180° 在前 70% 转完）
function isoPlugPose(s, G = ISO_P.G) {
  const th = ISO_RAD(lerp(G.YAW, 180, isoSS(clamp(s / G.TURN, 0, 1))));
  return { c: [lerp(G.REST[0], G.PL, s), lerp(G.REST[1], 0, s), lerp(G.BH, G.ZC, Math.sin(s * Math.PI / 2))], w: [Math.cos(th), Math.sin(th), 0], u: [-Math.sin(th), Math.cos(th), 0] };
}
function isoPlugAt(o, a, b, d) { return [o.c[0] + a * o.u[0] + d * o.w[0], o.c[1] + a * o.u[1] + d * o.w[1], o.c[2] + b]; }
// 电线轮廓（原包 tube4）：中线 Q 左右各偏 rho，自交处剪掉，X 右边裁掉
function isoUntangle(L) {
  for (let i = 0; i < L.length - 3; i++) for (let j = L.length - 2; j > i + 1; j--) {
    const p = L[i], q = L[i + 1], r = L[j], s = L[j + 1], e0 = q[0] - p[0], e1 = q[1] - p[1], f0 = s[0] - r[0], f1 = s[1] - r[1], g0 = r[0] - p[0], g1 = r[1] - p[1], d = e0 * f1 - e1 * f0;
    if (!d) continue; const t = (g0 * f1 - g1 * f0) / d, u = (g0 * e1 - g1 * e0) / d;
    if (t > 0 && t < 1 && u > 0 && u < 1) { L.splice(i + 1, j - i, [p[0] + t * e0, p[1] + t * e1]); break; }
  }
  return L;
}
function isoUpTo(L, X) {
  const i = L.findIndex(q => q[0] > X); if (i < 1) return i < 0 ? L : [];
  const p = L[i - 1], q = L[i], f = (X - p[0]) / (q[0] - p[0]); return [...L.slice(0, i), [X, p[1] + (q[1] - p[1]) * f]];
}
function isoTube(Q, rho, X) {
  const n = Q.length, A = [], Bk = [];
  for (let i = 0; i < n; i++) { const a = Q[Math.max(i - 1, 0)], c = Q[i], b = Q[Math.min(i + 1, n - 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l; A.push([c[0] - ty * rho, c[1] + tx * rho]); Bk.push([c[0] + ty * rho, c[1] - tx * rho]); }
  const cap = []; for (let k = 7; k >= 1; k--) { const t = Math.PI * k / 8; cap.push([Q[0][0] + rho * Math.cos(t), Q[0][1] + rho * .5 * Math.sin(t)]); }
  return [...isoUpTo(isoUntangle(Bk), X).reverse(), ...cap, ...isoUpTo(isoUntangle(A), X)];
}

// isoPlug(lc, o)
//   o.x, o.y：整图（插座面板 + 插头从躺着到插上的全部活动范围）投影包围盒的中心，默认 (960, 450)
//   o.s：上面那个包围盒的宽度（像素），默认 420；电线会向右伸出包围盒约 0.3 s 后截断（照原包伸出画框）
//   o.reach 0..1（0 躺在地上；0.85 差一点够到；0.9→1 插脚推进插孔）；o.p 画出进度；o.glow 0..1 插座周围黄色放射线
// 返回 { plug: 插头本体中心的板坐标, socket: 插座中心的板坐标 }
function isoPlug(lc, o = {}) {
  const { x = 960, y = 450, s = 420, reach = 0, p = 1, glow = 0 } = o;
  const D = ISO_P, G = D.G, C = isoCam(45, .5), P = isoPlace(C, D.ext, s, x, y), Pv = q => P(q[0], q[1], q[2]);
  const zf = Math.sqrt(1 - C.k * C.k), V3 = [Math.sin(C.az) * zf, Math.cos(C.az) * zf, C.k], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // reach 0..0.9 就是原包的 pull（0.85 差一点够到）；0.9..1 把剩下的弧线走完并沿 -x 把插脚推进去
  const rc = clamp(reach, 0, 1), ins = isoSS(isoWin(rc, .9, 1)), oo = isoPlugPose(rc <= .9 ? rc : lerp(.9, 1, ins));
  oo.c[0] -= ins * G.PL;
  // 墙上的插座面板
  const pW = isoWin(p, 0, .32), pS = isoWin(p, .22, .42);
  if (pW > 0) {
    const sil = isoHull(D.face.map(q => P(0, q.u, q.v)).concat(D.face.map(q => P(-G.PT, q.u, q.v))));
    const crease = isoRun(D.lip, q => q.nu * V3[1] + q.nv * V3[2] > 0).map(q => P(0, q.u, q.v));
    isoSolid(lc, { sil, crease }, { color: 'ink', w: 4, p: pW, seed: 300 });
  }
  if (pS > 0) {
    const gy = mix(CK.muted, CK.yellow, clamp(glow * 1.5, 0, 1));
    ckLine(lc, D.recess.map(q => P(0, q.u, G.ZC + q.v)), { color: gy, w: 3, p: pS, close: true, seed: 302 });
    for (const yy of [-G.HS, G.HS]) ckLine(lc, D.hole.map(q => P(0, yy + q.u, G.ZC + q.v)), { color: 'ink', w: 3, p: pS, close: true, seed: 303 + yy });
  }
  // 插上后：面板四周一圈黄色短放射线（墙面 x=0 平面里；先画，插头和电线会挡住它）
  const gl = clamp(glow, 0, 1) * (p >= 1 ? 1 : 0);
  if (gl > 0) for (let k = 0; k < 14; k++) {
    const a = k / 14 * TAU + .11, r0 = G.PH * 1.32 + 2.5 * hash(k, 331), r1 = r0 + (6 + 5 * hash(k, 332)) * gl;
    ckLine(lc, [P(0, Math.cos(a) * r0, G.ZC + Math.sin(a) * r0), P(0, Math.cos(a) * r1, G.ZC + Math.sin(a) * r1)], { color: 'yellow', w: 4, p: clamp(gl * 1.6 - k / 40, 0, 1), seed: 333 + k });
  }
  // 插头：插脚朝镜头时最后画插脚，背对时最先画
  const pinsFace = dot(oo.w, V3) > 0, vu = dot(oo.u, V3), dEnd = pinsFace ? 0 : -G.BL;
  const sweep = (parts, a0 = 0) => isoHull(parts.flatMap(([r, d]) => r.map(q => Pv(isoPlugAt(oo, a0 + q.u, q.v, d)))));
  // 插脚露在面板外的长度（推进时缩短）
  const vis = oo.w[0] < -.5 ? Math.min(G.PL, oo.c[0] / -oo.w[0]) : G.PL;
  const pB = isoWin(p, .4, .68), pP = isoWin(p, .55, .75), pC = isoWin(p, .55, 1);
  const parts = {
    cord: () => {
      if (pC <= 0) return;
      const t0 = isoPlugAt(oo, 0, 0, -G.BL - G.SL + 2), t1 = isoPlugAt(oo, 0, 0, -G.BL - G.SL - 26), Q = [];
      for (let i = 0; i <= 40; i++) Q.push(Pv(isoBez(t0, t1, D.bend, D.end, i / 40)));
      const tube = isoTube(Q, G.CR * C.S, x + D.edge * s);
      isoErase(lc, tube, pC * 2.5);
      ckLine(lc, tube, { color: 'ink', w: 3.5, p: pC, seed: 310, amp: .6 });
    },
    sleeve: () => { if (pB > 0) isoSolid(lc, { sil: sweep([[D.s0, -G.BL], [D.s1, -G.BL - G.SL]]) }, { color: 'ink', w: 3.5, p: pB, seed: 312 }); },
    body: () => {
      if (pB <= 0) return;
      const crease = isoRun(D.inner, q => q.nu * vu + q.nv * V3[2] > 0).map(q => Pv(isoPlugAt(oo, q.u, q.v, dEnd)));
      isoSolid(lc, { sil: sweep(D.shell), crease }, { color: 'ink', w: 4, p: pB, seed: 314 });
    },
    pins: () => {
      if (pP <= 0 || vis < .4) return;
      const prong = [[D.rod(0), 0], ...D.rounded(D.rod, G.PIN * .8 * Math.min(1, vis / G.PL), vis, -1)];
      const col = mix(CK.ink, CK.yellow, clamp(glow, 0, 1));
      for (const a of [-G.HS, G.HS]) isoSolid(lc, { sil: sweep(prong, a) }, { color: col, w: 3, p: pP, seed: 318 + a });
    },
  };
  for (const k of pinsFace ? ['cord', 'sleeve', 'body', 'pins'] : ['pins', 'body', 'cord', 'sleeve']) parts[k]();
  return { plug: Pv(oo.c), socket: P(0, 0, G.ZC) };
}

// ===================== 3. patch：一片回路的节律 =====================
// 原包：19 英寸 24 口配线架（两排 × 12 口，6 口一组），面板在 y∈[-T,0]，口朝 +y；21 个口插着带护套的水晶头，
// 上排线缆向上拱、下排向下垂（2、10、18 号口空着）。这里线缆末端按闭式正弦摆动。
const ISO_C = (() => {
  const G = { NC: 12, PITCH: 15, GAP: 8, EAR: 15, MAR: 5, H: 44, T: 2.6, DEEP: 18, ZT: 30, ZB: 12.5, JW: 5, JH: 4.2, NW: 1.9, NH: 1.7, JD: 2.4, PW: 4.3, PH: 3.5, PL: 4, BL: 5, CR: 1.8, OUT: 6, LEAN: 10, LZ: 7, LIFT: 9 };
  G.X0 = G.EAR + G.MAR; G.W = 2 * G.X0 + G.NC * G.PITCH + G.GAP;
  const EMPTY = [2, 10, 18], JIT = q => [q * 7 % 5 - 2, q * 11 % 7 - 3];
  const tipZ = G.ZT + 27 + G.LIFT + G.LZ, lowZ = G.ZB - 26 - G.LZ;
  const fitPts = [[0, -G.DEEP, G.H], [G.W, -G.DEEP, G.H], [0, 0, 0], [G.W, 0, 0], [G.X0, 34, tipZ], [G.W - G.X0, 34, lowZ], [G.X0, 34, lowZ]];
  const ports = [];
  for (let q = 0; q < 2 * G.NC; q++) { const r = q < G.NC ? 0 : 1, c = q % G.NC; ports.push({ q, r, c, cx: G.X0 + (c + .5) * G.PITCH + (c >= 6 ? G.GAP : 0), cz: r ? G.ZB : G.ZT, full: !EMPTY.includes(q), jit: JIT(q) }); }
  const order = ports.slice().sort((a, b) => a.c - b.c || a.r - b.r);
  const jack = isoFillet([[-G.JW, -G.JH], [G.JW, -G.JH], [G.JW, G.JH], [G.NW, G.JH], [G.NW, G.JH + G.NH], [-G.NW, G.JH + G.NH], [-G.NW, G.JH], [-G.JW, G.JH]], [1, 1, 1, .4, .5, .5, .4, 1]);
  const [br, bi] = isoRings(G.EAR + 2, -G.DEEP, G.W - G.EAR - 2, -G.T, 3, 1.6);
  const groups = [0, 6].map(m => { const a = ports[m].cx - G.PITCH / 2 + 1, b = ports[m + 5].cx + G.PITCH / 2 - 1; return isoRRect(a, G.ZB - G.JH - 3, b, G.ZT + G.JH + G.NH + 2.6, 2.4, 4).map(q => [q.u, q.v]); });
  const ears = []; for (const ex of [G.EAR / 2 + 1, G.W - G.EAR / 2 - 1]) for (const ez of [8, G.H - 8]) ears.push(isoRRect(ex - 3.4, ez - 1.5, ex + 3.4, ez + 1.5, 1.5, 3).map(q => [q.u, q.v]));
  // 每根线自己的摆动频率和相位（hash 按口号取）
  for (const pt of ports) { pt.f = .42 + .7 * hash(pt.q, 501); pt.ph = hash(pt.q, 502) * TAU; pt.amp = .55 + .45 * hash(pt.q, 503); pt.fz = .3 + .5 * hash(pt.q, 504); pt.phz = hash(pt.q, 505) * TAU; }
  return { G, ports, order, jack, br, bi, groups, ears, fitPts, panel: isoRRect(0, 0, G.W, G.H, 3, 4), panelIn: isoRRect(.7, .7, G.W - .7, G.H - .7, 2.3, 4),
    plug: isoRRect(-G.PW, -G.PH, G.PW, G.PH, 1.2, 3), plugIn: isoRRect(-G.PW + .7, -G.PH + .7, G.PW - .7, G.PH - .7, .6, 3), bootA: isoRRect(-3.7, -3, 3.7, 3, 1.6, 3), bootB: isoRRect(-2.4, -2.4, 2.4, 2.4, 2.3, 3) };
})();

// isoPatch(lc, o)
//   o.x, o.y：整图（机箱、面板、线缆摆动范围）投影包围盒的中心，默认 (960, 440)；o.s 包围盒宽度，默认 560
//   o.tau 时间（秒）；o.sync 0..1（0 各摆各的；1 全体同相 0.67 Hz）；o.p 画出进度；o.hi 同步后线缆颜色键（默认 'green'）
// 返回 { panel: 面板正面中心的板坐标 }
function isoPatch(lc, o = {}) {
  const { x = 960, y = 440, s = 560, tau = 0, sync = 0, p = 1, hi = 'green' } = o;
  const D = ISO_C, G = D.G, C = isoCam(45, .5), P = isoPlace(C, D.fitPts, s, x, y), front = isoFacing(C);
  const at = (ring, cx, yy, cz) => ring.map(q => P(cx + q.u, yy, cz + q.v));
  const seen = q => .612 * q.nu + .5 * q.nv > 0;
  const slab = (ring, inner, cx, cz, y0, y1) => ({ sil: isoHull(at(ring, cx, y0, cz).concat(at(ring, cx, y1, cz))), crease: inner ? at(isoRun(inner, seen), cx, y1, cz) : null });
  const face = pts => pts.map(([u, v]) => P(u, 0, v));
  // 机箱（面板后面）+ 面板
  const pK = isoWin(p, 0, .2), pF = isoWin(p, .08, .32), pE = isoWin(p, .22, .4);
  if (pK > 0) {
    const ch = isoPrism(P, front, D.br, D.bi, 3, G.H - 3);
    if (pK >= 1) isoHatch(lc, ch.sil, 'muted', { gap: 10, seed: 511 });
    isoSolid(lc, ch, { color: 'muted', w: 3, p: pK, seed: 510 });
  }
  if (pF > 0) isoSolid(lc, slab(D.panel, D.panelIn, 0, 0, -G.T, 0), { color: 'ink', w: 4, p: pF, seed: 512 });
  if (pE > 0) {
    D.ears.forEach((e, k) => ckLine(lc, face(e), { color: 'muted', w: 3, p: pE, close: true, seed: 520 + k }));
    D.groups.forEach((g, k) => ckLine(lc, face(g), { color: 'muted', w: 3, p: pE, close: true, seed: 526 + k }));
  }
  D.ports.forEach((pt, k) => {
    const pj = isoWin(p, .28 + .2 * k / 24, .36 + .2 * k / 24); if (pj <= 0) return;
    ckLine(lc, face(D.jack.map(([u, v]) => [pt.cx + u, pt.cz + v])), { color: pt.full ? 'muted' : 'ink', w: 3, p: pj, close: true, seed: 540 + k, amp: .5 });
  });
  // 摆动：tip 横向偏移 = 各自正弦 和 公共正弦 按 sync 混合（位置混合，避免改频率造成相位跳变）
  const wS = isoSS(clamp(sync, 0, 1)), thS = TAU * .67 * tau, cab = mix(CK.ink, ckColor(hi), wS);
  const n = D.order.length;
  D.order.forEach((pt, k) => {
    if (!pt.full) return;
    const pk = isoWin(p, .42 + .3 * k / n, .5 + .3 * k / n), pc = isoWin(p, .55 + .4 * k / n, .7 + .3 * k / n); if (pk <= 0) return;
    const { cx, cz, r, jit: [jx, jz] } = pt, kk = 0, y1 = G.PL + G.OUT * kk, y2 = y1 + G.BL, up = r ? -1 : 1;
    const A = 6.5;
    const lx = A * ((1 - wS) * pt.amp * Math.sin(TAU * pt.f * tau + pt.ph) + wS * Math.sin(thS));
    const lz = 1.6 * ((1 - wS) * Math.sin(TAU * pt.fz * tau + pt.phz) + wS * Math.cos(2 * thS) * .5);
    // 插头 + 护套
    isoSolid(lc, slab(D.plug, D.plugIn, cx, cz, 0, y1), { color: 'ink', w: 3, p: pk, seed: 600 + k * 4 });
    if (pk >= 1) ckLine(lc, [P(cx, .6, cz + G.PH), P(cx, y1 - .8, cz + G.PH)], { color: 'muted', w: 3, seed: 601 + k * 4 });
    isoSolid(lc, { sil: isoHull(at(D.bootA, cx, y1, cz).concat(at(D.bootB, cx, y2, cz))) }, { color: 'ink', w: 3, p: pk, seed: 602 + k * 4 });
    // 线缆：三次贝塞尔（原包的 p0..p3），末端 p3 摆动
    if (pc <= 0) return;
    const out = r ? 6 : 2, lean = r ? 2 : 3, p0 = [cx, y2 - 1.5, cz], p1 = r ? [cx + .5, y2 + out, cz] : [cx, y2 + 1, cz + 6];
    const p3 = [cx + lean + jx + lx, y2 + out + 1, cz + up * (24 + jz) + lz], p2 = [p3[0] - .6 - lx * .35, p3[1] - 1, p3[2] - up * 12];
    const q = []; for (let i = 0; i <= 16; i++) q.push(P(...isoBez(p0, p1, p2, p3, i / 16)));
    // 粗线当线缆（原包是细管轮廓；粉笔两条边会糊在一起，所以画成一笔粗线 + 端头一个小圈）
    lc.save(); lc.globalCompositeOperation = 'destination-out'; lc.globalAlpha = clamp(pc * 2.5, 0, 1); lc.lineWidth = G.CR * 2 * C.S + 4; lc.lineCap = 'round'; lc.lineJoin = 'round';
    lc.stroke(polyPath(q, false)); lc.restore();
    ckLine(lc, q, { color: cab, w: 5, p: pc, seed: 620 + k * 4, amp: .5 });
    if (pc >= 1) { const e = q[16]; ckLine(lc, ellPts(e[0], e[1], G.CR * C.S * 1.1, G.CR * C.S * .7, 12), { color: cab, w: 3, close: true, seed: 621 + k * 4 }); }
  });
  return { panel: P(G.W / 2, 0, G.H / 2) };
}

// ===================== 4. phosphor：一片会熄灭的活动 =====================
// 原包：7×7 点阵贴在一块悬浮的圆角方板上（下方一块底板，四角虚线连接），点有余辉。这里按要求放大成 18×11。
const ISO_F = (() => {
  const G = { NX: 18, NY: 11, PITCH: 10, M: 8, T: 5, R: 2.5, DROP: 15, BT: 4, BO: 7 };
  G.EX = G.M * 2 + G.PITCH * (G.NX - 1); G.EY = G.M * 2 + G.PITCH * (G.NY - 1); G.ZB = -G.DROP - G.BT;
  const [br, bi] = isoRings(-G.BO, -G.BO, G.EX + G.BO, G.EY + G.BO, 11, 1.8), [tr, ti] = isoRings(0, 0, G.EX, G.EY, 7, 1.3);
  const fitPts = [[-G.BO, -G.BO, G.ZB], [G.EX + G.BO, G.EY + G.BO, G.ZB - 6], [G.EX + G.BO, -G.BO, G.ZB], [-G.BO, G.EY + G.BO, G.ZB], [0, 0, G.T]];
  return { G, br, bi, tr, ti, fitPts, plate: isoRRect(3.5, 3.5, G.EX - 3.5, G.EY - 3.5, 4.5, 5) };
})();

// isoPhosphor(lc, o)
//   o.x, o.y：整图（底板 + 点阵板）投影包围盒的中心，默认 (960, 450)；o.s 包围盒宽度，默认 600
//   o.tau 时间；o.lit 0..1 整体亮度（0 只剩暗淡小点）；o.trail [[u, v, t0], ...] 光扫过的格坐标（u 0..17，v 0..10）和时刻；
//   o.decay 余辉时间常数（秒，默认 1.6）；o.p 画出进度
// 返回 { at: (u, v) => 该格点在板坐标的位置, glow: 被余辉点亮（> 0.5）的点数 }
function isoPhosphor(lc, o = {}) {
  const { x = 960, y = 450, s = 600, tau = 0, lit = 1, trail = null, decay = 1.6, p = 1 } = o;
  const D = ISO_F, G = D.G, C = isoCam(45, .5), P = isoPlace(C, D.fitPts, s, x, y), front = isoFacing(C);
  const pB = isoWin(p, 0, .22), pT = isoWin(p, .12, .38);
  if (pB > 0) {
    const bs = isoPrism(P, front, D.br, D.bi, G.ZB, -G.DROP);
    if (pB >= 1) isoHatch(lc, isoBand(P, front, D.br, G.ZB, -G.DROP), 'muted', { gap: 9, seed: 701 });
    isoSolid(lc, bs, { color: 'muted', w: 3, p: pB, seed: 700 });
    isoExtremes(P, D.tr).forEach((q, k) => ckLine(lc, [P(q.u, q.v, 0), P(q.u, q.v, -G.DROP)], { color: 'muted', w: 3, p: pB, dash: [3, 11], seed: 703 + k }));
  }
  if (pT > 0) {
    if (pT >= 1) isoHatch(lc, isoBand(P, front, D.tr, 0, G.T), 'muted', { gap: 8, seed: 711 });
    isoSolid(lc, isoPrism(P, front, D.tr, D.ti, 0, G.T), { color: 'ink', w: 4, p: pT, seed: 710 });
    ckLine(lc, isoRingAt(P, D.plate, G.T), { color: 'muted', w: 3, p: pT, close: true, seed: 712 });
  }
  // 余辉：只算已经发生的轨迹点，每点照亮周围约一格（原包 SPLASH：中心 1，上下左右 0.45）
  const NX = G.NX, NY = G.NY, I = new Float32Array(NX * NY);
  if (trail) for (const [u, v, t0] of trail) {
    if (t0 > tau) continue; const g = Math.exp(-(tau - t0) / Math.max(.05, decay)); if (g < .02) continue;
    for (let j = Math.max(0, Math.floor(v - 1.5)); j <= Math.min(NY - 1, Math.ceil(v + 1.5)); j++)
      for (let i = Math.max(0, Math.floor(u - 1.5)); i <= Math.min(NX - 1, Math.ceil(u + 1.5)); i++) {
        const d2 = (i - u) ** 2 + (j - v) ** 2, k = d2 < .3 ? 1 : Math.exp(-d2 / 1.25) * .9; const val = g * k; if (val > I[j * NX + i]) I[j * NX + i] = val;
      }
  }
  // 循环图案：一道慢慢流过的正弦亮带（闭式，跟原包 LOOP 的斜向扫波同方向）
  const L = clamp(lit, 0, 1); let glowN = 0;
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const idx = j * NX + i, pd = isoWin(p, .36 + .5 * idx / (NX * NY), .42 + .5 * idx / (NX * NY)); if (pd <= 0) continue;
    const band = Math.pow(.5 + .5 * Math.sin(TAU * ((i * .9 + j * 1.3) / 14 - tau * .32)), 3);
    const ib = L * (.18 + .82 * band), it = I[idx], q = P(G.M + i * G.PITCH, G.M + j * G.PITCH, G.T);
    if (it > .5) glowN++;
    if (it > ib && it > .04) {
      isoDisc(lc, C, q, G.R * 2.4, 'yellow', .2 * it * pd);
      isoDisc(lc, C, q, G.R * (1 + .5 * it) * pd, 'yellow', .4 + .6 * it);
    } else if (ib > .04) isoDisc(lc, C, q, G.R * (.8 + .5 * ib) * pd, 'ink', .25 + .75 * ib);
    else isoDisc(lc, C, q, G.R * .7 * pd, 'muted', .32);
  }
  return { at: (u, v) => P(G.M + u * G.PITCH, G.M + v * G.PITCH, G.T), glow: glowN };
}
