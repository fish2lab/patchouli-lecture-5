'use strict';
// 第 1 段：一颗见光就开的开关。上一段留下的白点长成一个单细胞绿藻，鞭毛摆动、朝右上的蓝色光源游；
// 标出眼点 → 镜头推近，放大圈里是细胞膜和镶在膜上的通道（两片门）→ 蓝光一到门打开、带正电的离子涌进来 →
// 觉报出发现者和名字 → 琪露诺问跟脑子有什么关系：问号连一条虚线指向右边空白。段末擦净，只留通道小图标（下一段装进神经元）。
// 顶层名字带 S1 / s1 前缀。
const S1LINES = seq(.8, [
  ['先说一种绿藻。它只有一个细胞，却会朝着光游。', { hold: .5 }],
  ['它连眼睛都没有吧？', { who: 'cirno', mood: 'confused', pause: .2 }],
  ['它有一个眼点。眼点上有一种通道，见光就打开。', { pause: .2, hold: .6 }],
  ['通道一开，带电的离子涌进来，细胞就知道：有光。', { pause: .2, hold: 1.2 }],
  ['二零零二年前后，内格尔和黑格曼证明了这件事。这个通道叫通道视紫红质。', { who: 'satori', pause: .3, hold: .9 }],
  ['藻类的开关，跟脑子有什么关系？', { who: 'cirno', mood: 'surprised', pause: .3, hold: .6 }],
]);
const s1T = i => S1LINES[i][0], s1E = i => S1LINES[i][1];
const S1DUR = s1E(5) + 1.6;

// 光源（右上）、细胞、放大圈（板坐标）
const S1SUN = [1290, 190];
const S1CELL = { rx: 104, ry: 62, rot: -.6 };
const S1MAG = { x: 720, y: 650, r: 165 };
const S1MEM = [622, 684];          // 放大圈里细胞膜的两条线（上 = 膜外，下 = 膜内）
const S1GAP = [690, 750];          // 通道在膜上的开口
const s1Open = tau => sm(s1T(3) + 1.0, s1T(3) + 1.5, tau, easeOutBack);

// 细胞的位置：从白点处出发，朝光源慢慢游（闭式，随鞭毛一拍一拍前冲）
function s1CellPos(tau) {
  const t0 = s1T(0) + .4, u = sm(t0, s1T(3), tau, t => t), surge = Math.sin(Math.max(0, tau - t0) * TAU * .9) * 3;
  const ca = Math.cos(S1CELL.rot), sa = Math.sin(S1CELL.rot), d = 85 * easeSine(u) + surge * u;
  return [CKB.cx + ca * d, CKB.cy + sa * d];
}
// 细胞局部坐标 → 板坐标
function s1Loc(pos, lx, ly) { const ca = Math.cos(S1CELL.rot), sa = Math.sin(S1CELL.rot); return [pos[0] + lx * ca - ly * sa, pos[1] + lx * sa + ly * ca]; }
const S1EYE = [24, 42];            // 眼点在细胞上的局部位置（靠前、下沿）

// 通道：两侧两块蛋白（粉笔轮廓 + 蓝 hatch），上口两片门，open 0 关 1 开（门向膜内翻下）
function s1Channel(lc, x0, x1, y0, y1, open, o = {}) {
  const { w = 4, s = 1, p = 1, seed = 1 } = o, bw = 26 * s, gw = x1 - x0, pad = 8 * s;
  ckShape(lc, rectPts(x0 - bw, y0 - pad, bw, y1 - y0 + pad * 2, 8 * s), { w, hatch: p >= 1 ? 'blue' : false, gap: 9 * s, p, seed });
  ckShape(lc, rectPts(x1, y0 - pad, bw, y1 - y0 + pad * 2, 8 * s), { w, hatch: p >= 1 ? 'blue' : false, gap: 9 * s, p, seed: seed + 1 });
  if (p < 1) return;
  const L = gw / 2 - 2 * s, a = open * 1.35;
  ckLine(lc, [[x0, y0], [x0 + Math.cos(a) * L, y0 + Math.sin(a) * L]], { color: 'yellow', w: w + 2.5, seed: seed + 2 });
  ckLine(lc, [[x1, y0], [x1 - Math.cos(a) * L, y0 + Math.sin(a) * L]], { color: 'yellow', w: w + 2.5, seed: seed + 3 });
}

