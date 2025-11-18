#!/bin/bash
# Appstalker - Quick Commands
# Bu script sadece adimlari ekrana yazdirir; istedigin satirlari kopyalayip terminaline gecirebilirsin.

set -euo pipefail

step() {
  echo ""
  echo "=== $1 ==="
}

step "0) Repo"
echo "git clone https://github.com/ktamerk/appstalkerworking.git"
echo "cd appstalkerworking"

step "1) Backend kurulum"
echo "npm install"
echo "cp .env.example .env  # yoksa .env dosyasini kendin olustur"
echo "# DATABASE_URL ve diger degiskenleri doldur"
echo "npm run db:push"
echo "npm run dev  # http://localhost:5000"

step "2) Opsiyonel seed"
echo "npx ts-node -r dotenv/config server/scripts/createDemoUser.ts"
echo "npx ts-node -r dotenv/config server/scripts/seedDummyUsers.ts"

step "3) Mobil kurulum"
echo "cd mobile"
echo "npm install"
echo "npx expo run:android      # custom dev client"
echo "npx expo start --dev-client"

step "4) Faydalý komutlar"
echo "adb reverse tcp:5000 tcp:5000   # fiziksel cihaz"
echo "netstat -ano | findstr 5000     # Windows port kontrolu"
echo "taskkill /PID <pid> /F          # portu kapat"
echo "cd mobile && npx expo start --dev-client --clear   # Metro cache"

echo ""
echo "-> Backend: npm run dev"
echo "-> Mobile:  npx expo run:android (bir defa) / npx expo start --dev-client"
echo "-> DB:      npm run db:push | npm run db:studio"
