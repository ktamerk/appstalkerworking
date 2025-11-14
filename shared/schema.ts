import { pgTable, text, timestamp, uuid, boolean, integer, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  isPrivate: boolean('is_private').default(false).notNull(),
  showApps: boolean('show_apps').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const installedApps = pgTable('installed_apps', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  packageName: text('package_name').notNull(),
  appName: text('app_name').notNull(),
  appIcon: text('app_icon'),
  platform: text('platform').notNull(),
  installedAt: timestamp('installed_at').defaultNow().notNull(),
  isVisible: boolean('is_visible').default(true).notNull(),
  category: text('category'),
  storeUrl: text('store_url'),
  discoverCount: integer('discover_count').default(0).notNull(),
}, (table) => ({
  uniqueUserApp: unique().on(table.userId, table.packageName),
  packageNameIdx: index('installed_apps_package_name_idx').on(table.packageName),
  visibilityIdx: index('installed_apps_visibility_idx').on(table.isVisible),
  packageVisibilityIdx: index('installed_apps_pkg_vis_idx').on(table.packageName, table.isVisible),
}));

export const follows = pgTable('follows', {
  id: uuid('id').defaultRandom().primaryKey(),
  followerId: uuid('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followingId: uuid('following_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueFollow: unique().on(table.followerId, table.followingId),
}));

export const friendRequests = pgTable('friend_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  receiverId: uuid('receiver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueRequest: unique().on(table.senderId, table.receiverId),
}));

export const likes = pgTable('likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueLike: unique().on(table.userId, table.profileId),
}));

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  content: text('content').notNull(),
  relatedUserId: uuid('related_user_id').references(() => users.id, { onDelete: 'cascade' }),
  relatedAppId: uuid('related_app_id').references(() => installedApps.id, { onDelete: 'cascade' }),
  isRead: boolean('is_read').default(false).notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actionType: text('action_type').notNull(),
  metadata: text('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const collections = pgTable('collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('collections_user_id_idx').on(table.userId),
}));

export const collectionApps = pgTable('collection_apps', {
  id: uuid('id').defaultRandom().primaryKey(),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(),
  packageName: text('package_name').notNull(),
  appName: text('app_name').notNull(),
  appIcon: text('app_icon'),
  platform: text('platform').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueCollectionApp: unique().on(table.collectionId, table.packageName),
  collectionIdIdx: index('collection_apps_collection_id_idx').on(table.collectionId),
  packageNameIdx: index('collection_apps_package_name_idx').on(table.packageName),
}));

export const appsCatalog = pgTable('apps_catalog', {
  id: uuid('id').defaultRandom().primaryKey(),
  packageName: text('package_name').notNull().unique(),
  displayName: text('display_name').notNull(),
  category: text('category'),
  description: text('description'),
  storeUrl: text('store_url'),
  iconUrl: text('icon_url'),
  developer: text('developer'),
  platform: text('platform').default('android').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appStatistics = pgTable('app_statistics', {
  appId: uuid('app_id').references(() => appsCatalog.id, { onDelete: 'cascade' }).primaryKey(),
  visibleInstallCount: integer('visible_install_count').default(0).notNull(),
  totalInstallCount: integer('total_install_count').default(0).notNull(),
  lastComputedAt: timestamp('last_computed_at').defaultNow().notNull(),
});

export const appComments = pgTable('app_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  appId: uuid('app_id').references(() => appsCatalog.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  body: text('body').notNull(),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appCommentLikes = pgTable('app_comment_likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  commentId: uuid('comment_id').references(() => appComments.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueCommentLike: unique().on(table.commentId, table.userId),
}));

export const appInstallHistory = pgTable('app_install_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  installedAppId: uuid('installed_app_id').references(() => installedApps.id, { onDelete: 'cascade' }).notNull(),
  eventType: text('event_type').notNull(), // installed | uninstalled | visibility_change
  eventAt: timestamp('event_at').defaultNow().notNull(),
});

export const profileLinks = pgTable('profile_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  platform: text('platform').notNull(), // instagram, twitter, youtube, blog, other
  label: text('label'),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userSimilarities = pgTable('user_similarities', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  otherUserId: uuid('other_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(), // 0-100 or scaled percentage
  overlapCount: integer('overlap_count').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueSimilarity: unique().on(table.userId, table.otherUserId),
}));

