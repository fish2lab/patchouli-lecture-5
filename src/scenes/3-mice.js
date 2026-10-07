'use strict';
// 第 3 段：开灯，关灯。全片最热闹的一段，主物件是黑板中央偏左的一个粉笔大电灯开关（面板 + 拨杆 + 旁边一颗小灯泡），
// 拨上盖「开灯」、拨下盖「关灯」。右边一块小鼠速写区，每句换一个实验：猛吃 → 喝水 → 扑咬 → 琪露诺连拨三下（一动一停）
// → 假的恐惧（A、B 两个小房间）→ 觉：第三只眼对一束光。换实验时板擦擦掉上一个速写区。
// 段首：黑板中央约 60px 的拨杆小图标（上一段留下的）长成大开关；段末：擦净，留一个插头小图标（下一段的起点）。
// 顶层名字带 S3 / s3 前缀。
const S3LINES = seq(1.7, [
  ['那拨一下会怎样？', { who: 'cirno', mood: 'happy' }],
  ['点亮下丘脑里八百来个神经元，刚吃饱的小鼠又埋头猛吃。', { pause: .3, hold: 1.3 }],
  ['点亮另一群，不渴的小鼠跑去喝水。', { pause: .7, hold: 1.3 }],
  ['再换一处，小鼠会扑向眼前的任何东西，连没有生命的也咬。', { pause: .7, hold: 1.0 }],
  ['开灯就变，关灯就停？', { who: 'cirno', mood: 'surprised', pause: .2, hold: 1.2 }],
  ['还能改记忆。给小鼠造一段假的恐惧，它会害怕一个从没吃过苦头的地方。', { pause: .9, hold: 1.3 }],
  ['我读心靠第三只眼。他们靠一束光。', { who: 'satori', mood: 'smug', pause: .9, hold: 1.4 }],
]);
const s3T = i => S3LINES[i][0], s3E = i => S3LINES[i][1];
// 第 i 句念到 frac 处的时刻（不算 hold）
const s3At = (i, f) => s3T(i) + f * (s3E(i) - ((S3LINES[i][3] || {}).hold || 0) - s3T(i));
const S3DUR = s3E(6) + 1.6;
const s3seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

// ===================== 开关的拨动时刻（载入时排好的常量） =====================
// [时刻, 1 开 / 0 关]。第 5 句（琪露诺）里连拨三次，按这句的时长等分。
const S3EV = (() => {
  const ev = [];
  for (const i of [1, 2, 3]) { ev.push([s3T(i) + .55, 1]); ev.push([s3E(i) - .25, 0]); }
  const a = s3T(4), d = s3E(4) - a; for (let k = 0; k < 6; k++) ev.push([a + d * (.06 + k * .14), k % 2 ? 0 : 1]);
  ev.push([s3At(5, .36), 1]); ev.push([s3E(5) - .25, 0]);
  ev.push([s3At(6, .55), 1]);
  return ev.sort((p, q) => p[0] - q[0]);
})();
const S3RAPID = S3EV.filter(e => e[0] > s3T(4) && e[0] < s3E(4)).map(e => e[0]);
// 当前开关状态 0..1（0.1 秒拨过去）
function s3On(tau) { let v = 0; for (const [t, x] of S3EV) { if (tau < t) break; v = lerp(v, x, clamp((tau - t) / .1, 0, 1)); } return v; }
// 最近一次拨动的序号（-1 = 还没拨过）
function s3Last(tau) { let k = -1; S3EV.forEach((e, i) => { if (tau >= e[0]) k = i; }); return k; }
// 从 t0 到 tau 之间「开着」的累计秒数（闭式：逐段求交）
function s3OT(tau, t0) { let s = 0, on = false, st = 0;
  for (const [t, x] of S3EV) { if (x && !on) { on = true; st = t; } else if (!x && on) { on = false; s += Math.max(0, Math.min(tau, t) - Math.max(t0, st)); } }
  if (on) s += Math.max(0, tau - Math.max(t0, st));
  return s; }

