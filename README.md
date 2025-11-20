# Appstalker – Modern App Sharing

Appstalker is a social platform where people showcase the apps they use, discover new tools from friends, and discuss how they use them. The project includes a React Native mobile client and a Node/Express backend with PostgreSQL.

---

## Features
- **Profiles**: avatar, display name, bio, custom bio links, installed-app grid, “Similar Stalkers” suggestions, Follow/Unfollow.
- **Feeds**: Following and Trending tabs with modern cards; app detail navigation from feed items.
- **Manage Apps (Android)**: Native scan module to pull installed apps, show/hide toggles, bulk visibility update, manual search/add from catalog.
- **App Detail**: Metadata, category, usage stats, “Who uses it” (limited to followed users), comments with likes, install CTA icon.
- **Notifications**: Real-time WebSocket notifications; digest/milestone notifications planned.
- **Bio Links**: CRUD for Instagram/Twitter/YouTube/blog links and ordering.
- **Resilience**: Profile auto-creation on missing records; splash no longer blocks on font load; font load timeout fallback.
- **iOS note**: No automatic scan; users add apps manually (and future iOS “Golden 50” URL-scheme strategy can be added later).

---

## Tech Stack
### Mobile (mobile/)
- React Native 0.74, Expo 51 (managed workflow with custom dev client for native module).
- React Navigation (stack + bottom tabs).
- AsyncStorage for auth token caching.
- Axios for API, WebSocket client for real-time updates.
- Native Android module for app scanning (app icon & package listing).

### Backend (server/)
- Node.js + Express + TypeScript.
- Drizzle ORM + PostgreSQL.
- JWT authentication.
- WebSocket (ws) for notifications.

### Database
- PostgreSQL tables defined in `shared/schema.ts`.
- Key tables: `users`, `profiles`, `installed_apps`, `apps_catalog`, `app_comments`, `app_comment_likes`, `profile_links`, `follows`, `notifications`, `app_install_history`, `collections` (stacks groundwork), `user_similarities`, `notification_digests`, `app_statistics`.
- Bootstrap SQL: `server/scripts/setup_local_db.sql`.

---

## Setup
### Backend
1. Install deps at repo root:
   ```bash
   npm install
   ```
2. Create `.env` in root (server uses it):
   ```env
   PORT=5000
   DATABASE_URL=postgres://user:pass@host:5432/appstalker
   JWT_SECRET=change_me
   ```
3. Provision DB:
   ```bash
   psql "$DATABASE_URL" -f server/scripts/setup_local_db.sql
   ```
4. Run backend:
   ```bash
   npm run dev
   ```

### Mobile (Android)
1. Install deps:
   ```bash
   cd mobile
   npm install
   ```
2. Dev client (needed for the native scan module):
   ```bash
   npx expo run:android
   ```
3. Dev run (Metro):
   ```bash
   npx expo start
   ```

### Android Release Build (no Metro, for physical device)
From `mobile/`:
```bash
npx react-native bundle --platform android --dev false --entry-file App.tsx \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
cd android
./gradlew assembleRelease
```
APK output: `mobile/android/app/build/outputs/apk/release/app-release.apk`

Install to device:
```bash
adb uninstall com.appstalker.mobile  # clean slate
adb install mobile/android/app/build/outputs/apk/release/app-release.apk
adb shell monkey -p com.appstalker.mobile -c android.intent.category.LAUNCHER 1
```

**API base URL**
- Dev/emulator uses `http://10.0.2.2:5000`.
- Release/physical device uses the LAN IP baked in `mobile/src/config/api.ts` (or override with `EXPO_PUBLIC_API_URL` at bundle time). Update to your machine’s LAN IP if it changes.

### iOS (current state)
- Auto-scan is not available; apps must be added manually via catalog search/Manage Apps.
- Testing can be done with Expo Go for non-native paths; custom dev client/build required for any native additions.

---

## Testing Checklist (what to verify before sharing)
- Auth: Login/Register flows return a token; token persists via AsyncStorage.
- Profile: Loads without “Failed to get profile”; follow/unfollow updates counts; bio links open; apps grid navigates to App Detail.
- Manage Apps (Android): Scan device lists user-installed apps; visibility toggles work; manual search/add works; hidden apps stay hidden.
- App Detail: Shows stats, category, “who uses it” (followed users only), comments CRUD and likes, install CTA icon.
- Feed: Following/Trending render cards; navigate to app detail; search bars respond.
- Notifications: Real-time delivery for follows/visibility; no crashes when empty.
- Logout/Login cycle: Returns to login, clears socket, and re-authenticates cleanly.

---

## Troubleshooting
- **Splash stuck**: Use release APK (no Metro). Ensure API base URL points to reachable backend. If stuck, capture:
  ```powershell
  adb -s <device> logcat -c
  $pid = adb -s <device> shell pidof com.appstalker.mobile
  adb -s <device> logcat --pid $pid -v time ReactNativeJS:V AndroidRuntime:E *:E
  ```
- **Metro connect error on device**: For dev builds, run `npx expo start --host 0.0.0.0`; set “Debug server host” to `your-lan-ip:8081` or use `adb reverse tcp:8081 tcp:8081`.
- **Base URL cached in old APK**: `./gradlew clean assembleRelease` then reinstall.

---

## Repository Layout
- `mobile/` – React Native client (screens, components, services, native module)
- `server/` – Express+Drizzle backend routes/middleware/scripts
- `shared/schema.ts` – Database schema
- `server/scripts/` – DB setup/seed helpers

---

## Roadmap (short)
- App Detail UI: badges/tabs polish, richer stats.
- Profile UI: stacked collections/highlights; similar users display polish.
- Notifications: digest + milestone generation.
- iOS: “Golden 50” URL-scheme detection + manual fallback; Siri Shortcut bulk import (future).
- Collections/Stacks: Contextual app groups with shareable deep links.

Feel free to open issues or prioritize items above; the codebase is ready for iterative feature work.***
