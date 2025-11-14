import express from 'express';
import { db } from '../db';
import { users, profiles, installedApps, follows, likes, profileLinks } from '../../shared/schema';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { eq, and, sql } from 'drizzle-orm';

const router = express.Router();

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

    if (!user || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const followersCount = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, userId));

    const followingCount = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const apps = profile.showApps ? await db.select().from(installedApps)
      .where(and(eq(installedApps.userId, userId), eq(installedApps.isVisible, true)))
      .orderBy(installedApps.installedAt) : [];

    const links = await db.select().from(profileLinks)
      .where(eq(profileLinks.userId, userId))
      .orderBy(profileLinks.sortOrder, profileLinks.createdAt);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      profile: {
        ...profile,
        followersCount: Number(followersCount[0].count),
        followingCount: Number(followingCount[0].count),
        links,
      },
      apps,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.get('/:username', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.userId!;

    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const [isFollowing] = await db.select()
      .from(follows)
      .where(and(eq(follows.followerId, currentUserId), eq(follows.followingId, user.id)))
      .limit(1);

    if (profile.isPrivate && currentUserId !== user.id && !isFollowing) {
      return res.status(403).json({ error: 'This profile is private' });
    }

    const followersCount = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, user.id));

    const followingCount = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, user.id));

    const apps = profile.showApps ? await db.select().from(installedApps)
      .where(and(eq(installedApps.userId, user.id), eq(installedApps.isVisible, true)))
      .orderBy(installedApps.installedAt) : [];

    const links = await db.select().from(profileLinks)
      .where(eq(profileLinks.userId, user.id))
      .orderBy(profileLinks.sortOrder, profileLinks.createdAt);

    res.json({
      user: {
        id: user.id,
        username: user.username,
      },
      profile: {
        ...profile,
        followersCount: Number(followersCount[0].count),
        followingCount: Number(followingCount[0].count),
        isFollowing: !!isFollowing,
        links,
      },
      apps: apps,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.put('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { displayName, bio, avatarUrl, showApps, isPrivate } = req.body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (displayName) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (showApps !== undefined) updateData.showApps = showApps;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    const [updatedProfile] = await db.update(profiles)
      .set(updateData)
      .where(eq(profiles.userId, userId))
      .returning();

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/upload-avatar', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { avatar } = req.body;

    if (!avatar || !avatar.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid avatar data' });
    }

    const [updatedProfile] = await db.update(profiles)
      .set({
        avatarUrl: avatar,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: updatedProfile.avatarUrl,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

router.get('/search/:query', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { query } = req.params;
    
    const searchResults = await db.select({
      id: users.id,
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      bio: profiles.bio,
    })
      .from(users)
      .innerJoin(profiles, eq(users.id, profiles.userId))
      .where(sql`${users.username} ILIKE ${`%${query}%`} OR ${profiles.displayName} ILIKE ${`%${query}%`}`)
      .limit(20);

    res.json({ users: searchResults });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/liked', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const likedProfiles = await db.select({
      id: profiles.id,
      userId: users.id,
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      bio: profiles.bio,
    })
      .from(likes)
      .innerJoin(profiles, eq(likes.profileId, profiles.id))
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(likes.userId, userId))
      .orderBy(likes.createdAt);

    res.json({ profiles: likedProfiles });
  } catch (error) {
    console.error('Get liked profiles error:', error);
    res.status(500).json({ error: 'Failed to get liked profiles' });
  }
});

const isValidLink = (url: string) => /^https?:\/\//i.test(url);

router.get('/links', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const links = await db.select().from(profileLinks)
      .where(eq(profileLinks.userId, userId))
      .orderBy(profileLinks.sortOrder, profileLinks.createdAt);
    res.json({ links });
  } catch (error) {
    console.error('Get profile links error:', error);
    res.status(500).json({ error: 'Failed to load links' });
  }
});

router.post('/links', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { platform, url, label, sortOrder } = req.body;

    if (!platform || !url || !isValidLink(url)) {
      return res.status(400).json({ error: 'Platform and valid URL are required' });
    }

    const [inserted] = await db.insert(profileLinks).values({
      userId,
      platform,
      url,
      label: label || platform,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
    }).returning();

    res.status(201).json({ link: inserted });
  } catch (error) {
    console.error('Create profile link error:', error);
    res.status(500).json({ error: 'Failed to create link' });
  }
});

router.put('/links/:linkId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { linkId } = req.params;
    const { platform, url, label, sortOrder } = req.body;

    if (url && !isValidLink(url)) {
      return res.status(400).json({ error: 'URL must start with http or https' });
    }

    const [existing] = await db.select().from(profileLinks)
      .where(eq(profileLinks.id, linkId))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const [updated] = await db.update(profileLinks)
      .set({
        platform: platform ?? existing.platform,
        url: url ?? existing.url,
        label: label ?? existing.label,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : existing.sortOrder,
      })
      .where(eq(profileLinks.id, linkId))
      .returning();

    res.json({ link: updated });
  } catch (error) {
    console.error('Update profile link error:', error);
    res.status(500).json({ error: 'Failed to update link' });
  }
});

router.delete('/links/:linkId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { linkId } = req.params;

    const [existing] = await db.select().from(profileLinks)
      .where(eq(profileLinks.id, linkId))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Link not found' });
    }

    await db.delete(profileLinks).where(eq(profileLinks.id, linkId));
    res.json({ message: 'Link removed' });
  } catch (error) {
    console.error('Delete profile link error:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

export default router;
