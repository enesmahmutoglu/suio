// Seçilen günü Firestore'a yazar.
// Sağlamlık için iki yol denenir:
//   1) Firebase SDK (WebChannel + otomatik long-polling)
//   2) SDK başarısız olursa düz fetch ile Firestore REST API (yedek)
// İkisi de olmazsa localStorage'a düşer, böylece akış hiç kırılmaz.
import { firebaseConfig, RESPONSES_COLLECTION, isConfigured } from "./firebase-config.js";

let dbPromise = null;

async function getDb() {
  if (!isConfigured) return null;
  if (!dbPromise) {
    dbPromise = (async () => {
      const { initializeApp } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
      );
      const { initializeFirestore } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
      );
      const app = initializeApp(firebaseConfig);
      // Bazı ağlar / adblocker'lar Firestore'un WebChannel akışını engeller.
      // Otomatik long-polling algılama bu ortamlarda da yazmayı sağlar.
      return initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
    })();
  }
  return dbPromise;
}

// --- Yol 1: SDK ile yazma ---
async function writeViaSdk(payload) {
  const db = await getDb();
  if (!db) throw new Error("db yok");
  const { collection, addDoc, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
  );
  await addDoc(collection(db, RESPONSES_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

// --- Yol 2: REST API ile yazma (SDK/gstatic engellenmişse yedek) ---
// firestore.googleapis.com/v1 REST yolu, akış (WebChannel) yolundan farklı
// olduğu için birçok engelleyiciyi aşar. Güvenlik kurallarına yine tabidir.
async function writeViaRest(payload) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}` +
    `/databases/(default)/documents/${RESPONSES_COLLECTION}?key=${firebaseConfig.apiKey}`;
  const body = {
    fields: {
      day: { stringValue: payload.day },
      choiceLabel: { stringValue: payload.choiceLabel },
      ts: { stringValue: payload.ts },
      ua: { stringValue: payload.ua },
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`REST ${res.status} ${text.slice(0, 120)}`);
  }
}

/**
 * Seçilen günü kaydeder.
 * @param {{id:string,label:string}} choice
 * @returns {Promise<{ok:boolean, mode:'firebase'|'rest'|'local', error?:string}>}
 */
export async function saveChoice(choice) {
  const payload = {
    day: choice.id,
    choiceLabel: choice.label,
    ts: new Date().toISOString(),
    ua: navigator.userAgent,
  };

  // Yerel yedek — her zaman
  try {
    localStorage.setItem("suio.choice", JSON.stringify(payload));
  } catch {}

  if (!isConfigured) return { ok: true, mode: "local" };

  // Yol 1: SDK
  try {
    await writeViaSdk(payload);
    return { ok: true, mode: "firebase" };
  } catch (err) {
    console.warn("SDK yazma başarısız, REST yedeğine geçiliyor:", err?.message || err);
  }

  // Yol 2: REST yedeği
  try {
    await writeViaRest(payload);
    return { ok: true, mode: "rest" };
  } catch (err) {
    console.warn("REST yazma da başarısız:", err?.message || err);
    return { ok: false, mode: "local", error: String(err?.message || err) };
  }
}