// ===================== 位置 =====================
const S3SW = [680, 420];                 // 开关面板中心
const S3BULB = [690, 168];               // 小灯泡中心（开关正上方）
const S3STAMP = [680, 650];              // 印章
const S3R = [912, 92, 505, 552];         // 小鼠速写区（板擦擦的范围）
const S3G = 505;                         // 速写区地面线
const S3EYE3 = [1649, 601];              // 觉的第三只眼（标准站位、read 姿势时的屏幕坐标，实测）
// 速写区整体绕 S3KC 放大 S3K 倍（下面的速写坐标都是放大前的）
const S3K = 1.2, S3KC = [1150, 250];
const s3K = q => q && [S3KC[0] + (q[0] - S3KC[0]) * S3K, S3KC[1] + (q[1] - S3KC[1]) * S3K];

// ===================== 粉笔开关 =====================
// 局部坐标：面板中心 (0,0)，面板 150×230。phi 0 = 拨杆朝上（开），π = 朝下（关）
function s3Switch(lc, x, y, k, phi, p = 1) {
  lc.save(); lc.translate(x, y); lc.scale(k, k);
  ckShape(lc, rectPts(-75, -115, 150, 230, 18), { w: 5, p: s3seg(p, 0, .5), seed: 3301 });
  for (const sy of [-94, 94]) { ckLine(lc, circPts(0, sy, 7, 14), { color: 'muted', w: 3, close: true, p: s3seg(p, .4, .7), seed: 3302 + sy });
    ckLine(lc, [[-4, sy - 3], [4, sy + 3]], { color: 'muted', w: 2.4, p: s3seg(p, .6, .8), seed: 3304 + sy }); }
  ckShape(lc, rectPts(-26, -58, 52, 116, 12), { color: 'muted', w: 4, p: s3seg(p, .3, .7), seed: 3306 });
  const ey = -60 * Math.cos(phi), lp = s3seg(p, .6, 1);
  if (lp > 0) {
    const lever = [[-15, 0], [15, 0], [12, ey], [-12, ey]];
    ckShape(lc, lever, { w: 4.5, hatch: lp >= 1 && Math.abs(ey) > 12 ? 'ink' : false, gap: 9, p: lp, seed: 3307 });
    ckLine(lc, ellPts(0, ey, 17, 4 + 5 * Math.abs(Math.cos(phi)), 18), { w: 4.5, close: true, p: lp, seed: 3308 });
    ckLine(lc, circPts(0, 0, 5, 10), { color: 'muted', w: 3, close: true, p: lp, seed: 3309 });
  }
  lc.restore();
}
// 小灯泡 + 连到开关的电线。lit 0..1，color 'yellow' 或 'blue'
function s3Bulb(lc, lit, color, p = 1) {
  const [bx, by] = S3BULB;
  ckLine(lc, [[680, 305], [676, 268], [690, 224]], { color: 'muted', w: 3, smooth: true, p: s3seg(p, 0, .4), seed: 3311 });
  if (lit > 0 && p >= 1) { lc.save(); lc.globalAlpha = .22 * lit; lc.fillStyle = ckColor(color); lc.beginPath(); lc.arc(bx, by, 33, 0, TAU); lc.fill(); lc.restore(); }
  const glass = [[bx - 14, by + 30], [bx - 30, by + 12], [bx - 34, by - 8], [bx - 24, by - 28], [bx, by - 36], [bx + 24, by - 28], [bx + 34, by - 8], [bx + 30, by + 12], [bx + 14, by + 30]];
  ckLine(lc, glass, { color: 'muted', w: 4, smooth: true, p: s3seg(p, .3, .8), seed: 3312 });
  if (lit > 0) ckLine(lc, glass, { color, w: 4.5, smooth: true, al: lit, p: s3seg(p, .3, .8), seed: 3312 });
  ckShape(lc, rectPts(bx - 15, by + 32, 30, 22, 4), { color: 'muted', w: 3.5, p: s3seg(p, .6, 1), seed: 3313 });
  ckLine(lc, [[bx - 15, by + 43], [bx + 15, by + 43]], { color: 'muted', w: 2.5, p: s3seg(p, .7, 1), seed: 3314 });
  ckLine(lc, [[bx - 8, by + 30], [bx - 8, by + 4], [bx - 4, by - 6], [bx, by + 4], [bx + 4, by - 6], [bx + 8, by + 4], [bx + 8, by + 30]], { color: lit > .5 ? color : 'muted', w: 2.6, p: s3seg(p, .7, 1), seed: 3315 });
  if (lit > .05) for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + (k - 3.5) * .42, r0 = 46, r1 = 46 + 16 * lit;
    ckLine(lc, [[bx + Math.cos(a) * r0, by + Math.sin(a) * r0], [bx + Math.cos(a) * r1, by + Math.sin(a) * r1]], { color, w: 4, seed: 3320 + k }); }
}
// 印章：「开灯」yellow / 「关灯」muted，盖下去时从 1.35 倍缩回
function s3Stamp(lc, tau) {
  const k = s3Last(tau); if (k < 0) return;
  const [t, v] = S3EV[k], u = clamp((tau - t) / .16, 0, 1), sc = 1 + .35 * (1 - easeOut(u)), text = v ? '开灯' : '关灯', col = v ? 'yellow' : 'muted';
  lc.save(); lc.translate(S3STAMP[0], S3STAMP[1]); lc.rotate((hash(k, 3330) - .5) * .16); lc.scale(sc, sc); lc.globalAlpha = clamp(u * 4, 0, 1);
  const w = zhWidth(lc, text, 52) + 44;
  ckShape(lc, rectPts(-w / 2, -40, w, 80, 10), { color: col, w: 5, seed: 3331 + k });
  ckText(lc, text, 0, 18, { size: 52, color: col, heavy: true, align: 'center' });
  lc.restore();
}

