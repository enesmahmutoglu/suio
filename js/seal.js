// ============================================================
// Ortak fok balığı piksel çizimi — hem oyun hem açılış ekranı bunu kullanır.
// Beyaz, detaylı bebek fok. 19x15 hücre.
// ============================================================
export const SEAL_PAL = {
  O: "#6f828d", // yumuşak dış hat
  W: "#ffffff", // beyaz gövde
  L: "#e3ebf0", // hafif gölge
  E: "#2b2b33", // göz
  g: "#ffffff", // göz parıltısı
  N: "#3f3540", // burun
};

export const SEAL = [
  "......OOOOOOO......",
  "....OOWWWWWWWOO....",
  "...OWWWWWWWWWWWO...",
  "..OWWWWWWWWWWWWWO..",
  "..OWWEEWWWWWEEWWO..",
  "..OWWEgWWWWWEgWWO..",
  "..OWWWWWNNWWWWWWO..",
  "..OWWWWWWWWWWWWWO..",
  ".OWWWWWWWWWWWWWWWO.",
  ".OWWWWWWWWWWWWWWWO.",
  ".OWWLWWWWWWWWWLWWO.",
  ".OWWWWWWWWWWWWWWWO.",
  ".OWWWWWWWWWWWWWWWO.",
  ".OWWWWWWWWWWWWWWWO.",
  "..OWWWO.....OWWWO..",
];

// Göz kırpma karesi — gözler kapalı
export const SEAL_BLINK = SEAL.map((row, i) => {
  if (i === 4) return "..OWWWWWWWWWWWWWO..";
  if (i === 5) return "..OWWEEWWWWWEEWWO..";
  return row;
});

// Bitmap'i SVG'ye çevirir (açılış ekranı için — her cihazda net görünür)
export function sealSVG({ cell = 5 } = {}) {
  const w = SEAL[0].length, h = SEAL.length;
  let rects = "";
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < SEAL[y].length; x++) {
      const c = SEAL[y][x];
      if (c === "." || c === " ") continue;
      const col = SEAL_PAL[c];
      if (!col) continue;
      rects += `<rect x="${x}" y="${y}" width="1.05" height="1.05" fill="${col}"/>`;
    }
  }
  return `<svg viewBox="0 0 ${w} ${h}" width="${w * cell}" height="${h * cell}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}
