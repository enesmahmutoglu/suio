// Seçilen günü Firestore'a yazar.
// Firebase henüz yapılandırılmadıysa sessizce localStorage'a düşer,
// böylece akış her durumda çalışmaya devam eder.
import { firebaseConfig, RESPONSES_COLLECTION, isConfigured } from "./firebase-config.js";

let dbPromise = null;

async function getDb() {
  if (!isConfigured) return null;
  if (!dbPromise) {
    dbPromise = (async () => {
      const { initializeApp } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
      );
      const { getFirestore } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
      );
      const app = initializeApp(firebaseConfig);
      return getFirestore(app);
    })();
  }
  return dbPromise;
}

/**
 * Seçilen günü kaydeder.
 * @param {{id:string,label:string}} choice
 * @returns {Promise<{ok:boolean, mode:'firebase'|'local', error?:string}>}
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

  const db = await getDb().catch(() => null);
  if (!db) {
    return { ok: true, mode: "local" };
  }

  try {
    const { collection, addDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );
    await addDoc(collection(db, RESPONSES_COLLECTION), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return { ok: true, mode: "firebase" };
  } catch (err) {
    console.warn("Firebase kayıt hatası:", err);
    return { ok: false, mode: "local", error: String(err?.message || err) };
  }
}