// ===================== 粉笔小鼠 =====================
// 局部坐标：身体中心 (0,0)，脚底 y≈40，头朝 +x。o = { s 缩放, dir 1 朝右, hr 低头（弧度，负 = 抬头）, lean 身体前倾, p 画出进度, tongue 0..1 }
const S3BODY = spline([[-62, 8], [-56, -18], [-30, -36], [8, -38], [40, -26], [58, -6], [54, 16], [30, 30], [-10, 33], [-48, 26]], 5, true);
const S3HEAD = spline([[34, -24], [54, -40], [80, -36], [100, -18], [110, -6], [100, 4], [78, 10], [50, 9], [36, -4]], 5, true);
const S3TAIL = spline([[-60, 12], [-90, 26], [-118, 12], [-136, -8], [-152, -2]], 5);
function s3Mouse(lc, x, y, o = {}) {
  const { s = 1, dir = 1, hr = 0, lean = 0, p = 1, tongue = 0, seed = 0 } = o;
  const ch = Math.cos(hr), sh = Math.sin(hr), R = ([px, py]) => { const dx = px - 46, dy = py + 14; return [46 + dx * ch - dy * sh, -14 + dx * sh + dy * ch]; };
  lc.save(); lc.translate(x, y); lc.scale(dir * s, s); lc.rotate(lean);
  ckLine(lc, S3TAIL, { w: 3.5, smooth: true, p: s3seg(p, .5, .9), seed: 3340 + seed });
  ckLine(lc, [[-30, 30], [-34, 41], [-22, 41]], { w: 3.5, p: s3seg(p, .4, .6), seed: 3341 });
  ckLine(lc, [[22, 28], [20, 41], [32, 41]], { w: 3.5, p: s3seg(p, .4, .6), seed: 3342 });
  ckShape(lc, S3BODY, { w: 4.5, hatch: p >= 1 ? 'muted' : false, gap: 15, p: s3seg(p, 0, .4), seed: 3343 + seed });
  const ear = R([60, -42]);
  ckLine(lc, circPts(ear[0], ear[1], 17, 18), { w: 4, close: true, p: s3seg(p, .45, .7), seed: 3344 });
  if (p >= .7) ckLine(lc, circPts(ear[0] + 1, ear[1], 7, 12), { color: 'pink', w: 3, close: true, seed: 3345 });
  const head = S3HEAD.map(R);
  if (p > .25) { lc.save(); lc.globalCompositeOperation = 'destination-out'; lc.fillStyle = '#000'; lc.fill(polyPath(head)); lc.restore(); }
  ckShape(lc, head, { w: 4.5, p: s3seg(p, .25, .6), seed: 3346 });
  if (p >= .65) {
    const e = R([84, -19]), n = R([110, -6]), b = R([90, 0]);
    lc.fillStyle = CK.ink; lc.beginPath(); lc.arc(e[0], e[1], 5, 0, TAU); lc.fill();
    lc.fillStyle = CK.pink; lc.beginPath(); lc.arc(n[0], n[1], 4.5, 0, TAU); lc.fill();
    lc.save(); lc.globalAlpha = .55; lc.beginPath(); lc.arc(b[0], b[1], 5.5, 0, TAU); lc.fill(); lc.restore();
    for (const [wx, wy] of [[130, -14], [132, -3], [128, 8]]) ckLine(lc, [R([104, -3]), R([wx, wy])], { color: 'muted', w: 2.2, seed: 3347 + wy });
    if (tongue > .05) ckLine(lc, [R([106, 2]), R([106 + 12 * tongue, 2 - 6 * tongue])], { color: 'pink', w: 5, seed: 3349 });
  }
  lc.restore();
}

