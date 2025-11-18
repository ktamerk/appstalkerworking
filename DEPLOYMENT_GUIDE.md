# Appstalker Deployment Guide

Bu doküman Appstalker reposunu (`https://github.com/ktamerk/appstalkerworking.git`) klonlayýp PostgreSQL destekli backend ile Expo tabanlý mobil istemciyi ayaða kaldýrmak için gereken tüm adýmlarý özetler.

## 1. Gereksinimler

- Node.js 18+ ve npm 10+
- Git 2.40+
- JDK 17 (Temurin veya Oracle)
- Android Studio + Android SDK 34, bir Pixel 6/7 emülatörü
- Expo CLI (npx üzerinden otomatik gelir)
- PostgreSQL 15+ (Neon veya lokal kurulum)
- Opsiyonel: Docker, Watchman, Yarn

## 2. Reponun Hazýrlanmasý

```bash
git clone https://github.com/ktamerk/appstalkerworking.git
cd appstalkerworking
npm install            # server + shared baðýmlýlýklarý
```

## 3. Ortam Deðiþkenleri

Kök klasörde `.env` oluþtur ve aþaðýdaki gibi doldur (örnek deðerleri kendi bilgilerinle deðiþtir):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appstalker
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=appstalker

SESSION_SECRET=super-secret-value
JWT_SECRET=another-secret-value
PORT=5000
```

> Neon kullanýyorsan PostgreSQL host bilgilerini Neon panelinden, lokalde Docker/Postgres kullanýyorsan kendi kullanýcý ve þifreni yaz.

## 4. Database Kurulumu

1. Drizzle ile tablo oluþtur: `npm run db:push`
2. Þemayý incelemek için: `npm run db:studio`
3. Dummy veriler:
   - `npx ts-node -r dotenv/config server/scripts/createDemoUser.ts`
   - `npx ts-node -r dotenv/config server/scripts/seedDummyUsers.ts`
   - `npx ts-node -r dotenv/config server/scripts/seedNotifications.ts`
4. Gerekirse tüm tablo komutlarý `server/scripts/setup_local_db.sql` içinde.

## 5. Backend Çalýþtýrma

```bash
npm run dev            # ts-node + nodemon benzeri çalýþma
```

- API: `http://localhost:5000`
- WebSocket: `ws://localhost:5000`
- Prod build için: `npm run build && npm start`
- Port 5000 doluysa: `netstat -ano | findstr 5000` + `taskkill /PID <pid> /F`

## 6. Mobil Uygulama (Android)

```bash
cd mobile
npm install
npx expo run:android        # ilk kurulum, custom dev client
npx expo start --dev-client # Metro bundler
```

- Emülatör backend’e `http://10.0.2.2:5000` üzerinden baðlanýr (`mobile/src/config/api.ts` otomatik seçer).
- Fiziksel cihazda çalýþtýrýyorsan bilgisayar IP adresini `api.ts` içinde güncelle.
- Tarama modülü için her deðiþiklikten sonra `npx expo run:android` ile native build’i yenile.

## 7. Build & Release (Android)

```bash
cd mobile/android
./gradlew assembleRelease          # Windows için gradlew.bat
```

APK `mobile/android/app/build/outputs/apk/release/` dizinine düþer. Upload için keystore ve `gradle.properties` ayarlamayý unutma.

## 8. Troubleshooting

- **EADDRINUSE 5000**: PID kapat, `npm run dev` tekrar.
- **Metro 8081 hatasý**: `npx expo start --dev-client --clear`
- **Gradle cache bozuldu**: `cd mobile/android && gradlew clean`
- **App tarama çalýþmýyor**: dev client’i yeniden build et (`npx expo run:android`), uygulamayý kaldýrýp tekrar kur.
- **Axios 413**: Backend’de `server/routes/apps.ts` için payload limitlerini kontrol et (`express.json({ limit: '5mb' })`).

## 9. Deployment Kontrol Listesi

- [ ] `.env` güncel
- [ ] `npm run db:push` sorunsuz
- [ ] `npm run dev` çalýþýyor
- [ ] Android dev client güncel
- [ ] Discover/Feed/App Detail/Profile akýþlarý manuel test edildi
- [ ] GitHub push: `git add . && git commit && git push origin main`