export const userMilestones = pgTable('user_milestones', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // discoveries, profile_views, etc.
  value: integer('value').notNull(),
  metadata: text('metadata'),
  achievedAt: timestamp('achieved_at').defaultNow().notNull(),
});

export const notificationDigests = pgTable('notification_digests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  summary: text('summary').notNull(),
  weekStart: timestamp('week_start').notNull(),
  sentAt: timestamp('sent_at'),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  installedApps: many(installedApps),
  following: many(follows, { relationName: 'following' }),
  followers: many(follows, { relationName: 'followers' }),
  sentRequests: many(friendRequests, { relationName: 'sentRequests' }),
  receivedRequests: many(friendRequests, { relationName: 'receivedRequests' }),
  likes: many(likes),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
  collections: many(collections),
  links: many(profileLinks),
  comments: many(appComments),
  similarityScores: many(userSimilarities),
  milestones: many(userMilestones),
  notificationDigests: many(notificationDigests),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  likes: many(likes),
  links: many(profileLinks),
}));

export const installedAppsRelations = relations(installedApps, ({ one }) => ({
  user: one(users, {
    fields: [installedApps.userId],
    references: [users.id],
  }),
  catalog: one(appsCatalog, {
    fields: [installedApps.packageName],
    references: [appsCatalog.packageName],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: 'following',
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: 'followers',
  }),
}));

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  sender: one(users, {
    fields: [friendRequests.senderId],
    references: [users.id],
    relationName: 'sentRequests',
  }),
  receiver: one(users, {
    fields: [friendRequests.receiverId],
    references: [users.id],
    relationName: 'receivedRequests',
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  profile: one(profiles, {
    fields: [likes.profileId],
    references: [profiles.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedUser: one(users, {
    fields: [notifications.relatedUserId],
    references: [users.id],
  }),
  relatedApp: one(installedApps, {
    fields: [notifications.relatedAppId],
    references: [installedApps.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  apps: many(collectionApps),
}));

export const collectionAppsRelations = relations(collectionApps, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionApps.collectionId],
    references: [collections.id],
  }),
}));

export const appsCatalogRelations = relations(appsCatalog, ({ many }) => ({
  statistics: many(appStatistics),
  comments: many(appComments),
}));

export const appStatisticsRelations = relations(appStatistics, ({ one }) => ({
  app: one(appsCatalog, {
    fields: [appStatistics.appId],
    references: [appsCatalog.id],
  }),
}));

export const appCommentsRelations = relations(appComments, ({ one }) => ({
  app: one(appsCatalog, {
    fields: [appComments.appId],
    references: [appsCatalog.id],
  }),
  user: one(users, {
    fields: [appComments.userId],
    references: [users.id],
  }),
  parent: one(appComments, {
    fields: [appComments.parentId],
    references: [appComments.id],
  }),
}));

export const appCommentLikesRelations = relations(appCommentLikes, ({ one }) => ({
  comment: one(appComments, {
    fields: [appCommentLikes.commentId],
    references: [appComments.id],
  }),
  user: one(users, {
    fields: [appCommentLikes.userId],
    references: [users.id],
  }),
}));

export const appInstallHistoryRelations = relations(appInstallHistory, ({ one }) => ({
  installedApp: one(installedApps, {
    fields: [appInstallHistory.installedAppId],
    references: [installedApps.id],
  }),
}));

export const profileLinksRelations = relations(profileLinks, ({ one }) => ({
  user: one(users, {
    fields: [profileLinks.userId],
    references: [users.id],
  }),
}));

export const userSimilaritiesRelations = relations(userSimilarities, ({ one }) => ({
  user: one(users, {
    fields: [userSimilarities.userId],
    references: [users.id],
  }),
  otherUser: one(users, {
    fields: [userSimilarities.otherUserId],
    references: [users.id],
  }),
}));

export const userMilestonesRelations = relations(userMilestones, ({ one }) => ({
  user: one(users, {
    fields: [userMilestones.userId],
    references: [users.id],
  }),
}));

export const notificationDigestsRelations = relations(notificationDigests, ({ one }) => ({
  user: one(users, {
    fields: [notificationDigests.userId],
    references: [users.id],
  }),
}));
