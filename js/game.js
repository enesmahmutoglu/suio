// ============================================================
// Piksel fok balığı — gökten düşen balıkları yakala!
// Her şey el yapımı piksel; kütüphane yok.
// ============================================================

import { SEAL, SEAL_PAL, SEAL_BLINK } from "./seal.js";

const TARGET = 25; // kazanmak için gereken skor

// Balık bitmap (10x6). 'x' gövde rengi değişir.
const FISH = [
  "..oooo....",
  ".oxxxxo..o",
  "oxxexxoooo",
  "oxxxxxoooo",
  ".oxxxxo..o",
  "..oooo....",
];
const FISH_PAL_BASE = { o: "#2f3b45", e: "#12202a" };
const FISH_COLORS = ["#ff8c42", "#ffd23f", "#22a699", "#ff6b6b", "#c084fc", "#5ec2e8"];

// Mayın / kaçınılması gereken (9x9)
const MINE = [
  "....d....",
  "d..kkk..d",
  ".dkkkkkd.",
  "..kkrkk..",
  "dkkrrrkkd",
  "..kkrkk..",
  ".dkkkkkd.",
  "d..kkk..d",
  "....d....",
];
const MINE_PAL = { k: "#3a3a44", d: "#20202a", r: "#ff4d4d" };

const PU = 2; // piksel birimi (canvas pikseli / hücre)

function bitmapWidth(map) { return map[0].length * PU; }
function bitmapHeight(map) { return map.length * PU; }

function drawBitmap(ctx, map, pal, ox, oy) {
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === "." || c === " ") continue;
      const color = pal[c];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * PU, oy + y * PU, PU, PU);
    }
  }
}

// ---- Zorluk kademeleri ----
function difficultyFor(score) {
  if (score < 7)  return { level: 1, label: "Kolay",     base: 0.55, spawn: 1000, bomb: 0.0,  multi: 0 };
  if (score < 14) return { level: 2, label: "Orta",      base: 0.80, spawn: 820,  bomb: 0.12, multi: 0 };
  if (score < 21) return { level: 3, label: "Hafif Zor", base: 1.05, spawn: 680,  bomb: 0.20, multi: 0.25 };
  return           { level: 4, label: "Zor",       base: 1.35, spawn: 560,  bomb: 0.28, multi: 0.4 };
}

// ---- Basit ses efektleri (WebAudio) ----
let actx = null;
function beep(freq, dur = 0.08, type = "square", vol = 0.05) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(actx.destination);
    const t = actx.currentTime;
    o.start(t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.stop(t + dur);
  } catch {}
}

