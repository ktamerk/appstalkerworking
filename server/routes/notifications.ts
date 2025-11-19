import express from 'express';
import { db } from '../db';
import { notifications, users, profiles, follows, installedApps } from '../../shared/schema';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { eq, and, gte, sql } from 'drizzle-orm';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const userNotifications = await db.select({
      id: notifications.id,
      type: notifications.type,
      content: notifications.content,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      relatedUser: {
        id: users.id,
        username: users.username,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
      .from(notifications)
      .leftJoin(users, eq(notifications.relatedUserId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt)
      .limit(50);

    res.json({ notifications: userNotifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

router.get('/highlights', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const weeklyStats = await db
      .select({
        type: notifications.type,
        count: sql<number>`count(*)::int`,
      })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        gte(notifications.createdAt, since),
      ))
      .groupBy(notifications.type);

    const statsMap = new Map(weeklyStats.map((row) => [row.type, row.count]));
    const stats = {
      newFollowers: statsMap.get('new_follower') ?? 0,
      appInstalls: statsMap.get('new_app') ?? 0,
      profileLikes: statsMap.get('profile_like') ?? 0,
    };

    const installLabel = stats.appInstalls === 1 ? 'friend' : 'friends';
    const digest = {
      summary: `This week: ${stats.appInstalls} ${installLabel} installed new apps`,
      stats,
      since: since.toISOString(),
    };

    const [followerRow] = await db
      .select({ followersCount: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followingId, userId));

    const [discoverRow] = await db
      .select({ discoveryCount: sql<number>`coalesce(sum(${installedApps.discoverCount}), 0)::int` })
      .from(installedApps)
      .where(eq(installedApps.userId, userId));

    const milestones = [
      {
        id: 'discoveries_10',
        title: '🎉 10 people discovered apps from you!',
        progress: discoverRow?.discoveryCount ?? 0,
        target: 10,
      },
      {
        id: 'followers_10',
        title: '🌟 Your profile reached 10 followers',
        progress: followerRow?.followersCount ?? 0,
        target: 10,
      },
    ];

    res.json({ digest, milestones });
  } catch (error) {
    console.error('Get highlights error:', error);
    res.status(500).json({ error: 'Failed to load highlights' });
  }
});

router.put('/:notificationId/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { notificationId } = req.params;

    const [updated] = await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notification: updated,
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.put('/read-all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