// 离子：膜外散着，门开后依次从开口涌进膜内
const S1IONS = (() => { const r = rng(1101), out = [];
  for (let k = 0; k < 13; k++) out.push({ hx: 590 + r() * 260, hy: 520 + r() * 80, fx: 600 + r() * 240, fy: 715 + r() * 75, ph: r() * TAU, d: k * .2 + r() * .1 });
  return out.sort((a, b) => Math.abs(a.hx - 720) - Math.abs(b.hx - 720)).map((q, k) => ({ ...q, d: k * .2 })); })();
function s1Ion(lc, x, y, al = 1) {
  lc.save(); lc.globalAlpha = al; lc.strokeStyle = CK.ink; lc.lineWidth = 2.6; lc.beginPath(); lc.arc(x, y, 10, 0, TAU); lc.stroke();
  lc.beginPath(); lc.moveTo(x - 5.5, y); lc.lineTo(x + 5.5, y); lc.moveTo(x, y - 5.5); lc.lineTo(x, y + 5.5); lc.stroke(); lc.restore();
}

function s1Draw(c, tau, L) {
  ckRoom(c, tau);
  const zIn = s1T(2) + .3;
  const cam = ckCam(tau, [[0, CKB.cx, CKB.cy, 1], [zIn, CKB.cx, CKB.cy, 1], [zIn + 1.8, 880, 525, 1.06], [s1E(4) - .2, 880, 525, 1.06], [s1T(5) - .1, CKB.cx, CKB.cy, 1]]);
  let pen = null, outro = null;
  const pens = [];
  ckLayer(c, cam, lc => {
    // ---- 白点长成细胞 ----
    const g = sm(s1T(0) + .1, s1T(0) + 1.3, tau, easeOutBack), pos = s1CellPos(tau);
    if (g < .02) { lc.fillStyle = CK.ink; lc.beginPath(); lc.arc(CKB.cx, CKB.cy, 7, 0, TAU); lc.fill(); }
    else {
      const rx = lerp(7, S1CELL.rx, g), ry = lerp(7, S1CELL.ry, g), body = ellPts(pos[0], pos[1], rx, ry, 44, S1CELL.rot);
      ckShape(lc, body, { w: 5, hatch: g > .98 ? 'green' : false, gap: 12, seed: 1102 });
      if (g > .98) {
        // 细胞核
        const nc = s1Loc(pos, -28, -4); ckLine(lc, ellPts(nc[0], nc[1], 22, 18, 20, S1CELL.rot), { color: 'muted', w: 3, close: true, smooth: true, seed: 1103 });
        // 鞭毛：前端两根，闭式 sin 摆动（呼吸节奏）
        const k = sm(s1T(0) + 1.1, s1T(0) + 1.8, tau);
        for (const side of [-1, 1]) {
          const pts = [];
          for (let i = 0; i <= 14; i++) { const s = i / 14, ph = tau * TAU * .9 - s * 3.2;
            const lx = S1CELL.rx - 4 + s * 120, ly = side * (8 + s * 46 + Math.sin(ph) * 22 * s); pts.push(s1Loc(pos, lx, ly)); }
          ckLine(lc, pts, { w: 3, smooth: true, p: k, seed: 1104 + side });
        }
      }
    }
    // ---- 光源：右上一颗蓝色粉笔光，放射短线随时间起伏 ----
    const ls = sm(s1T(0) + 1.6, s1T(0) + 2.4, tau);
    if (ls > 0) {
      ckLine(lc, ellPts(S1SUN[0], S1SUN[1], 24, 24, 24), { color: 'blue', w: 5, close: true, smooth: true, p: ls, seed: 1110 });
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .2, r0 = 38, r1 = 62 + 8 * Math.sin(tau * 2.4 + i * 1.7);
        ckLine(lc, [[S1SUN[0] + Math.cos(a) * r0, S1SUN[1] + Math.sin(a) * r0], [S1SUN[0] + Math.cos(a) * r1, S1SUN[1] + Math.sin(a) * r1]], { color: 'blue', w: 4, p: clamp(ls * 2 - i / 9, 0, 1), seed: 1111 + i }); }
    }
    // ---- 第 2 句：眼点 ----
    const eye = s1Loc(pos, ...S1EYE), te = s1T(1) + .5, ek = sm(te, te + .4, tau, easeOutBack);
    if (ek > 0) {
      lc.fillStyle = CK.orange; lc.beginPath(); lc.arc(eye[0], eye[1], 9 * ek, 0, TAU); lc.fill();
      const lp = [1125, 505], wE = ckWrite(lc, tau, '眼点', lp[0], lp[1], te + .5, { size: 46, spc: .14 });
      ckLine(lc, [[eye[0] + 12, eye[1] + 12], [lp[0] - 8, lp[1] - 30]], { color: 'orange', w: 3, p: sm(te + .2, te + .6, tau), seed: 1120 });
      ckText(lc, '眼点', lp[0], lp[1], { size: 46, color: 'orange', p: wE.p }); pens.push(wE);
    }
    // ---- 第 3 句：放大圈（从眼点拉出两条线，圈里是细胞膜和通道） ----
    const tm = s1T(2) + .6, mk = sm(tm, tm + 1.2, tau);
    if (mk > 0) {
      const M = S1MAG;
      ckLine(lc, ellPts(eye[0], eye[1], 22, 22, 20), { color: 'muted', w: 3, close: true, smooth: true, p: mk, seed: 1130 });
      // 两条切线：从眼点小圈到放大圈
      const dx = M.x - eye[0], dy = M.y - eye[1], dl = Math.hypot(dx, dy), nx = -dy / dl, ny = dx / dl;
      for (const s of [-1, 1]) ckLine(lc, [[eye[0] + nx * 22 * s, eye[1] + ny * 22 * s], [M.x + nx * M.r * s, M.y + ny * M.r * s]], { color: 'muted', w: 2.5, dash: [10, 10], p: sm(tm + .2, tm + .9, tau), al: 1 - sm(s1T(4), s1T(4) + .6, tau), seed: 1131 + s });
      ckLine(lc, ellPts(M.x, M.y, M.r, M.r, 56), { color: 'ink', w: 5, close: true, smooth: true, p: sm(tm + .5, tm + 1.3, tau), seed: 1133 });
      // 圈内：两条平行膜线，中间开口镶通道
      const ik = sm(tm + 1.1, tm + 2.0, tau);
      lc.save(); lc.beginPath(); lc.arc(M.x, M.y, M.r - 6, 0, TAU); lc.clip();
      for (const y of S1MEM) {
        ckLine(lc, [[M.x - M.r, y], [S1GAP[0] - 26, y]], { color: 'muted', w: 4, p: ik, seed: 1134 + y });
        ckLine(lc, [[S1GAP[1] + 26, y], [M.x + M.r, y]], { color: 'muted', w: 4, p: ik, seed: 1135 + y });
      }
      const open = s1Open(tau);
      s1Channel(lc, S1GAP[0], S1GAP[1], S1MEM[0], S1MEM[1], open, { p: sm(tm + 1.6, tm + 2.3, tau), seed: 1140 });
      // ---- 第 4 句：蓝光射线到达（从右上进圈，落在通道口） ----
      const tl = s1T(3) + .2;
      for (let i = 0; i < 3; i++) { const a = [M.x + 150 + i * 22, M.y - 150 + i * 30], b = [S1GAP[0] + 40 + i * 8, S1MEM[0] - 18 - i * 4];
        ckArrow(lc, a, b, { color: 'blue', w: 4, head: 14, p: sm(tl + i * .12, tl + .7 + i * .12, tau), seed: 1150 + i }); }
      // 离子：膜外散着轻晃；门开后依次从开口涌进膜内
      const ti = s1T(3) + 1.3, ion = sm(s1T(3), s1T(3) + .5, tau);
      if (ion > 0) for (const q of S1IONS) {
        const u = clamp((tau - ti - q.d) / 1.1, 0, 1), jx = Math.sin(tau * 2.1 + q.ph) * 4, jy = Math.cos(tau * 1.7 + q.ph) * 3;
        let x, y;
        if (u <= 0) { x = q.hx + jx; y = q.hy + jy; }
        else if (u < .45) { const v = easeIn(u / .45); x = lerp(q.hx, 720, v); y = lerp(q.hy, S1MEM[0] - 6, v); }
        else if (u < .7) { const v = (u - .45) / .25; x = 720; y = lerp(S1MEM[0] - 6, S1MEM[1] + 12, v); }
        else { const v = easeOut((u - .7) / .3); x = lerp(720, q.fx, v) + jx * v; y = lerp(S1MEM[1] + 12, q.fy, v) + jy * v; }
        s1Ion(lc, x, y, ion);
      }
      lc.restore();
      // 「有光」
      const wL = ckWrite(lc, tau, '有光', 905, 560, s1T(3) + 2.4, { size: 54, spc: .16 });
      ckText(lc, '有光', 905, 560, { size: 54, color: 'yellow', p: wL.p }); pens.push(wL);
    }
    // ---- 第 5 句：名字和发现者 ----
    const tn = s1T(4) + 2.6, nm = '通道视紫红质';
    const wN = ckWrite(lc, tau, nm, 905, 715, tn, { size: 50, spc: .12 });
    ckText(lc, nm, 905, 715, { size: 50, color: 'yellow', p: wN.p }); pens.push(wN);
    ckUnderline(lc, nm, 905, 715, 50, 'yellow', sm(tn + .8, tn + 1.2, tau), 1160);
    const tw = s1T(4) + .5, wA = ckWrite(lc, tau, '内格尔 · 黑格曼', 910, 775, tw, { size: 34, spc: .1 }), wB = ckWrite(lc, tau, '2002–2003', 910, 818, tw + 1, { size: 34, spc: .08 });
    ckText(lc, '内格尔 · 黑格曼', 910, 775, { size: 34, color: 'muted', p: wA.p }); ckText(lc, '2002–2003', 910, 818, { size: 34, color: 'muted', p: wB.p }); pens.push(wA, wB);
    // ---- 第 6 句：粉色问号，虚线指向右边空白（下一段把通道装进神经元的地方） ----
    const tq = s1T(5) + .3, qk = sm(tq, tq + .4, tau, easeOutBack);
    if (qk > 0) {
      const wQ = ckWrite(lc, tau, '？', 895, 655, tq, { size: 60, spc: .3 });
      ckText(lc, '？', 895, 655, { size: 60, color: 'pink', heavy: true, p: wQ.p }); pens.push(wQ);
      const td = tq + .6, dk = sm(td, td + 1.0, tau);
      ckLine(lc, [[960, 632], [1185, 632]], { color: 'pink', w: 4, dash: [14, 12], p: dk, seed: 1170 });
      if (dk >= 1) ckLine(lc, ellPts(1205, 632, 16, 16, 18), { color: 'pink', w: 3.5, close: true, smooth: true, dash: [8, 8], p: sm(td + 1, td + 1.4, tau), seed: 1171 });
    }
    for (const w of pens) if (w.writing) pen = w;
    // ---- 段末：擦净，中央留通道小图标（约 60px，下一段的起点） ----
    outro = ogOutro(lc, tau, S1DUR, cam);
    if (tau > S1DUR - .5) { lc.save(); lc.globalAlpha = sm(S1DUR - .5, S1DUR - .2, tau);
      s1Channel(lc, CKB.cx - 12, CKB.cx + 12, CKB.cy - 16, CKB.cy + 16, 0, { w: 3.5, s: .8, seed: 1180 }); lc.restore(); }
  });
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau); ckDust(c, sp, tau, true, 1190); }
  ogEraser(c, cam, outro);
  // 人物
  ogPch(c, tau, L, { pose: (tau > s1T(0) && tau < s1T(0) + 3) || (tau > s1T(2) && tau < s1E(3)) ? 'point' : 'lecture', gesture: .6 });
  ogSat(c, tau, L, { pose: tau > s1T(4) && tau < s1E(4) + .4 ? 'point' : 'stand', gesture: .7, eyeLook: [-.7, .2] });
  ogCirno(c, tau, L, S1LINES);
}
scene({ order: 1, key: 'alga', title: '开关', dur: S1DUR, lines: S1LINES, fn: s1Draw });
