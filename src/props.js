'use strict';
// 本集共用的站位和道具（主会话维护；各段只调用，不改）。
//   OG    三人的标准站位：段首段末三人在这里（琪露诺段首段末不在画面里）。
//   帕秋莉站在黑板左侧，古明地觉站在右侧；琪露诺只在自己说话时从右下角冒出来，说完缩回去（ogCirno）。
//   内容区（板坐标 = 屏幕坐标时）：x 500–1400，y 70–860；琪露诺冒头的地方 x > 1220 且 y > 540，她说话时那里不放东西。
const OG = {
  pch: { x: 300, y: 880, h: 500 },
  sat: { x: 1670, y: 880, h: 500, facing: -1 },
  cir: { x: 1390, y: 1010, h: 500, facing: -1 },   // 脚底在画面外，只露上半身
};
// 古明地觉还没接进来时用蕾米莉亚占位（satori.js 合并后自动用真的）
const ogSatoriFn = () => (typeof drawSatori === 'function' ? drawSatori : drawRemilia);

// ogPch / ogSat：标准站位的两人，嘴型、表情、眨眼自动从当前台词取。o 覆盖参数
function ogPch(c, tau, L, o = {}) { return drawPatchouli(c, { ...OG.pch, pose: 'lecture', mood: moodOf(L, 'patchouli', 'normal'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau, ...o }); }
function ogSat(c, tau, L, o = {}) { return ogSatoriFn()(c, { ...OG.sat, pose: 'stand', mood: moodOf(L, 'satori', 'normal'), mouth: mouthOf(L, 'satori'), blink: blinkAt(tau, 3), t: tau, ...o }); }
// ogCirno：琪露诺从右下角冒出来。lines 是本段台词，她的每句前 0.35 秒升起、句末 0.4 秒后缩回；
// 相邻两句间隔小于 1.2 秒就不缩回。返回升起程度 0..1（0 时不画）。
function ogCirnoUp(tau, lines) {
  let k = 0;
  for (let i = 0; i < lines.length; i++) { const l = lines[i]; if ((l[3] || {}).who !== 'cirno') continue;
    k = Math.max(k, Math.min(sm(l[0] - .35, l[0], tau, easeOutBack), 1 - sm(l[1] + .4, l[1] + .75, tau))); }
  return k;
}
function ogCirno(c, tau, L, lines, o = {}) {
  const k = ogCirnoUp(tau, lines); if (k <= .001) return 0;
  c.save(); c.beginPath(); c.rect(0, 0, W, 892); c.clip();   // 地板线以下不画（她从黑板槽后面冒出来）
  drawCirno(c, { ...OG.cir, y: OG.cir.y + (1 - k) * 420, pose: 'point', gesture: .4, mood: moodOf(L, 'cirno', 'normal'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau, ...o });
  c.restore(); return k;
}
// ogOutro：段末用板擦把整块黑板擦干净（在 ckLayer 里调用；返回板擦位置，交给 ogEraser 画）。
//   dur 段长；擦在段末前 1.25 秒到 0.25 秒之间，最后 0.25 秒是干净黑板（段间交接画面）。
const OG_ALL = [CKB.x - 400, CKB.y - 40, CKB.w + 800, CKB.h + 80];
function ogOutro(lc, tau, dur, cam) { cam = cam || CKCAM0;
  const r = [cam.x - CKB.w / 2 / cam.z - 40, cam.y - CKB.h / 2 / cam.z - 30, CKB.w / cam.z + 80, CKB.h / cam.z + 60];
  return ckErase(lc, r, sm(dur - 1.25, dur - .25, tau, t => t)); }
function ogEraser(c, cam, pos) { if (!pos) return; const [x, y] = ckToScreen(cam, pos[0], pos[1]); ckEraser(c, x, y, -.08, 1.25); }
