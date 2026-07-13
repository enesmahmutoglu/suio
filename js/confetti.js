// Hafif piksel konfeti — kütüphanesiz.
const COLORS = ["#ff7a59", "#ffd23f", "#22a699", "#7d5ba6", "#37c2b4", "#fff7ea"];

export function burstConfetti(canvas, { duration = 3200, count = 160 } = {}) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function size() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  }
  size();
  const W = () => canvas.width;
  const H = () => canvas.height;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const parts = Array.from({ length: reduced ? 40 : count }, () => spawn());

  function spawn() {
    const fromLeft = Math.random() < 0.5;
    return {
      x: (fromLeft ? 0.15 : 0.85) * W() + (Math.random() - 0.5) * 120 * dpr,
      y: H() * 0.35 + Math.random() * 60 * dpr,
      vx: ((fromLeft ? 1 : -1) * (2 + Math.random() * 4) + (Math.random() - 0.5) * 3) * dpr,
      vy: (-(6 + Math.random() * 7)) * dpr,
      g: (0.22 + Math.random() * 0.12) * dpr,
      size: (5 + Math.random() * 6) * dpr,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 1,
    };
  }

  const t0 = performance.now();
  let raf;

  function frame(now) {
    const elapsed = now - t0;
    ctx.clearRect(0, 0, W(), H());
    for (const p of parts) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (elapsed > duration - 800) p.life -= 0.02;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); // kare = piksel hissi
      ctx.restore();
    }
    if (elapsed < duration) {
      raf = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, W(), H());
    }
  }
  raf = requestAnimationFrame(frame);

  const onResize = () => size();
  window.addEventListener("resize", onResize);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    ctx.clearRect(0, 0, W(), H());
  };
}