export function createGame(canvas, { onUpdate, onWin }) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const W = canvas.width;   // 200
  const H = canvas.height;  // 150
  const GROUND = H - 22;    // kumun üstü

  const sealW = bitmapWidth(SEAL);
  const sealH = bitmapHeight(SEAL);
  const sealY = H - sealH - 4;

  let state, raf, lastT, spawnAcc, running;
  const keys = { left: false, right: false };
  let pointerX = null;

  function reset() {
    state = {
      sealX: (W - sealW) / 2,
      sealVX: 0,
      score: 0,
      caught: 0,
      lives: 3,
      items: [],        // {x,y,vy,type:'fish'|'mine',color,map,pal,w,h,wobble}
      blink: 0,
      splash: [],       // yakalama parçacıkları
      toast: null,      // {text,t}
      shake: 0,
    };
    spawnAcc = 0;
    emitUpdate();
  }

  function emitUpdate() {
    const d = difficultyFor(state.score);
    onUpdate?.({ score: state.score, lives: state.lives, level: d.level, label: d.label });
  }

  // ---- Girdi ----
  function onKey(e, down) {
    const k = e.key.toLowerCase();
    if (k === "arrowleft" || k === "a") { keys.left = down; e.preventDefault(); }
    else if (k === "arrowright" || k === "d") { keys.right = down; e.preventDefault(); }
  }
  const kd = (e) => onKey(e, true);
  const ku = (e) => onKey(e, false);

  function pointerToCanvasX(clientX) {
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * W;
  }
  const pd = (e) => { pointerX = pointerToCanvasX(e.clientX); canvas.setPointerCapture?.(e.pointerId); };
  const pm = (e) => { if (pointerX !== null || e.pressure > 0 || e.buttons) pointerX = pointerToCanvasX(e.clientX); };
  const pu = () => { pointerX = null; };

  // ---- Spawn ----
  function spawn() {
    const d = difficultyFor(state.score);
    const isMine = Math.random() < d.bomb;
    const map = isMine ? MINE : FISH;
    const w = bitmapWidth(map), h = bitmapHeight(map);
    const color = FISH_COLORS[(Math.random() * FISH_COLORS.length) | 0];
    const boost = 1 + state.caught * 0.015; // her yakalamada biraz hızlan
    const vy = d.base * boost * (0.85 + Math.random() * 0.4);
    state.items.push({
      x: 6 + Math.random() * (W - w - 12),
      y: -h,
      vy,
      type: isMine ? "mine" : "fish",
      color,
      map,
      w, h,
      wob: Math.random() * Math.PI * 2,
      wobAmp: isMine ? 0 : 0.3 + Math.random() * 0.5,
    });
  }

  function addSplash(cx, cy, color) {
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 + Math.random();
      state.splash.push({
        x: cx, y: cy,
        vx: Math.cos(a) * (0.6 + Math.random()),
        vy: Math.sin(a) * (0.6 + Math.random()) - 0.5,
        life: 1, color,
      });
    }
  }

  function loseLife() {
    state.lives--;
    state.shake = 8;
    beep(90, 0.18, "sawtooth", 0.06);
    if (state.lives <= 0) {
      state.toast = { text: "Ah! Tekrar deneyelim", t: 1.4 };
      state.score = 0;
      state.caught = 0;
      state.lives = 3;
    } else {
      state.toast = { text: "Dikkat, mayın!", t: 1.0 };
    }
    emitUpdate();
  }

  // ---- Güncelle ----
  function update(dt) {
    const step = dt / 16.67; // 60fps normalizasyonu
    const d = difficultyFor(state.score);

    // Fok hareketi
    const SPEED = 2.6;
    if (pointerX !== null) {
      const target = pointerX - sealW / 2;
      state.sealX += (target - state.sealX) * Math.min(1, 0.25 * step);
    } else {
      let vx = 0;
      if (keys.left) vx -= SPEED;
      if (keys.right) vx += SPEED;
      state.sealX += vx * step;
    }
    state.sealX = Math.max(0, Math.min(W - sealW, state.sealX));

    // Spawn
    spawnAcc += dt;
    if (spawnAcc >= d.spawn) {
      spawnAcc = 0;
      spawn();
      if (Math.random() < d.multi) spawn();
    }

    // Cisimler
    const catchTop = sealY + 2;       // fok burnu hizası
    for (let i = state.items.length - 1; i >= 0; i--) {
      const it = state.items[i];
      it.y += it.vy * step;
      it.wob += 0.15 * step;
      const drawX = it.x + Math.sin(it.wob) * it.wobAmp;

      const overlap =
        drawX + it.w > state.sealX + 3 &&
        drawX < state.sealX + sealW - 3 &&
        it.y + it.h >= catchTop;

      if (overlap) {
        if (it.type === "fish") {
          state.score++;
          state.caught++;
          addSplash(it.x + it.w / 2, catchTop, it.color);
          beep(520 + state.caught * 8, 0.07, "square", 0.05);
          emitUpdate();
          state.items.splice(i, 1);
          if (state.score >= TARGET) { win(); return; }
        } else {
          state.items.splice(i, 1);
          loseLife();
        }
        continue;
      }
      if (it.y > H + 4) state.items.splice(i, 1);
    }

    // Parçacıklar
    for (let i = state.splash.length - 1; i >= 0; i--) {
      const p = state.splash[i];
      p.x += p.vx * step; p.y += p.vy * step; p.vy += 0.12 * step;
      p.life -= 0.04 * step;
      if (p.life <= 0) state.splash.splice(i, 1);
    }

    // Göz kırpma & toast & shake
    state.blink -= dt;
    if (state.blink < -3000) state.blink = 180; // ~3sn'de bir kırp
    if (state.toast) { state.toast.t -= dt / 1000; if (state.toast.t <= 0) state.toast = null; }
    if (state.shake > 0) state.shake = Math.max(0, state.shake - step);
  }

  // ---- Çizim ----
  function draw() {
    const sx = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    const sy = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    // Gökyüzü
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#bfe9ff");
    sky.addColorStop(0.6, "#8fd4f0");
    sky.addColorStop(1, "#6cc0e6");
    ctx.fillStyle = sky;
    ctx.fillRect(-8, -8, W + 16, H + 16);

    // Bulut pikselleri
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    pixelCloud(30, 22); pixelCloud(140, 34);

    // Deniz şeridi (arka)
    ctx.fillStyle = "#3fb0c9";
    ctx.fillRect(-8, GROUND - 10, W + 16, 12);
    ctx.fillStyle = "#57c3d8";
    for (let x = -8; x < W + 8; x += 8) {
      ctx.fillRect(x, GROUND - 12, 4, 2); // köpük pikselleri
    }

    // Kum
    ctx.fillStyle = "#f3dfa8";
    ctx.fillRect(-8, GROUND, W + 16, H - GROUND + 8);
    ctx.fillStyle = "#e7cf90";
    for (let x = -8; x < W + 8; x += 10) ctx.fillRect(x, GROUND + 6, 3, 2);
    for (let x = -2; x < W + 8; x += 14) ctx.fillRect(x, GROUND + 12, 2, 2);

    // Cisimler
    for (const it of state.items) {
      const dx = Math.round(it.x + Math.sin(it.wob) * it.wobAmp);
      if (it.type === "fish") {
        drawBitmap(ctx, it.map, { ...FISH_PAL_BASE, x: it.color }, dx, Math.round(it.y));
      } else {
        drawBitmap(ctx, it.map, MINE_PAL, dx, Math.round(it.y));
      }
    }

    // Parçacıklar
    for (const p of state.splash) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), PU, PU);
    }
    ctx.globalAlpha = 1;

    // Fok (gölge + gövde)
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(Math.round(state.sealX) + 2, sealY + sealH - 2, sealW - 4, 3);
    const sealMap = state.blink > 0 && state.blink < 120 ? SEAL_BLINK : SEAL;
    drawBitmap(ctx, sealMap, SEAL_PAL, Math.round(state.sealX), sealY);

    // Toast
    if (state.toast) {
      ctx.fillStyle = "rgba(61,43,38,0.85)";
      const tw = state.toast.text.length * 5 + 12;
      ctx.fillRect((W - tw) / 2, 8, tw, 14);
      ctx.fillStyle = "#fff7ea";
      ctx.font = "8px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(state.toast.text, W / 2, 16);
    }

    ctx.restore();
  }

  function pixelCloud(x, y) {
    ctx.fillRect(x, y, 16, 4);
    ctx.fillRect(x + 4, y - 3, 10, 4);
    ctx.fillRect(x - 3, y + 2, 22, 3);
  }

  // ---- Döngü ----
  function frame(t) {
    if (!running) return;
    if (!lastT) lastT = t;
    let dt = t - lastT;
    lastT = t;
    if (dt > 60) dt = 60; // sekme arka plana geçerse sıçramayı önle
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function win() {
    stop();
    beep(660, 0.1, "square", 0.06);
    setTimeout(() => beep(880, 0.16, "square", 0.06), 110);
    onWin?.();
  }

  function start() {
    reset();
    running = true;
    lastT = 0;
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    canvas.addEventListener("pointerdown", pd);
    canvas.addEventListener("pointermove", pm);
    canvas.addEventListener("pointerup", pu);
    canvas.addEventListener("pointercancel", pu);
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", kd);
    window.removeEventListener("keyup", ku);
    canvas.removeEventListener("pointerdown", pd);
    canvas.removeEventListener("pointermove", pm);
    canvas.removeEventListener("pointerup", pu);
    canvas.removeEventListener("pointercancel", pu);
  }

  reset();
  return { start, stop, reset };
}
