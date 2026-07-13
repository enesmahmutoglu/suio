// Hafif piksel konfeti — kütüphanesiz.
const COLORS = ["#ff7a59", "#ffd23f", "#22a699", "#7d5ba6", "#37c2b4", "#fff7ea"];
const SHAPES = ["square", "square", "circle", "star", "fish"];

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
      shape: SHAPES[(Math.random() * SHAPES.length) | 0],
      life: 1,
    };
  }

  function drawShape(shape, s, color) {
    ctx.fillStyle = color;
    if (shape === "square") {
      ctx.fillRect(-s / 2, -s / 2, s, s);
    } else if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === "star") {
      const spikes = 5, outer = s / 2, inner = s / 4.4;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI * i) / spikes - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    } else if (shape === "fish") {
      const w = s * 1.3, h = s * 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2); // gövde
      ctx.fill();
      ctx.beginPath(); // kuyruk
      ctx.moveTo(w / 2 - 1, 0);
      ctx.lineTo(w / 2 + h * 0.6, -h / 2);
      ctx.lineTo(w / 2 + h * 0.6, h / 2);
      ctx.closePath();
      ctx.fill();
    }
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
      drawShape(p.shape, p.size, p.color);
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
