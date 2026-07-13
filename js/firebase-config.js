// Firebase yapılandırması
// -------------------------------------------------------------
// Firebase Console > Proje Ayarları > "Web uygulaması" bölümünden gelen
// değerleri buraya yapıştıracağız. GitHub Pages public olduğu için bu
// anahtarların tarayıcıda görünmesi NORMALDIR; güvenlik Firestore
// "Security Rules" ile sağlanır.
// -------------------------------------------------------------

export const firebaseConfig = {
  apiKey: "AIzaSyDvYdY5bt5YJF70fAh_hEsqy1CFdapeabs",
  authDomain: "iodb-4bff2.firebaseapp.com",
  projectId: "iodb-4bff2",
  storageBucket: "iodb-4bff2.firebasestorage.app",
  messagingSenderId: "885178168448",
  appId: "1:885178168448:web:2f880b33e68d49a35aa265",
};

// Cevapların yazılacağı koleksiyon
export const RESPONSES_COLLECTION = "responses";

// Config doldurulmuş mu?
export const isConfigured = firebaseConfig.apiKey !== "TODO";
