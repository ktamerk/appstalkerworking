import express from 'express';
import { db } from '../db';
import { installedApps, follows, notifications, users, profiles, appsCatalog, appStatistics, appComments, appCommentLikes } from '../../shared/schema';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { eq, and, inArray, notInArray, sql, desc, ne, gte } from 'drizzle-orm';
import { broadcastToUser } from '../websocket';

const router = express.Router();

async function ensureCatalogEntry(packageName: string) {
  const [existing] = await db
    .select()
    .from(appsCatalog)
    .where(eq(appsCatalog.packageName, packageName))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [installedMeta] = await db
    .select({
      appName: installedApps.appName,
      appIcon: installedApps.appIcon,
      platform: installedApps.platform,
    })
    .from(installedApps)
    .where(eq(installedApps.packageName, packageName))
    .limit(1);

  if (!installedMeta) {
    return null;
  }

  const [inserted] = await db
    .insert(appsCatalog)
    .values({
      packageName,
      displayName: installedMeta.appName || packageName,
      iconUrl: installedMeta.appIcon || null,
      platform: installedMeta.platform || 'android',
    })
    .returning();

  return inserted;
}

const TRENDING_THRESHOLD = 3;
const TRENDING_WINDOW_HOURS = 24;

async function getTrendingApps(limit = 50) {
  const since = new Date(Date.now() - TRENDING_WINDOW_HOURS * 60 * 60 * 1000);
  const rows = await db
    .select({
      packageName: installedApps.packageName,
      appName: installedApps.appName,
      appIcon: installedApps.appIcon,
      platform: installedApps.platform,
      installCount: sql<number>`count(*)::int`,
    })
    .from(installedApps)
    .where(and(eq(installedApps.isVisible, true), gte(installedApps.installedAt, since)))
    .groupBy(
      installedApps.packageName,
      installedApps.appName,
      installedApps.appIcon,
      installedApps.platform
    )
    .having(sql`count(*) >= ${TRENDING_THRESHOLD}`)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    isTrending: row.installCount >= TRENDING_THRESHOLD,
  }));
}

function mapTrendingToRecommendations(trending: Array<{
  packageName: string;
  appName: string;
  appIcon: string | null;
  platform: string;
  installCount?: number;
}>) {
  return trending.map((app) => ({
    packageName: app.packageName,
    appName: app.appName,
    appIcon: app.appIcon,
    platform: app.platform,
    sharedCount: app.installCount ?? 0,
    matchScore: 0,
    reason: 'Popular right now',
    sharedUsers: [],
  }));
}

router.post('/sync', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { apps } = req.body;

    if (!Array.isArray(apps)) {
      return res.status(400).json({ error: 'Apps must be an array' });
    }

    const existingApps = await db.select().from(installedApps).where(eq(installedApps.userId, userId));
    const existingPackageNames = new Set(existingApps.map(app => app.packageName));

    const newApps = apps.filter((app: any) => !existingPackageNames.has(app.packageName));

    if (newApps.length > 0) {
      const insertedApps = await db.insert(installedApps)
        .values(newApps.map((app: any) => ({
          userId,
          packageName: app.packageName,
          appName: app.appName,
          appIcon: app.appIcon || null,
          platform: app.platform,
          isVisible: false,
        })))
        .returning();

      // Don't notify followers yet - wait until user makes app visible
    }

    const currentPackageNames = new Set(apps.map((app: any) => app.packageName));
    const removedApps = existingApps.filter(app => !currentPackageNames.has(app.packageName));

    if (removedApps.length > 0) {
      await db.delete(installedApps)
        .where(and(
          eq(installedApps.userId, userId),
          inArray(installedApps.packageName, removedApps.map(app => app.packageName))
        ));
    }

    const updatedApps = await db.select().from(installedApps).where(eq(installedApps.userId, userId));

    res.json({
      message: 'Apps synced successfully',
      apps: updatedApps,
      newApps: newApps.map((app: any) => ({
        packageName: app.packageName,
        appName: app.appName,
        appIcon: app.appIcon,
        platform: app.platform,
      })),
      newAppsCount: newApps.length,
      removedAppsCount: removedApps.length,
    });
  } catch (error) {
    console.error('Sync apps error:', error);
    res.status(500).json({ error: 'Failed to sync apps' });
  }
});

