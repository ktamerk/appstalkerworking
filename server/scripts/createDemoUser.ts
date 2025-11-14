import 'dotenv/config';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import { users, profiles } from '../../shared/schema';

type ArgMap = Record<string, string>;

const parseArgs = (): ArgMap => {
  return process.argv.slice(2).reduce<ArgMap>((acc, arg) => {
    if (!arg.startsWith('--')) {
      return acc;
    }

    const [key, value = ''] = arg.replace(/^--/, '').split('=');
    if (key) {
      acc[key] = value;
    }

    return acc;
  }, {});
};

const args = parseArgs();

const email = args.email || process.env.DEMO_EMAIL || 'demo@appstalker.dev';
const username = args.username || process.env.DEMO_USERNAME || 'demouser';
const password = args.password || process.env.DEMO_PASSWORD || 'Demo123!';
const displayName = args.displayName || process.env.DEMO_DISPLAY_NAME || 'Demo User';

async function main() {
  try {
    if (!email || !username || !password) {
      throw new Error('email, username ve password değerleri zorunludur.');
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      console.log(`E-posta zaten kayıtlı: ${email}`);
      return;
    }

    const existingUsername = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUsername.length > 0) {
      throw new Error(`Kullanıcı adı zaten kullanımda: ${username}`);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        username,
        passwordHash,
      })
      .returning();

    await db.insert(profiles).values({
      userId: newUser.id,
      displayName,
      bio: '',
      showApps: true,
      isPrivate: false,
    });

    console.log('Kullanıcı oluşturuldu:');
    console.log(`  Email: ${email}`);
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
  } catch (error) {
    console.error('Kullanıcı oluşturulamadı:', error);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

main();
