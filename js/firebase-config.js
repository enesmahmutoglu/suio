// Firebase yapılandırması
// -------------------------------------------------------------
// Aşağıdaki değerleri Firebase Console > Proje Ayarları > "Web uygulaması"
// bölümünden alacağız. GitHub Pages public olduğu için bu anahtarlar
// tarayıcıda görünür olacak — bu NORMALDIR. Asıl güvenlik, Firestore/
// Realtime Database "Security Rules" ile sağlanır.
// -------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

export const firebaseConfig = {
  apiKey: "TODO",
  authDomain: "TODO.firebaseapp.com",
  projectId: "TODO",
  storageBucket: "TODO.appspot.com",
  messagingSenderId: "TODO",
  appId: "TODO",
};

// Config henüz doldurulmadıysa Firebase'i başlatma.
export const app =
  firebaseConfig.apiKey === "TODO" ? null : initializeApp(firebaseConfig);
