import 'dotenv/config';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { notifications, users } from '../../shared/schema';

async function seedNotifications() {
  try {
    const targetUsernames = ['demouser', 'alexm', 'miachen', 'oliviaw', 'noahr'];
    const userRecords = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(inArray(users.username, targetUsernames));

    const demoUser = userRecords.find((u) => u.username === 'demouser');
    if (!demoUser) {
      throw new Error('demouser bulunamadı');
    }

    const getUserId = (username: string) =>
      userRecords.find((u) => u.username === username)?.id;

    const payload = [
      {
        userId: demoUser.id,
        type: 'new_follower',
        content: 'alexm started following you',
        relatedUserId: getUserId('alexm'),
      },
      {
        userId: demoUser.id,
        type: 'new_app',
        content: 'miachen installed Spotify',
        relatedUserId: getUserId('miachen'),
      },
      {
        userId: demoUser.id,
        type: 'profile_like',
        content: 'oliviaw liked your profile',
        relatedUserId: getUserId('oliviaw'),
      },
      {
        userId: demoUser.id,
        type: 'friend_request',
        content: 'noahr sent you a friend request',
        relatedUserId: getUserId('noahr'),
      },
    ].filter((n) => n.relatedUserId);

    await db.insert(notifications).values(payload);
    console.log('Dummy notifications inserted for demo user');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed notifications:', error);
    process.exit(1);
  }
}

seedNotifications();
