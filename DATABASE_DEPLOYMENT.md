# Appstalker Database Deployment

Appstalker PostgreSQL ve Drizzle ORM üzerine kuruldu. Bu doküman Neon tabanlý bulut DB ya da lokal PostgreSQL (Docker veya manuel) için izlemen gereken adýmlarý açýklar.

## 1. Þema Hakkýnda

- Kaynak dosya: `shared/schema.ts`
- Drizzle ayarý: `drizzle.config.ts`
- Önemli tablolar: `users`, `profiles`, `installed_apps`, `apps_catalog`, `app_comments`, `app_comment_likes`, `profile_links`, `notifications`, `app_install_history` vb.

Herhangi bir tablo deðiþikliðinden sonra `npm run db:push` çalýþtýrarak PostgreSQL ile senkron tut.

## 2. Opsiyon A - Neon (önerilen)

1. Neon.com’da yeni proje aç, `appstalker` adýnda database oluþtur.
2. Connection string’i kopyala ve `.env` içindeki `DATABASE_URL` alanýna yapýþtýr.
3. `SSL Mode` Neon’da zorunlu olduðu için `?sslmode=require` takýsý varsa silme.
4. Root’ta:

```bash
npm install            # ilk defa ise
npm run db:push
npm run db:studio
```

Studio linki (`http://localhost:4983`) Neon baðlantýsý ile tabloyu gösterir.

## 3. Opsiyon B - Docker ile lokal PostgreSQL

```bash
docker run --name appstalker-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=appstalker \
  -p 5432:5432 -d postgres:16
```

`.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appstalker
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=appstalker
```

Sonra `npm run db:push`.

## 4. Opsiyon C - Native kurulum (Windows/macOS/Linux)

- Installer veya `brew install postgresql@16`.
- `psql` içinde:

```sql
CREATE DATABASE appstalker;
CREATE USER appuser WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE appstalker TO appuser;
```

`.env` deðerlerini buna göre ayarla.

## 5. Migration & Seed Komutlarý

| Komut | Açýklama |
|-------|----------|
| `npm run db:push` | `shared/schema.ts` ile DB’yi senkronlar |
| `npm run db:studio` | Drizzle Studio UI |
| `npx drizzle-kit generate` | SQL migration dosyalarý oluþturur (opsiyonel) |
| `npx ts-node -r dotenv/config server/scripts/createDemoUser.ts` | Admin/demo kullanýcýsý |
| `npx ts-node -r dotenv/config server/scripts/seedDummyUsers.ts` | 15+ dummy profil/app baðlantýsý |
| `npx ts-node -r dotenv/config server/scripts/seedNotifications.ts` | Bildirim ve digest kayýtlarý |
| `psql -f server/scripts/setup_local_db.sql` | Tüm tablo + indexleri sýfýrdan kurar |

> Seed scriptleri Neon’da da çalýþýr. Yalnýzca `.env` içinde doðru `DATABASE_URL` olduðuna emin ol.

## 6. Baðlantýyý Test Etme

```bash
npm run dev &
sleep 2
curl http://localhost:5000/api/health
```

`{"status":"ok"}` dönüyorsa DB baðlantýsý sorunsuzdur.

## 7. Bakým & Yedek

- **Dump**: `pg_dump $DATABASE_URL > backups/appstalker-$(date +%F).sql`
- **Restore**: `psql $DATABASE_URL < backups/...sql`
- Neon kullanýrken branch alma/Time Travel özellikleri ile geri dönüþ yapabilirsin.

## 8. SSS

- **Migration hata verdi**: `npm run db:push -- --force`
- **SSL hatasý**: Lokal PostgreSQL kullanýrken connection string’inden `?sslmode=require` takýsýný sil.
- **Charset hatalarý**: `server/scripts/setup_local_db.sql` UTF-8’dir; `psql --encoding=UTF8` ile çalýþtýr.
