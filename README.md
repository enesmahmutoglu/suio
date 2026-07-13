# suio

Tarayıcıda çalışan, görselliğin ve mini oyunların ön planda olduğu bir web projesi.

## Teknoloji

- **Vanilla HTML / CSS / JS** (ES modülleri) — build adımı yok
- **Canvas API** — parçacık arka planı ve oyunlar
- **Firebase** — skorlar / veritabanı (yapılandırma bekleniyor)
- **GitHub Pages** — yayın

## Proje Yapısı

```
suio/
├── index.html            # Ana sayfa
├── css/
│   ├── style.css         # Ana stiller
│   └── animations.css    # Animasyonlar / keyframes
├── js/
│   ├── main.js           # Giriş noktası, modal & scroll reveal
│   ├── particles.js      # Parçacık arka planı
│   ├── firebase-config.js# Firebase ayarları (doldurulacak)
│   └── games/
│       └── reaction.js   # Reflex mini oyunu
└── assets/               # Görseller & ses
```

## Yerel Çalıştırma

ES modülleri kullanıldığı için `file://` ile değil, bir yerel sunucu ile açılmalı:

```bash
# Python varsa
python -m http.server 8000
# veya Node
npx serve
```

Ardından http://localhost:8000 adresine git.

## Yayın (GitHub Pages)

`main` dalına push edildiğinde Pages otomatik yayınlanır.

## Yol Haritası

- [ ] Firebase yapılandırmasını tamamla
- [ ] Skor tablosu (leaderboard)
- [ ] Yeni mini oyunlar
