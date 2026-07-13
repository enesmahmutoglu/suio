// suio — ana giriş noktası
import { initParticles } from "./particles.js";
import { mountReaction } from "./games/reaction.js";

// Yıl
document.getElementById("year").textContent = new Date().getFullYear();

// Parçacık arka planı
initParticles(document.getElementById("bg-particles"));

// Scroll reveal
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// Oyun modalı
const modal = document.getElementById("game-modal");
const mount = document.getElementById("game-mount");

const games = {
  reaction: mountReaction,
};

function openGame(name) {
  const fn = games[name];
  if (!fn) return;
  mount.innerHTML = "";
  modal.hidden = false;
  fn(mount);
}

function closeGame() {
  modal.hidden = true;
  mount.innerHTML = "";
}

document.querySelectorAll(".card[data-game]").forEach((card) => {
  card.querySelector(".btn")?.addEventListener("click", () => {
    openGame(card.dataset.game);
  });
});

modal.querySelector(".modal__close").addEventListener("click", closeGame);
modal.querySelector(".modal__backdrop").addEventListener("click", closeGame);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeGame();
});
