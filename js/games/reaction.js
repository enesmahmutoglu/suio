// Reflex — reaksiyon süresi mini oyunu
// Örnek bir oyun; ileride skorları Firebase'e yazacağız.
export function mountReaction(root) {
  root.innerHTML = `
    <div class="reaction">
      <h3 class="reaction__title">Reflex</h3>
      <div class="reaction__box" id="rx-box" data-state="idle">
        <span id="rx-text">Başlamak için tıkla</span>
      </div>
      <p class="reaction__hint" id="rx-hint">Kutu yeşile döndüğünde hemen tıkla.</p>
    </div>
  `;

  injectStyles();

  const box = root.querySelector("#rx-box");
  const text = root.querySelector("#rx-text");
  const hint = root.querySelector("#rx-hint");

  let state = "idle"; // idle | waiting | ready
  let startTime = 0;
  let timer = null;
  let best = Number(localStorage.getItem("suio.reaction.best")) || null;

  function setState(s) {
    state = s;
    box.dataset.state = s;
  }

  function showBest() {
    if (best) hint.textContent = `En iyi: ${best} ms`;
  }
  showBest();

  box.addEventListener("click", () => {
    if (state === "idle") {
      setState("waiting");
      text.textContent = "Bekle…";
      const delay = 1000 + Math.random() * 2500;
      timer = setTimeout(() => {
        setState("ready");
        text.textContent = "TIKLA!";
        startTime = performance.now();
      }, delay);
    } else if (state === "waiting") {
      clearTimeout(timer);
      setState("idle");
      text.textContent = "Çok erken! Tekrar dene";
    } else if (state === "ready") {
      const rt = Math.round(performance.now() - startTime);
      setState("idle");
      text.textContent = `${rt} ms — tekrar?`;
      if (!best || rt < best) {
        best = rt;
        localStorage.setItem("suio.reaction.best", String(best));
        hint.textContent = `🏆 Yeni rekor: ${rt} ms`;
      } else {
        showBest();
      }
    }
  });
}

function injectStyles() {
  if (document.getElementById("rx-styles")) return;
  const s = document.createElement("style");
  s.id = "rx-styles";
  s.textContent = `
    .reaction { text-align: center; min-width: min(360px, 80vw); }
    .reaction__title { font-size: 1.6rem; margin-bottom: 1.2rem; }
    .reaction__box {
      height: 200px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      cursor: pointer;
      font-size: 1.4rem;
      font-weight: 700;
      user-select: none;
      transition: background 0.15s, transform 0.1s;
    }
    .reaction__box:active { transform: scale(0.98); }
    .reaction__box[data-state="idle"]    { background: #2a2a4a; }
    .reaction__box[data-state="waiting"] { background: #b8323a; }
    .reaction__box[data-state="ready"]   { background: #1db954; }
    .reaction__hint { color: var(--muted); margin-top: 1rem; font-size: 0.9rem; }
  `;
  document.head.appendChild(s);
}