router.get('/recommended', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const viewerId = req.userId!;

    const viewerApps = await db
      .select({ packageName: installedApps.packageName })
      .from(installedApps)
      .where(and(eq(installedApps.userId, viewerId), eq(installedApps.isVisible, true)));

    if (viewerApps.length === 0) {
      const fallback = await getTrendingApps(10);
      return res.json({ apps: mapTrendingToRecommendations(fallback), fallbackUsed: true });
    }

    const viewerPackageNames = viewerApps.map((row) => row.packageName);

    const overlapRows = await db
      .select({
        userId: installedApps.userId,
        overlapCount: sql<number>`count(*)::int`,
      })
      .from(installedApps)
      .where(and(
        eq(installedApps.isVisible, true),
        inArray(installedApps.packageName, viewerPackageNames),
        ne(installedApps.userId, viewerId),
      ))
      .groupBy(installedApps.userId)
      .orderBy(desc(sql`count(*)`))
      .limit(100);

    if (overlapRows.length === 0) {
      const fallback = await getTrendingApps(10);
      return res.json({ apps: mapTrendingToRecommendations(fallback), fallbackUsed: true });
    }

    const overlapMap = new Map(overlapRows.map((row) => [row.userId, row.overlapCount]));
    const similarUserIds = overlapRows.map((row) => row.userId);

    const recommendedRaw = await db
      .select({
        packageName: installedApps.packageName,
        appName: installedApps.appName,
        appIcon: installedApps.appIcon,
        platform: installedApps.platform,
        userId: installedApps.userId,
      })
      .from(installedApps)
      .where(and(
        eq(installedApps.isVisible, true),
        inArray(installedApps.userId, similarUserIds),
        notInArray(installedApps.packageName, viewerPackageNames),
      ));

    if (recommendedRaw.length === 0) {
      const fallback = await getTrendingApps(10);
      return res.json({ apps: mapTrendingToRecommendations(fallback), fallbackUsed: true });
    }

    const recommendationMap = new Map<string, {
      packageName: string;
      appName: string;
      appIcon: string | null;
      platform: string;
      userIds: Set<string>;
      score: number;
    }>();

    recommendedRaw.forEach((row) => {
      const existing = recommendationMap.get(row.packageName) ?? {
        packageName: row.packageName,
        appName: row.appName,
        appIcon: row.appIcon,
        platform: row.platform,
        userIds: new Set<string>(),
        score: 0,
      };
      existing.userIds.add(row.userId);
      existing.score += overlapMap.get(row.userId) ?? 1;
      recommendationMap.set(row.packageName, existing);
    });

    const sorted = Array.from(recommendationMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    const sampleUserIds = Array.from(new Set(sorted.flatMap((entry) => Array.from(entry.userIds).slice(0, 3))));
    let sampleMap = new Map<string, any>();

    if (sampleUserIds.length > 0) {
      const sampleUsers = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        })
        .from(users)
        .innerJoin(profiles, eq(users.id, profiles.userId))
        .where(inArray(users.id, sampleUserIds));

      sampleMap = new Map(sampleUsers.map((user) => [user.id, user]));
    }

    const myAppCount = viewerPackageNames.length || 1;

    const payload = sorted.map((entry) => {
      const userList = Array.from(entry.userIds);
      const bestOverlap = userList.reduce((max, id) => Math.max(max, overlapMap.get(id) ?? 0), 0);
      const matchScore = Math.min(100, Math.round((bestOverlap / myAppCount) * 100));
      const sharedUsers = userList
        .slice(0, 3)
        .map((id) => sampleMap.get(id))
        .filter(Boolean);

      const reason = sharedUsers[0]?.displayName
        ? `${sharedUsers[0].displayName} also uses this`
        : `${entry.userIds.size} similar people use this`;

      return {
        packageName: entry.packageName,
        appName: entry.appName,
        appIcon: entry.appIcon,
        platform: entry.platform,
        sharedCount: entry.userIds.size,
        matchScore,
        reason,
        sharedUsers,
      };
    });

    res.json({ apps: payload, fallbackUsed: false });
  } catch (error) {
    console.error('Get recommended apps error:', error);
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

router.get('/catalog/:packageName', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { packageName } = req.params;
    const viewerId = req.userId!;
    const catalogEntry = await ensureCatalogEntry(packageName);

    if (!catalogEntry) {
      return res.status(404).json({ error: 'App not found' });
    }

    const [statsRow] = await db
      .select()
      .from(appStatistics)
      .where(eq(appStatistics.appId, catalogEntry.id))
      .limit(1);

    let visibleInstallCount = statsRow?.visibleInstallCount ?? 0;
    let totalInstallCount = statsRow?.totalInstallCount ?? 0;

    if (!statsRow) {
      const [visible] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(installedApps)
        .where(
          and(
            eq(installedApps.packageName, packageName),
            eq(installedApps.isVisible, true)
          )
        );

      const [total] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(installedApps)
        .where(eq(installedApps.packageName, packageName));

      visibleInstallCount = Number(visible?.count ?? 0);
      totalInstallCount = Number(total?.count ?? 0);
    }

    const followingRows = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, viewerId));
    const allowedIds = new Set<string>([viewerId, ...followingRows.map((row) => row.id)]);

    const usersWithAppRaw = await db
      .select({
        userId: users.id,
        username: users.username,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(installedApps)
      .innerJoin(users, eq(installedApps.userId, users.id))
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(
        and(
          eq(installedApps.packageName, packageName),
          eq(installedApps.isVisible, true)
        )
      );

    const usersWithApp = usersWithAppRaw
      .filter((item) => allowedIds.has(item.userId))
      .slice(0, 20);
    const friendsCount = usersWithAppRaw.filter((item) => allowedIds.has(item.userId)).length;
    const isTrending = visibleInstallCount >= TRENDING_THRESHOLD;

    const comments = await db
      .select({
        id: appComments.id,
        body: appComments.body,
        createdAt: appComments.createdAt,
        parentId: appComments.parentId,
        likesCount: sql<number>`(
          select count(*)::int from ${appCommentLikes}
          where ${appCommentLikes.commentId} = ${appComments.id}
        )`,
        likedByViewer: sql<boolean>`exists(
          select 1 from ${appCommentLikes}
          where ${appCommentLikes.commentId} = ${appComments.id}
          and ${appCommentLikes.userId} = ${viewerId}
        )`,
        user: {
          id: users.id,
          username: users.username,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(appComments)
      .innerJoin(users, eq(appComments.userId, users.id))
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(appComments.appId, catalogEntry.id))
      .orderBy(desc(appComments.createdAt))
      .limit(20);

    res.json({
      app: {
        id: catalogEntry.id,
        packageName: catalogEntry.packageName,
        displayName: catalogEntry.displayName,
        category: catalogEntry.category,
        description: catalogEntry.description,
        storeUrl: catalogEntry.storeUrl,
        iconUrl: catalogEntry.iconUrl,
        developer: catalogEntry.developer,
        platform: catalogEntry.platform,
      },
      stats: {
        visibleInstallCount,
        totalInstallCount,
        isTrending,
        friendsCount,
      },
      users: usersWithApp,
      comments,
    });
  } catch (error) {
    console.error('Get app detail error:', error);
    res.status(500).json({ error: 'Failed to load app details' });
  }
});

router.get('/catalog/:packageName/comments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { packageName } = req.params;
    const viewerId = req.userId!;
    const catalogEntry = await ensureCatalogEntry(packageName);

    if (!catalogEntry) {
      return res.status(404).json({ error: 'App not found' });
    }

    const limit = parseInt(req.query.limit as string) || 50;

    const comments = await db
      .select({
        id: appComments.id,
        body: appComments.body,
        createdAt: appComments.createdAt,
        parentId: appComments.parentId,
        likesCount: sql<number>`(
          select count(*)::int from ${appCommentLikes}
          where ${appCommentLikes.commentId} = ${appComments.id}
        )`,
        likedByViewer: sql<boolean>`exists(
          select 1 from ${appCommentLikes}
          where ${appCommentLikes.commentId} = ${appComments.id}
          and ${appCommentLikes.userId} = ${viewerId}
        )`,
        user: {
          id: users.id,
          username: users.username,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(appComments)
      .innerJoin(users, eq(appComments.userId, users.id))
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(appComments.appId, catalogEntry.id))
      .orderBy(desc(appComments.createdAt))
      .limit(limit);

    res.json({ comments });
  } catch (error) {
    console.error('Get app comments error:', error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

router.post('/catalog/:packageName/comments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { packageName } = req.params;
    const userId = req.userId!;
    const { message, parentId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length < 2) {
      return res.status(400).json({ error: 'Comment must be at least 2 characters' });
    }

    const catalogEntry = await ensureCatalogEntry(packageName);
    if (!catalogEntry) {
      return res.status(404).json({ error: 'App not found' });
    }

    if (parentId) {
      const [parentComment] = await db
        .select()
        .from(appComments)
        .where(eq(appComments.id, parentId))
        .limit(1);

      if (!parentComment || parentComment.appId !== catalogEntry.id) {
        return res.status(400).json({ error: 'Invalid parent comment' });
      }
    }

    const [newComment] = await db
      .insert(appComments)
      .values({
        appId: catalogEntry.id,
        userId,
        body: message.trim(),
        parentId: parentId || null,
      })
      .returning();

    const [author] = await db
      .select({
        username: users.username,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    res.status(201).json({
      comment: {
        id: newComment.id,
        body: newComment.body,
        createdAt: newComment.createdAt,
        parentId: newComment.parentId,
        user: {
          id: userId,
          username: author?.username,
          displayName: author?.displayName,
          avatarUrl: author?.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error('Create app comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.post('/catalog/:packageName/comments/:commentId/like', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { packageName, commentId } = req.params;
    const userId = req.userId!;
    const catalogEntry = await ensureCatalogEntry(packageName);
    if (!catalogEntry) {
      return res.status(404).json({ error: 'App not found' });
    }

    const [comment] = await db
      .select()
      .from(appComments)
      .where(eq(appComments.id, commentId))
      .limit(1);

    if (!comment || comment.appId !== catalogEntry.id) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const existing = await db
      .select()
      .from(appCommentLikes)
      .where(and(eq(appCommentLikes.commentId, commentId), eq(appCommentLikes.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(appCommentLikes).values({
        commentId,
        userId,
      });
    }

    res.json({ message: 'Liked comment' });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

router.delete('/catalog/:packageName/comments/:commentId/like', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { packageName, commentId } = req.params;
    const userId = req.userId!;
    const catalogEntry = await ensureCatalogEntry(packageName);
    if (!catalogEntry) {
      return res.status(404).json({ error: 'App not found' });
    }

    const [comment] = await db
      .select()
      .from(appComments)
      .where(eq(appComments.id, commentId))
      .limit(1);

    if (!comment || comment.appId !== catalogEntry.id) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await db
      .delete(appCommentLikes)
      .where(and(eq(appCommentLikes.commentId, commentId), eq(appCommentLikes.userId, userId)));

    res.json({ message: 'Like removed' });
  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({ error: 'Failed to remove like' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const apps = await db.select().from(installedApps)
      .where(eq(installedApps.userId, userId))
      .orderBy(installedApps.installedAt);

    res.json({ apps });
  } catch (error) {
    console.error('Get apps error:', error);
    res.status(500).json({ error: 'Failed to get apps' });
  }
});

router.put('/:appId/visibility', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { appId } = req.params;
    const { isVisible } = req.body;

    const [updatedApp] = await db.update(installedApps)
      .set({ isVisible })
      .where(and(eq(installedApps.id, appId), eq(installedApps.userId, userId)))
      .returning();

    if (!updatedApp) {
      return res.status(404).json({ error: 'App not found' });
    }

    // If app becomes visible, notify followers
    if (isVisible && !updatedApp.isVisible) {
      const followers = await db.select().from(follows).where(eq(follows.followingId, userId));
      
      for (const follower of followers) {
        const [notification] = await db.insert(notifications).values({
          userId: follower.followerId,
          type: 'new_app',
          content: `installed ${updatedApp.appName}`,
          relatedUserId: userId,
          relatedAppId: updatedApp.id,
        }).returning();

        broadcastToUser(follower.followerId, {
          type: 'notification',
          data: notification,
        });
      }
    }

    res.json({
      message: 'App visibility updated',
      app: updatedApp,
    });
  } catch (error) {
    console.error('Update app visibility error:', error);
    res.status(500).json({ error: 'Failed to update app visibility' });
  }
});

router.post('/visibility/bulk', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates must be a non-empty array' });
    }

    const updatedApps = [];
    const nowVisibleApps = [];

    for (const update of updates) {
      const { packageName, isVisible } = update;
      
      if (!packageName || typeof isVisible !== 'boolean') {
        continue;
      }

      const [app] = await db.select()
        .from(installedApps)
        .where(and(
          eq(installedApps.userId, userId),
          eq(installedApps.packageName, packageName)
        ));

      if (app) {
        const [updatedApp] = await db.update(installedApps)
          .set({ isVisible })
          .where(and(
            eq(installedApps.userId, userId),
            eq(installedApps.packageName, packageName)
          ))
          .returning();

        updatedApps.push(updatedApp);

        // Track newly visible apps for notifications
        if (isVisible && !app.isVisible) {
          nowVisibleApps.push(updatedApp);
        }
      }
    }

    // Notify followers about newly visible apps
    if (nowVisibleApps.length > 0) {
      const followers = await db.select().from(follows).where(eq(follows.followingId, userId));
      
      for (const app of nowVisibleApps) {
        for (const follower of followers) {
          const metadata = JSON.stringify({
            appName: app.appName,
            packageName: app.packageName,
            platform: app.platform,
          });

          const [notification] = await db.insert(notifications).values({
            userId: follower.followerId,
            type: 'new_app',
            content: `installed ${app.appName}`,
            relatedUserId: userId,
            relatedAppId: app.id,
            metadata,
          }).returning();

          broadcastToUser(follower.followerId, {
            type: 'notification',
            data: notification,
          });
        }

        if (followers.length > 0) {
          await db.update(installedApps)
            .set({
              discoverCount: sql`${installedApps.discoverCount} + ${followers.length}`,
            })
            .where(eq(installedApps.id, app.id));
        }
      }
    }

    res.json({
      message: 'Apps visibility updated',
      updatedCount: updatedApps.length,
      apps: updatedApps,
    });
  } catch (error) {
    console.error('Bulk update app visibility error:', error);
    res.status(500).json({ error: 'Failed to update apps visibility' });
  }
});

// Get trending apps (most installed by visible apps)
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const trendingApps = await getTrendingApps(limit);
    res.json({ apps: trendingApps });
  } catch (error) {
    console.error('Get trending apps error:', error);
    res.status(500).json({ error: 'Failed to get trending apps' });
  }
});

// Search users by app (who uses this app?)
router.get('/search/:packageName/users', async (req, res) => {
  try {
    const { packageName } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Get users who have this app visible
    const usersWithApp = await db
      .select({
        user: users,
        profile: profiles,
      })
      .from(installedApps)
      .innerJoin(users, eq(installedApps.userId, users.id))
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(
        eq(installedApps.packageName, packageName),
        eq(installedApps.isVisible, true)
      ))
      .limit(limit);
    
    res.json({
      users: usersWithApp.map(({ user, profile }) => ({
        userId: user.id,
        username: user.username,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      })),
    });
  } catch (error) {
    console.error('Search users by app error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Global app search by name or package
router.get('/search', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const limit = parseInt(req.query.limit as string) || 30;
    if (!q) {
      return res.json({ apps: [] });
    }

    const pattern = `%${q.toLowerCase()}%`;

    const results = await db
      .select({
        packageName: installedApps.packageName,
        appName: installedApps.appName,
        appIcon: installedApps.appIcon,
        platform: installedApps.platform,
        installCount: sql<number>`count(*)::int`,
      })
      .from(installedApps)
      .where(and(
        eq(installedApps.isVisible, true),
        sql`lower(${installedApps.appName}) LIKE ${pattern} OR lower(${installedApps.packageName}) LIKE ${pattern}`
      ))
      .groupBy(
        installedApps.packageName,
        installedApps.appName,
        installedApps.appIcon,
        installedApps.platform
      )
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    res.json({ apps: results });
  } catch (error) {
    console.error('App search error:', error);
    res.status(500).json({ error: 'Failed to search apps' });
  }
});

export default router;
