# Appstalker – Modern App Sharing Experience

Appstalker is a full-stack social platform where users showcase the applications installed on their devices. Friends can discover new tools, follow each other’s installs, discuss usage tips, and control visibility through granular privacy settings.

---

## 📱 Uygulama Özellikleri

- **Profil Sayfası**
  - Avatar, display name, bio ve özelleştirilebilir bio linkleri.
  - Installed apps grid + “Similar Stalkers” önerileri.
  - Manage Apps / Edit Profile aksiyonları ve görünür/gizli app istatistikleri.

- **Feed (Following & Trending)**
  - Following sekmesi: takip ettiklerinin son yüklemeleri ve önerilen kullanıcı kartları.
  - Trending sekmesi: toplulukta en çok paylaşılan uygulamalar.
  - Arama çubuğu, koyu tema, modern kart tasarımları.

- **Manage Apps**
  - Cihazdan uygulama taraması (Android için native module).
  - Visible ve Hidden sekmeleri, toggle switch’lerle kontrol.
  - “Scan Device for Apps” butonu, çoklu görünürlük güncelleme.

- **App Details**
  - App meta (ikon, kategori, açıklama, global istatistikler).
  - “Who uses it” listesi sadece takip ettiklerin için gösterilir.
  - Yorum/Q&A modülü, yorum beğenme (like) sistemi ve “install” butonu ikonu.

- **Notifications**
  - Gerçek zamanlı follower/app visibility bildirimleri.
  - Geliştirilmekte: digest özetleri, milestone kutlamaları.

- **Diğer**
  - Bio linkleri CRUD (Instagram, Twitter, blog vb.).
  - Similar users / recommendations (altyapı şemada hazır).
  - Installation timeline ve app history için event tablosu.

---

## 🛠 Kullanılan Teknolojiler

### Frontend (mobile/)
- **React Native** 0.74 + **Expo** 51 (managed workflow → custom dev client).
- **React Navigation** (stack + tab navigators).
- **Ionicons / Expo Vector Icons** UI kit.
- **AsyncStorage** (auth token & cache).
- **Custom native module** for Android app list (`AppIconModule`).

### Backend (server/)
- **Node.js / Express** + **TypeScript**.
- **Drizzle ORM** (PostgreSQL/Neon uyumlu).
- **JWT** authentication.
- **WebSocket** (ws) for real-time notifications.
- **Zod**/validation planlanıyor (şema hazır).

### Database
- PostgreSQL (local veya Neon). Drizzle şemaları `shared/schema.ts`.
- Ek tablolar:
  - `apps_catalog`, `app_statistics`, `app_comments`, `app_comment_likes`
  - `profile_links`, `user_similarities`, `user_milestones`, `notification_digests`
  - `app_install_history`, `collections`, `installed_apps` genişleticiler vb.
- `server/scripts/setup_local_db.sql` tüm tablo ve kolonları oluşturur.

---

## 🚀 Çalıştırma

```bash
git clone https://github.com/ktamerk/appstalkerworking.git
cd appstalkerworking
npm install
(PostgreSQL bağlantı bilgilerini .env dosyasına ekle)
npm run dev
```

Mobil:

```bash
cd mobile
npm install
npx expo run:android   # custom dev client
```

Android cihaz taraması için:
- `mobile/android/app/src/main/java/com/appstalker/mobile/appicon/AppIconModule.java` native module derlenmiş olmalı (`npx expo run:android`).
- Manage Apps ekranındaki “Scan Device for Apps” butonunu kullan.

---

## 🗺 Yol Haritası

| Durum | Görev |
|-------|-------|
| ✅    | Feed & Manage Apps UI dark-theme redesign |
| ✅    | App detail comments + like sistemi & takip filtresi |
| ✅    | Bio links için backend + mobil yönetim |
| ⏳    | App detail ekranı tam mockup (badge stats, sekmeler, avatar listesi) |
| ⏳    | Profile ekranı mockup (komple grid, similar users, floating action) |
| ⏳    | Notification digest & milestone üretimi |
| ⏳    | Similar users / recommendation algoritması |
| ⏳    | Installation timeline visualization |

> Not: “⏳” olan maddeler için şema altyapısı hazır; UI ve API implementasyonu plan dâhilinde sırayla yapılacak.

---

## 📂 Dizinde Öne Çıkanlar

- `mobile/src/screens/` → Feed, Manage Apps, App Detail, Profile vs.
- `server/routes/` → auth, apps, profile, social, notifications.
- `shared/schema.ts` → tüm Drizzle tabloları ve ilişkiler.
- `server/scripts/` → veritabanı kurulum/seed scriptleri.

---

Herhangi bir sorunda veya roadmap’deki bir maddeyi önceliklendirmek istediğinde README’deki görev tablolarını referans alarak ilerleyebilirsin.***
