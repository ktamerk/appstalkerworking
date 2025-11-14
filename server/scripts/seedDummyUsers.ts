import 'dotenv/config';
import bcrypt from 'bcrypt';
import { eq, and } from 'drizzle-orm';

import { db } from '../db';
import { users, profiles, installedApps, follows } from '../../shared/schema';

type DummyApp = {
  packageName: string;
  appName: string;
  appIcon?: string;
  platform?: 'android' | 'ios';
  isVisible?: boolean;
};

type DummyUser = {
  email: string;
  username: string;
  password: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  showApps?: boolean;
  isPrivate?: boolean;
  apps: DummyApp[];
  following?: string[];
};

const sharedPassword = 'DummyPass123!';

const dummyUsers: DummyUser[] = [
  {
    email: 'alex.morgan@appstalker.dev',
    username: 'alexm',
    password: sharedPassword,
    displayName: 'Alex Morgan',
    bio: 'Product designer obsessed with polished tooling.',
    avatarUrl: 'https://i.pravatar.cc/200?img=1',
    apps: [
      { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
      { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
      { packageName: 'com.slack', appName: 'Slack', appIcon: 'https://logo.clearbit.com/slack.com', isVisible: false },
    ],
    following: ['demouser', 'miachen', 'noahr'],
  },
  {
    email: 'mia.chen@appstalker.dev',
    username: 'miachen',
    password: sharedPassword,
    displayName: 'Mia Chen',
    bio: 'Mobile dev @ Orbit Labs | Swift, Kotlin, Espresso.',
    avatarUrl: 'https://i.pravatar.cc/200?img=2',
    apps: [
      { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
      { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
      { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    ],
    following: ['alexm', 'demouser', 'oliviaw'],
  },
  {
    email: 'liam.carter@appstalker.dev',
    username: 'liamc',
    password: sharedPassword,
    displayName: 'Liam Carter',
    bio: 'SRE @ Shipyard | coffee + home servers.',
    avatarUrl: 'https://i.pravatar.cc/200?img=3',
    apps: [
      { packageName: 'com.microsoft.teams', appName: 'Teams', appIcon: 'https://logo.clearbit.com/microsoft.com' },
      { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
      { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    ],
    following: ['alexm', 'avalo', 'demouser'],
  },
  {
    email: 'sofia.kim@appstalker.dev',
    username: 'sofiak',
    password: sharedPassword,
    displayName: 'Sofia Kim',
    bio: 'Indie hacker shipping productivity tools.',
    avatarUrl: 'https://i.pravatar.cc/200?img=4',
    apps: [
      { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
      { packageName: 'com.strava', appName: 'Strava', appIcon: 'https://logo.clearbit.com/strava.com' },
      { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    ],
    following: ['miachen', 'oliviaw', 'demouser'],
  },
  {
    email: 'noah.ross@appstalker.dev',
    username: 'noahr',
    password: sharedPassword,
    displayName: 'Noah Ross',
    bio: 'PM | building social products.',
    avatarUrl: 'https://i.pravatar.cc/200?img=5',
    apps: [
      { packageName: 'com.linkedin.android', appName: 'LinkedIn', appIcon: 'https://logo.clearbit.com/linkedin.com' },
      { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com', isVisible: false },
      { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    ],
    following: ['alexm', 'liamc', 'demouser'],
  },
  {
    email: 'olivia.watts@appstalker.dev',
    username: 'oliviaw',
    password: sharedPassword,
    displayName: 'Olivia Watts',
    bio: 'Community lead @ async.studio.',
    avatarUrl: 'https://i.pravatar.cc/200?img=6',
    apps: [
      { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
      { packageName: 'com.pinterest', appName: 'Pinterest', appIcon: 'https://logo.clearbit.com/pinterest.com' },
      { packageName: 'com.canva.editor', appName: 'Canva', appIcon: 'https://logo.clearbit.com/canva.com' },
    ],
    following: ['miachen', 'sofiak', 'demouser'],
  },
  {
    email: 'ethan.clark@appstalker.dev',
    username: 'ethanc',
    password: sharedPassword,
    displayName: 'Ethan Clark',
    bio: 'Data storyteller + weekend cyclist.',
    avatarUrl: 'https://i.pravatar.cc/200?img=7',
    apps: [
      { packageName: 'com.adobe.lrmobile', appName: 'Lightroom', appIcon: 'https://logo.clearbit.com/adobe.com' },
      { packageName: 'com.google.android.apps.maps', appName: 'Google Maps', appIcon: 'https://logo.clearbit.com/google.com' },
      { packageName: 'com.tesla', appName: 'Tesla', appIcon: 'https://logo.clearbit.com/tesla.com', isVisible: false },
    ],
    following: ['sofiak', 'lucasp', 'demouser'],
  },
  {
    email: 'ava.lopez@appstalker.dev',
    username: 'avalo',
    password: sharedPassword,
    displayName: 'Ava Lopez',
    bio: 'Retro gamer + Android theming geek.',
    avatarUrl: 'https://i.pravatar.cc/200?img=8',
    apps: [
      { packageName: 'com.discord', appName: 'Discord', appIcon: 'https://logo.clearbit.com/discord.com' },
      { packageName: 'com.epicgames.fortnite', appName: 'Fortnite', appIcon: 'https://logo.clearbit.com/epicgames.com' },
      { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com' },
    ],
    following: ['liamc', 'lucasp', 'demouser'],
  },
  {
    email: 'lucas.patel@appstalker.dev',
    username: 'lucasp',
    password: sharedPassword,
    displayName: 'Lucas Patel',
    bio: 'Founder @ peek.fm | shipping audio tools.',
    avatarUrl: 'https://i.pravatar.cc/200?img=9',
    apps: [
      { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
      { packageName: 'com.soundcloud.android', appName: 'SoundCloud', appIcon: 'https://logo.clearbit.com/soundcloud.com' },
      { packageName: 'com.google.android.apps.youtube.creator', appName: 'YouTube Studio', appIcon: 'https://logo.clearbit.com/youtube.com' },
    ],
    following: ['alexm', 'emilyn', 'demouser'],
  },
  {
    email: 'emily.nguyen@appstalker.dev',
    username: 'emilyn',
    password: sharedPassword,
    displayName: 'Emily Nguyen',
    bio: 'Full-stack dev | coffee & climbing.',
    avatarUrl: 'https://i.pravatar.cc/200?img=10',
    apps: [
      { packageName: 'com.github.android', appName: 'GitHub', appIcon: 'https://logo.clearbit.com/github.com' },
      { packageName: 'com.figma.mirror', appName: 'Figma Mirror', appIcon: 'https://logo.clearbit.com/figma.com' },
      { packageName: 'com.duolingo', appName: 'Duolingo', appIcon: 'https://logo.clearbit.com/duolingo.com' },
    ],
    following: ['alexm', 'harpers', 'demouser'],
  },
  {
    email: 'james.baker@appstalker.dev',
    username: 'jamesb',
    password: sharedPassword,
    displayName: 'James Baker',
    bio: 'News junkie + indie musician.',
    avatarUrl: 'https://i.pravatar.cc/200?img=11',
    apps: [
      { packageName: 'com.medium.reader', appName: 'Medium', appIcon: 'https://logo.clearbit.com/medium.com' },
      { packageName: 'bbc.mobile.news.ww', appName: 'BBC News', appIcon: 'https://logo.clearbit.com/bbc.com' },
      { packageName: 'com.apple.android.music', appName: 'Apple Music', appIcon: 'https://logo.clearbit.com/apple.com' },
    ],
    following: ['miachen', 'jamesb', 'demouser'],
  },
  {
    email: 'harper.singh@appstalker.dev',
    username: 'harpers',
    password: sharedPassword,
    displayName: 'Harper Singh',
    bio: 'VR tinkerer & UI motion nerd.',
    avatarUrl: 'https://i.pravatar.cc/200?img=12',
    apps: [
      { packageName: 'com.oculus.twilight', appName: 'Meta Quest', appIcon: 'https://logo.clearbit.com/meta.com' },
      { packageName: 'com.adsk.sketchbook', appName: 'Sketchbook', appIcon: 'https://logo.clearbit.com/autodesk.com' },
      { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    ],
    following: ['alexm', 'miachen', 'emilyn'],
  },
  {
    email: 'jackson.hale@appstalker.dev',
    username: 'jacksonh',
    password: sharedPassword,
    displayName: 'Jackson Hale',
    bio: 'Fintech analyst tracking macro trends.',
    avatarUrl: 'https://i.pravatar.cc/200?img=13',
    apps: [
      { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
      { packageName: 'com.binance.dev', appName: 'Binance', appIcon: 'https://logo.clearbit.com/binance.com' },
      { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    ],
    following: ['liamc', 'noahr', 'demouser'],
  },
  {
    email: 'lily.adams@appstalker.dev',
    username: 'lilya',
    password: sharedPassword,
    displayName: 'Lily Adams',
    bio: 'Wellness blogger + plant mom.',
    avatarUrl: 'https://i.pravatar.cc/200?img=14',
    apps: [
      { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
      { packageName: 'com.peloton.app', appName: 'Peloton', appIcon: 'https://logo.clearbit.com/onepeloton.com' },
      { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
    ],
    following: ['sofiak', 'oliviaw', 'demouser'],
  },
  {
    email: 'max.garcia@appstalker.dev',
    username: 'maxg',
    password: sharedPassword,
    displayName: 'Max Garcia',
    bio: '3D artist & cinema buff.',
    avatarUrl: 'https://i.pravatar.cc/200?img=15',
    apps: [
      { packageName: 'com.adobe.scan.android', appName: 'Adobe Scan', appIcon: 'https://logo.clearbit.com/adobe.com' },
      { packageName: 'com.imdb.mobile', appName: 'IMDb', appIcon: 'https://logo.clearbit.com/imdb.com' },
      { packageName: 'tv.twitch.android.app', appName: 'Twitch', appIcon: 'https://logo.clearbit.com/twitch.tv' },
    ],
    following: ['harpers', 'alexm', 'demouser'],
  },
];

async function ensureFollow(followerId: string, followingId: string) {
  if (followerId === followingId) return;
  const existing = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(follows).values({
      followerId,
      followingId,
    });
  }
}

async function seed() {
  const usernameToId = new Map<string, string>();

  const demoUser = await db.select().from(users).where(eq(users.username, 'demouser')).limit(1);
  if (demoUser[0]) {
    usernameToId.set('demouser', demoUser[0].id);
  }

  for (const userDef of dummyUsers) {
    const [existingUser] = await db.select().from(users).where(eq(users.username, userDef.username)).limit(1);
    let userRecord = existingUser;

    if (!existingUser) {
      const passwordHash = await bcrypt.hash(userDef.password, 10);
      const inserted = await db.insert(users).values({
        email: userDef.email,
        username: userDef.username,
        passwordHash,
      }).returning();
      userRecord = inserted[0];
    } else {
      // Ensure password matches shared password for consistency
      const passwordHash = await bcrypt.hash(userDef.password, 10);
      await db.update(users)
        .set({ passwordHash, email: userDef.email })
        .where(eq(users.id, existingUser.id));
      userRecord = existingUser;
    }

    usernameToId.set(userDef.username, userRecord.id);

    const profilePayload = {
      displayName: userDef.displayName,
      bio: userDef.bio,
      avatarUrl: userDef.avatarUrl ?? null,
      showApps: userDef.showApps ?? true,
      isPrivate: userDef.isPrivate ?? false,
      updatedAt: new Date(),
    };

    const [existingProfile] = await db.select().from(profiles).where(eq(profiles.userId, userRecord.id)).limit(1);

    if (existingProfile) {
      await db.update(profiles)
        .set(profilePayload)
        .where(eq(profiles.userId, userRecord.id));
    } else {
      await db.insert(profiles).values({
        userId: userRecord.id,
        ...profilePayload,
      });
    }

    await db.delete(installedApps).where(eq(installedApps.userId, userRecord.id));

    if (userDef.apps.length > 0) {
      await db.insert(installedApps).values(
        userDef.apps.map(app => ({
          userId: userRecord.id,
          packageName: app.packageName,
          appName: app.appName,
          appIcon: app.appIcon ?? null,
          platform: app.platform ?? 'android',
          isVisible: app.isVisible ?? true,
        }))
      );
    }
  }

  for (const userDef of dummyUsers) {
    const followerId = usernameToId.get(userDef.username);
    if (!followerId || !userDef.following) continue;

    for (const targetUsername of userDef.following) {
      let targetId = usernameToId.get(targetUsername);
      if (!targetId) {
        const [targetUser] = await db.select().from(users).where(eq(users.username, targetUsername)).limit(1);
        if (targetUser) {
          usernameToId.set(targetUsername, targetUser.id);
          targetId = targetUser.id;
        }
      }

      if (targetId) {
        await ensureFollow(followerId, targetId);
      }
    }
  }

  console.log('Seeded dummy users:', dummyUsers.map(u => ({
    email: u.email,
    username: u.username,
    password: u.password,
  })));

  process.exit(0);
}

seed().catch((error) => {
  console.error('Failed to seed dummy data:', error);
  process.exit(1);
});
