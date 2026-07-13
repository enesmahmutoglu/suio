// ============================================================
// suio — akış yöneticisi
// Hoşgeldin → Gün seçimi (Firebase) → Oyun → Sürpriz → Program
// ============================================================
import { startMusic } from "./audio.js";
import { saveChoice } from "./store.js";
import { createGame } from "./game.js";
import { burstConfetti } from "./confetti.js";
import { sealSVG } from "./seal.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Açılış ekranındaki fok (emoji yerine her cihazda görünen piksel çizim)
const welcomeSeal = document.getElementById("welcome-seal");
welcomeSeal.innerHTML = sealSVG({ cell: 5 });

// --- Sevimli "iyk" sesi (WebAudio, asset yok) ---
let sfxCtx = null;
function squeak() {
  try {
    sfxCtx = sfxCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = sfxCtx.createOscillator();
    const g = sfxCtx.createGain();
    o.type = "sine";
    const t = sfxCtx.currentTime;
    o.frequency.setValueAtTime(680, t);
    o.frequency.exponentialRampToValueAtTime(1150, t + 0.09);
    o.frequency.exponentialRampToValueAtTime(760, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g); g.connect(sfxCtx.destination);
    o.start(t); o.stop(t + 0.22);
  } catch {}
}

// --- Parıltı serpintisi ---
const SPARKLES = ["✦", "✧", "⭐", "✺", "･ﾟ"];
function sparkleBurst(x, y, n = 10) {
  if (reducedMotion) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.className = "spark";
    s.textContent = SPARKLES[(Math.random() * SPARKLES.length) | 0];
    const ang = (Math.PI * 2 * i) / n + Math.random();
    const dist = 26 + Math.random() * 44;
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.setProperty("--dx", Math.cos(ang) * dist + "px");
    s.style.setProperty("--dy", Math.sin(ang) * dist + "px");
    s.style.color = ["#ffd23f", "#ff7a59", "#37c2b4", "#ffffff"][(Math.random() * 4) | 0];
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 750);
  }
}

// Foğa tıklayınca zıpla + iyk + parıltı
welcomeSeal.addEventListener("click", () => {
  welcomeSeal.classList.remove("hop");
  void welcomeSeal.offsetWidth;
  welcomeSeal.classList.add("hop");
  squeak();
  const r = welcomeSeal.getBoundingClientRect();
  sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 8);
});

// --- Fareyle hafif parallax (masaüstü) ---
if (!reducedMotion && matchMedia("(pointer:fine)").matches) {
  const scenery = document.querySelector(".scenery");
  let tx = 0, ty = 0, raf = null;
  window.addEventListener("pointermove", (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * -16;
    ty = (e.clientY / window.innerHeight - 0.5) * -12;
    if (!raf) raf = requestAnimationFrame(() => {
      scenery.style.setProperty("--px", tx.toFixed(1) + "px");
      scenery.style.setProperty("--py", ty.toFixed(1) + "px");
      raf = null;
    });
  });
}

// ---- Günler ----
const DAYS = [
  { id: "2026-07-18", day: "18", weekday: "Cumartesi", month: "Temmuz", emoji: "🌅" },
  { id: "2026-07-19", day: "19", weekday: "Pazar",     month: "Temmuz", emoji: "🏖️" },
  { id: "2026-07-25", day: "25", weekday: "Cumartesi", month: "Temmuz", emoji: "🧺" },
  { id: "2026-07-26", day: "26", weekday: "Pazar",     month: "Temmuz", emoji: "🎡" },
];
const labelOf = (d) => `${d.day} ${d.month} ${d.weekday}`;

let selected = null;
let game = null;
let stopConfetti = null;

// ---- Ekran yönetimi ----
const screens = document.querySelectorAll(".screen");
function showScreen(name) {
  screens.forEach((s) => {
    const active = s.dataset.screen === name;
    s.hidden = !active;
    s.classList.toggle("is-active", active);
  });
  window.scrollTo(0, 0);
}

