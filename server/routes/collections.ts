import express from 'express';
import { db } from '../db';
import { collections, collectionApps } from '../../shared/schema';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { eq, and, desc } from 'drizzle-orm';

const router = express.Router();

// Get all collections for current user
router.get('/my', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    
    const userCollections = await db
      .select()
      .from(collections)
      .where(eq(collections.userId, userId))
      .orderBy(desc(collections.createdAt));
    
    const collectionsWithApps = await Promise.all(
      userCollections.map(async (collection) => {
        const apps = await db
          .select()
          .from(collectionApps)
          .where(eq(collectionApps.collectionId, collection.id));
        
        return {
          ...collection,
          apps,
          appCount: apps.length,
        };
      })
    );
    
    res.json({ collections: collectionsWithApps });
  } catch (error) {
    console.error('Get my collections error:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get public collections by user
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username),
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userCollections = await db
      .select()
      .from(collections)
      .where(and(
        eq(collections.userId, user.id),
        eq(collections.isPublic, true)
      ))
      .orderBy(desc(collections.createdAt));
    
    const collectionsWithApps = await Promise.all(
      userCollections.map(async (collection) => {
        const apps = await db
          .select()
          .from(collectionApps)
          .where(eq(collectionApps.collectionId, collection.id));
        
        return {
          ...collection,
          apps,
          appCount: apps.length,
        };
      })
    );
    
    res.json({ collections: collectionsWithApps });
  } catch (error) {
    console.error('Get user collections error:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get specific collection
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = await db.query.collections.findFirst({
      where: (collections, { eq }) => eq(collections.id, id),
    });
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const apps = await db
      .select()
      .from(collectionApps)
      .where(eq(collectionApps.collectionId, id));
    
    res.json({
      collection: {
        ...collection,
        apps,
        appCount: apps.length,
      },
    });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Create new collection
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { title, description, isPublic = true, apps } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const [newCollection] = await db
      .insert(collections)
      .values({
        userId,
        title,
        description,
        isPublic,
      })
      .returning();
    
    if (apps && apps.length > 0) {
      await db.insert(collectionApps).values(
        apps.map((app: any) => ({
          collectionId: newCollection.id,
          packageName: app.packageName,
          appName: app.appName,
          appIcon: app.appIcon,
          platform: app.platform || 'android',
          note: app.note,
        }))
      );
    }
    
    res.json({ collection: newCollection });
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Update collection
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, description, isPublic } = req.body;
    
    const collection = await db.query.collections.findFirst({
      where: (collections, { eq }) => eq(collections.id, id),
    });
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    if (collection.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const [updated] = await db
      .update(collections)
      .set({ title, description, isPublic, updatedAt: new Date() })
      .where(eq(collections.id, id))
      .returning();
    
    res.json({ collection: updated });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete collection
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    
    const collection = await db.query.collections.findFirst({
      where: (collections, { eq }) => eq(collections.id, id),
    });
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    if (collection.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await db.delete(collections).where(eq(collections.id, id));
    
    res.json({ message: 'Collection deleted' });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// Add app to collection
router.post('/:id/apps', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { packageName, appName, appIcon, platform, note } = req.body;
    
    const collection = await db.query.collections.findFirst({
      where: (collections, { eq }) => eq(collections.id, id),
    });
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    if (collection.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const [newApp] = await db
      .insert(collectionApps)
      .values({
        collectionId: id,
        packageName,
        appName,
        appIcon,
        platform: platform || 'android',
        note,
      })
      .returning();
    
    res.json({ app: newApp });
  } catch (error) {
    console.error('Add app to collection error:', error);
    res.status(500).json({ error: 'Failed to add app' });
  }
});

// Remove app from collection
router.delete('/:id/apps/:appId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id, appId } = req.params;
    
    const collection = await db.query.collections.findFirst({
      where: (collections, { eq }) => eq(collections.id, id),
    });
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    if (collection.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await db.delete(collectionApps).where(eq(collectionApps.id, appId));
    
    res.json({ message: 'App removed from collection' });
  } catch (error) {
    console.error('Remove app from collection error:', error);
    res.status(500).json({ error: 'Failed to remove app' });
  }
});

export default router;