// ===================== 五个速写 =====================
// 猛吃：面前一堆饲料小方块，开着就一块块变少
const S3FOOD = (() => { const out = []; for (let row = 3; row >= 0; row--) for (let k = 0; k <= 3 - row; k++) out.push([1212 + row * 11 + k * 22, S3G - 22 - row * 22]); return out.reverse(); })();
function s3Eat(lc, tau, t0) {
  const on = s3On(tau), ot = s3OT(tau, t0), eaten = Math.min(S3FOOD.length - 1, Math.floor(ot * 1.8));
  const chew = on * (.42 + .2 * Math.sin(tau * 22));
  s3Mouse(lc, 1080, S3G - 40, { hr: tau < t0 ? .05 * Math.sin(tau * 3) : chew, p: s3seg(tau, s3T(0) + .2, s3T(0) + 1.2) });
  const pf = s3seg(tau, t0, t0 + .5);
  S3FOOD.forEach(([x, y], i) => { if (i < eaten || pf <= i / S3FOOD.length) return; ckShape(lc, rectPts(x, y, 19, 19, 3), { color: 'muted', w: 3.2, seed: 3350 + i }); });
  if (on > .5) for (let k = 0; k < 4; k++) { const id = Math.floor(tau * 8) + k, a = hash(id, 3360) * 2.4 - 2.6, r = 10 + 26 * ((tau * 8 + k * .25) % 1);
    lc.fillStyle = CK.muted; lc.fillRect(1192 + Math.cos(a) * r, 490 + Math.sin(a) * r, 4, 4); }
}
// 喝水：倒挂的水瓶，开着就舔，蓝色水点往下滴、瓶里冒泡、水位降
function s3Drink(lc, tau, t0) {
  const on = s3On(tau), ot = s3OT(tau, t0), lick = on * Math.max(0, Math.sin(tau * 15));
  s3Mouse(lc, 1080, S3G - 40, { hr: -.4 - .08 * lick, tongue: lick, p: s3seg(tau, t0, t0 + .7) });
  const pb = s3seg(tau, t0 + .3, t0 + 1), lv = 196 + Math.min(70, ot * 13);
  if (pb >= 1) ckShape(lc, rectPts(1256, lv, 72, 334 - lv, 8), { color: 'blue', w: 2, hatch: 'blue', gap: 12, al: .7, seed: 3370 });
  ckShape(lc, rectPts(1250, 168, 84, 172, 14), { w: 4.5, p: pb, seed: 3371 });
  ckShape(lc, rectPts(1270, 340, 44, 18, 4), { color: 'muted', w: 4, p: pb, seed: 3372 });
  ckLine(lc, [[1292, 358], [1250, 390], [1200, 424]], { w: 6, smooth: true, p: pb, seed: 3373 });
  if (on > .3) { for (let k = 0; k < 3; k++) { const ph = (ot * 2.4 + k / 3) % 1;
      lc.fillStyle = CK.blue; lc.globalAlpha = Math.sin(ph * Math.PI); lc.beginPath(); lc.arc(1196 - ph * 6, 428 + ph * 34, 4.5 - ph * 1.5, 0, TAU); lc.fill(); }
    for (let k = 0; k < 3; k++) { const ph = (ot * 1.3 + k / 3) % 1; lc.globalAlpha = Math.sin(ph * Math.PI) * .9; lc.strokeStyle = CK.blue; lc.lineWidth = 2.4;
      lc.beginPath(); lc.arc(1280 + k * 14, 330 - ph * (330 - lv - 12), 5, 0, TAU); lc.stroke(); }
    lc.globalAlpha = 1; }
}
// 扑咬：小鼠扑向一团纸，开着就扑，关了就定在原地
function s3Pounce(lc, tau, t0) {
  const on = s3On(tau), ot = s3OT(tau, t0), ph = (ot * 1.5) % 1;
  const b = ph < .35 ? easeOut(ph / .35) : 1 - easeIO((ph - .35) / .65), mx = 1045 + 120 * b, my = S3G - 100;   // 比地面高 60：琪露诺冒头时纸团不被挡
  const p = s3seg(tau, t0, t0 + .7);
  // 加速度线
  if (on > .5 && ph < .35 && ph > .08) for (let k = 0; k < 3; k++) ckLine(lc, [[mx - 190 + k * 8, my - 30 + k * 20], [mx - 145 + k * 4, my - 30 + k * 20]], { color: 'muted', w: 3.5, seed: 3380 + k });
  s3Mouse(lc, mx, my - 18 * Math.sin(Math.min(1, b) * Math.PI), { s: .85, hr: .18 * b, lean: -.12 * b, p });
  // 纸团
  const hit = clamp((b - .82) / .18, 0, 1), bx = 1270 + 9 * hit, by = my + 13, br = s3seg(tau, t0 + .3, t0 + .9);
  lc.save(); lc.translate(bx, by); lc.rotate(hit * .3);
  const ball = []; for (let k = 0; k < 11; k++) { const a = k / 11 * TAU, r = 27 * (.82 + .3 * hash(k, 3385)); ball.push([Math.cos(a) * r, Math.sin(a) * r]); }
  ckShape(lc, ball, { w: 4.5, p: br, seed: 3386 });
  if (br >= 1) { ckLine(lc, [[-14, -8], [-2, 2], [-6, 14]], { color: 'muted', w: 2.6, seed: 3387 }); ckLine(lc, [[4, -16], [8, -2], [18, 4]], { color: 'muted', w: 2.6, seed: 3388 }); }
  lc.restore();
  if (on > .5) ckText(lc, '!', mx + 60, my - 58 - 14 * b, { size: 70, color: 'pink', heavy: true, align: 'center' });
}
// 假的恐惧：A、B 两个小房间。B 里有电击（粉色闪电），小鼠待在 A 里发抖；A 下面写「从没吃过苦头」
function s3Fear(lc, tau, t0) {
  const on = s3On(tau), pr = s3seg(tau, t0, t0 + .8);
  ckShape(lc, rectPts(965, 232, 190, 228, 6), { w: 4.5, p: pr, seed: 3390 });
  ckShape(lc, rectPts(1195, 232, 190, 228, 6), { w: 4.5, p: pr, seed: 3391 });
  ckText(lc, 'A', 983, 282, { size: 42, color: 'muted', p: s3seg(tau, t0 + .5, t0 + .8) });
  ckText(lc, 'B', 1213, 282, { size: 42, color: 'muted', p: s3seg(tau, t0 + .5, t0 + .8) });
  const tz = s3At(5, .36);
  if (tau > tz) { const fl = .55 + .45 * Math.abs(Math.sin((tau - tz) * 9));
    ckLine(lc, [[1306, 292], [1276, 350], [1302, 350], [1272, 414]], { color: 'pink', w: 6, p: s3seg(tau, tz, tz + .3), al: fl, seed: 3392 });
    ckLine(lc, [[1268, 400], [1272, 414], [1286, 406]], { color: 'pink', w: 6, p: s3seg(tau, tz + .25, tz + .4), al: fl, seed: 3393 }); }
  const sh = on * (hash(Math.floor(tau * 20), 3394) - .5) * 8;
  s3Mouse(lc, 1068 + sh, 430, { s: .62, hr: .12, p: s3seg(tau, t0 + .3, t0 + 1.1), seed: 7 });
  if (on > .5) {
    const fl = Math.floor(tau * 10) % 2;
    for (const [cx, sg] of [[985, -1], [1150, 1]]) for (let k = 0; k < 2; k++) {
      const r = 14 + k * 10 + fl * 3, pts = []; for (let j = 0; j <= 8; j++) { const a = (j / 8 - .5) * 1.4; pts.push([cx + sg * (Math.cos(a) * r - 10), 418 + Math.sin(a) * r]); }
      ckLine(lc, pts, { color: 'muted', w: 3, seed: 3395 + k + sg }); }
    for (let k = 0; k < 2; k++) { const ph = (tau * 1.4 + k * .5) % 1, x = 1120 + k * 16, y = 372 + k * 12 + ph * 22;
      lc.save(); lc.globalAlpha = Math.sin(ph * Math.PI); lc.fillStyle = CK.blue; lc.beginPath(); lc.moveTo(x, y - 12); lc.quadraticCurveTo(x + 7, y - 2, x + 6, y + 3); lc.arc(x, y + 3, 6, 0, Math.PI); lc.quadraticCurveTo(x - 7, y - 2, x, y - 12); lc.fill(); lc.restore(); }
  }
}
// 一束光：灯泡发出一道蓝光，和觉的第三只眼之间一条虚线
function s3Beam(lc, tau) {
  const [bx, by] = S3BULB, dx = S3EYE3[0] - bx, dy = S3EYE3[1] - by, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const tb = s3At(6, .55), g = s3seg(tau, tb, tb + .5), len = 300 * easeOut(g);
  if (g > 0) { const a0 = Math.atan2(uy, ux), sp = .15, r0 = 44;
    const P0 = [bx + ux * r0, by + uy * r0], e1 = [bx + Math.cos(a0 - sp) * (r0 + len), by + Math.sin(a0 - sp) * (r0 + len)], e2 = [bx + Math.cos(a0 + sp) * (r0 + len), by + Math.sin(a0 + sp) * (r0 + len)];
    lc.save(); lc.globalAlpha = .16; lc.fillStyle = CK.blue; lc.beginPath(); lc.moveTo(P0[0], P0[1]); lc.lineTo(e1[0], e1[1]); lc.lineTo(e2[0], e2[1]); lc.closePath(); lc.fill(); lc.restore();
    ckLine(lc, [P0, e1], { color: 'blue', w: 4, seed: 3400 }); ckLine(lc, [P0, e2], { color: 'blue', w: 4, seed: 3401 });
    for (let k = 0; k < 3; k++) { const a = a0 + (k - 1) * .07, f = .35 + .65 * ((tau * 1.6 + k * .37) % 1);
      ckLine(lc, [[bx + Math.cos(a) * (r0 + len * (f - .3)), by + Math.sin(a) * (r0 + len * (f - .3))], [bx + Math.cos(a) * (r0 + len * f), by + Math.sin(a) * (r0 + len * f)]], { color: 'blue', w: 3, al: .8, seed: 3402 + k }); } }
  const td = s3E(6) - 1.4;
  ckLine(lc, [[bx + ux * 44, by + uy * 44], [S3EYE3[0] - ux * 26, S3EYE3[1] - uy * 26]], { color: 'muted', w: 3.5, dash: [14, 14], p: s3seg(tau, td, td + .8), seed: 3405 });
}