// ---- 1) Hoşgeldin ----
document.getElementById("start-btn").addEventListener("click", () => {
  startMusic();
  showScreen("days");
});

// ---- 2) Gün seçimi ----
const grid = document.getElementById("days-grid");
const daysStatus = document.getElementById("days-status");

DAYS.forEach((d) => {
  const card = document.createElement("button");
  card.className = "day-card";
  card.type = "button";
  card.innerHTML = `
    <span class="day-card__emoji">${d.emoji}</span>
    <span class="day-card__day">${d.day}</span>
    <span class="day-card__month">${d.month}</span>
    <span class="day-card__weekday">${d.weekday}</span>
  `;
  card.addEventListener("click", () => pickDay(d, card));
  grid.appendChild(card);
});

async function pickDay(d, card) {
  if (selected) return;
  selected = { id: d.id, label: labelOf(d) };
  document.querySelectorAll(".day-card").forEach((c) => c.classList.add("is-busy"));
  card.classList.add("is-selected");
  const cr = card.getBoundingClientRect();
  sparkleBurst(cr.left + cr.width / 2, cr.top + cr.height / 2, 14);
  squeak();
  daysStatus.textContent = "Kaydediliyor…";

  const res = await saveChoice(selected);
  if (res.mode === "firebase" || res.mode === "rest") daysStatus.textContent = "Harika, seçimini aldım! ✨";
  else daysStatus.textContent = "Seçimini aldım! ✨";

  setTimeout(() => showScreen("game"), 900);
}

// ---- 3) Oyun ----
const canvas = document.getElementById("game-canvas");
const gameIntro = document.getElementById("game-intro");
const gameWrap = document.getElementById("game-wrap");
const scoreEl = document.getElementById("score");
const scoreBox = scoreEl.closest(".hud__score");
const diffEl = document.getElementById("difficulty");
const livesEl = document.getElementById("lives");

function renderLives(n) {
  let html = "";
  for (let i = 0; i < 3; i++) {
    html += `<span style="opacity:${i < n ? 1 : 0.25}">🐚</span>`;
  }
  livesEl.innerHTML = html;
}

function updateHud({ score, lives, level, label }) {
  if (scoreEl.textContent !== String(score)) {
    scoreEl.textContent = score;
    scoreBox.classList.remove("bump");
    void scoreBox.offsetWidth;
    scoreBox.classList.add("bump");
  }
  diffEl.textContent = label;
  diffEl.dataset.level = level;
  renderLives(lives);
}

document.getElementById("game-start-btn").addEventListener("click", () => {
  gameIntro.hidden = true;
  gameWrap.hidden = false;
  renderLives(3);
  game = createGame(canvas, {
    onUpdate: updateHud,
    onWin: handleWin,
  });
  game.start();
});

// ---- 4) Sürpriz / konfeti ----
function handleWin() {
  showScreen("win");
  document.getElementById("win-seal").innerHTML = sealSVG({ cell: 4 });
  const confCanvas = document.getElementById("confetti-canvas");
  stopConfetti = burstConfetti(confCanvas, { duration: 3600, count: 180 });
}

document.getElementById("reveal-btn").addEventListener("click", () => {
  stopConfetti?.();
  showScreen("finale");
  const date = selected ? selected.label : "o gün";
  document.getElementById("finale-date").textContent = `${date} günü görüşmek üzere!`;
});

// ---- 5) Baştan ----
document.getElementById("restart-btn").addEventListener("click", () => {
  stopConfetti?.();
  game?.stop();
  game = null;
  selected = null;
  daysStatus.textContent = "";
  document.querySelectorAll(".day-card").forEach((c) => c.classList.remove("is-busy", "is-selected"));
  gameIntro.hidden = false;
  gameWrap.hidden = true;
  showScreen("welcome");
});
