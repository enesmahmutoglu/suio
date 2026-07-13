// Arka plan müziği — Veridis Quo, döngüde.
// Tarayıcılar ses için kullanıcı etkileşimi ister; bu yüzden ilk
// "Başlayalım!" tıklamasıyla başlatılır.
const audio = document.getElementById("bg-music");
const toggle = document.getElementById("sound-toggle");

let started = false;
audio.volume = 0.0; // yumuşak giriş için fade-in

function fadeTo(target, ms = 900) {
  const start = audio.volume;
  const t0 = performance.now();
  function tick(now) {
    const k = Math.min(1, (now - t0) / ms);
    audio.volume = start + (target - start) * k;
    if (k < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export async function startMusic() {
  if (started) return;
  try {
    await audio.play();
    started = true;
    fadeTo(0.55);
    toggle.hidden = false;
    toggle.classList.add("is-playing");
  } catch (err) {
    // Otomatik oynatma engellendiyse düğmeyi göster, kullanıcı açsın
    toggle.hidden = false;
    console.info("Müzik beklemede:", err?.message);
  }
}

toggle.addEventListener("click", async () => {
  if (audio.paused) {
    try {
      await audio.play();
      fadeTo(0.55);
      toggle.classList.remove("is-muted");
      toggle.classList.add("is-playing");
    } catch {}
  } else {
    audio.pause();
    toggle.classList.add("is-muted");
    toggle.classList.remove("is-playing");
  }
});
