// Firebase yapılandırması
// -------------------------------------------------------------
// Firebase Console > Proje Ayarları > "Web uygulaması" bölümünden gelen
// değerleri buraya yapıştıracağız. GitHub Pages public olduğu için bu
// anahtarların tarayıcıda görünmesi NORMALDIR; güvenlik Firestore
// "Security Rules" ile sağlanır.
// -------------------------------------------------------------

export const firebaseConfig = {
  apiKey: "TODO",
  authDomain: "TODO.firebaseapp.com",
  projectId: "TODO",
  storageBucket: "TODO.appspot.com",
  messagingSenderId: "TODO",
  appId: "TODO",
};

// Cevapların yazılacağı koleksiyon
export const RESPONSES_COLLECTION = "responses";

// Config doldurulmuş mu?
export const isConfigured = firebaseConfig.apiKey !== "TODO";