function s3Draw(c, tau, L) {
  ckRoom(c, tau);
  // 第 5 句连拨三下：每拨一下镜头往里顶一点
  let z = 1; for (const t of S3RAPID) if (tau > t) z += .028 * Math.exp(-(tau - t) * 7);
  const cam = { x: CKB.cx, y: CKB.cy, z: Math.min(1.06, z) };
  let pen = null, outro = null, er = null;
  ckLayer(c, cam, lc => {
    let inK = false;
    const wr = (text, x, y, t0, o = {}) => { const w = ckWrite(lc, tau, text, x, y, t0, { size: o.size, spc: o.spc ?? .08 });
      ckText(lc, text, x, y, { size: o.size, color: o.color, p: w.p, heavy: o.heavy }); if (w.writing) pen = inK ? { head: s3K(w.head) } : w; return w; };
    // 主物件：拨杆小图标（段首在黑板中央）长成大开关
    const g = sm(.6, 1.6, tau), sx = lerp(CKB.cx, S3SW[0], g), sy = lerp(CKB.cy, S3SW[1], g), k = lerp(.27, 1, g);
    const on = s3On(tau);
    s3Switch(lc, sx, sy, k, Math.PI * (1 - on));
    const blue = tau > s3T(6);
    if (tau > 1.4) s3Bulb(lc, on, blue ? 'blue' : 'yellow', s3seg(tau, 1.4, 2.2));
    s3Stamp(lc, tau);
    // 速写区：每段速写画到下一次擦完为止；擦的时候板擦清掉上一个实验
    const ers = [2, 3, 5, 6].map(i => [s3T(i) - .8, s3T(i) - .1]);
    const erase = ([a, b]) => { if (tau > a && tau < b) er = s3K(ckErase(lc, S3R, sm(a, b, tau, t => t))); };
    lc.save(); lc.translate(S3KC[0], S3KC[1]); lc.scale(S3K, S3K); lc.translate(-S3KC[0], -S3KC[1]); inK = true;
    if (tau < ers[0][1]) {
      s3Eat(lc, tau, s3T(1));
      wr('弓状核 · 约 800 个神经元', 932, 604, s3At(1, .18), { size: 34, color: 'muted', spc: .05 });
      wr('猛吃', 940, 160, s3At(1, .86), { size: 56, color: 'yellow', heavy: true });
    }
    erase(ers[0]);
    if (tau > ers[0][1] && tau < ers[1][1]) { s3Drink(lc, tau, s3T(2)); wr('喝水', 940, 160, s3At(2, .82), { size: 56, color: 'yellow', heavy: true }); }
    erase(ers[1]);
    if (tau > ers[1][1] && tau < ers[2][1]) { s3Pounce(lc, tau, s3T(3)); wr('扑咬', 940, 160, s3At(3, .3), { size: 56, color: 'yellow', heavy: true }); }
    erase(ers[2]);
    if (tau > ers[2][1] && tau < ers[3][1]) { s3Fear(lc, tau, s3T(5));
      wr('假的恐惧', 940, 160, s3At(5, .36), { size: 56, color: 'pink', heavy: true });
      wr('从没吃过苦头', 965, 510, s3At(5, .72), { size: 32, color: 'muted', spc: .07 }); }
    erase(ers[3]);
    lc.restore(); inK = false;
    if (tau > ers[3][1]) { s3Beam(lc, tau);
      wr('第三只眼', 1262, 404, s3At(6, .2), { size: 46, color: 'pink' });
      wr('一束光', 860, 205, s3At(6, .62), { size: 46, color: 'blue' }); }
    // 段末：擦净，留一个插头小图标（下一段的起点）
    outro = ogOutro(lc, tau, S3DUR, cam);
    if (tau > S3DUR - .5) { const a = sm(S3DUR - .5, S3DUR - .2, tau), [px, py] = [CKB.cx, CKB.cy];
      ckShape(lc, rectPts(px - 16, py - 12, 32, 30, 6), { w: 4, p: a, seed: 3410 });
      ckLine(lc, [[px - 7, py - 12], [px - 7, py - 30]], { w: 4, p: a, seed: 3411 }); ckLine(lc, [[px + 7, py - 12], [px + 7, py - 30]], { w: 4, p: a, seed: 3412 });
      ckLine(lc, [[px, py + 18], [px + 8, py + 32], [px - 4, py + 44]], { color: 'muted', w: 3.5, smooth: true, p: a, seed: 3413 }); }
  });
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau); ckDust(c, sp, tau, true, 3420); }
  ogEraser(c, cam, er);
  ogEraser(c, cam, outro);
  // 人物
  const pt = [1, 2, 3, 5].some(i => tau > s3T(i) && tau < s3E(i));
  ogPch(c, tau, L, { pose: pt ? 'point' : 'lecture', gesture: .6 });
  const rd = tau > s3T(6) - .3;
  ogSat(c, tau, L, { pose: rd ? 'read' : 'stand', read: rd ? sm(s3T(6) - .3, s3T(6) + .3, tau) : 0, eye3: 1, eyeLook: rd ? [.9, -.5] : [.3, .1] });
  ogCirno(c, tau, L, S3LINES);
}
scene({ order: 3, key: 'mice', title: '开灯关灯', dur: S3DUR, lines: S3LINES, fn: s3Draw });
