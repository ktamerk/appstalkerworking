import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  parentId?: string | null;
  likesCount?: number;
  likedByViewer?: boolean;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string | null;
  };
}

interface UserSnippet {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export default function AppDetailScreen({ route }: any) {
  const { packageName, appName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserSnippet[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likeBusy, setLikeBusy] = useState<Record<string, boolean>>({});
  const friendsCount = stats?.friendsCount ?? users.length;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.APPS.DETAIL(packageName));
      setAppData(response.data.app);
      setStats(response.data.stats || null);
      setUsers(response.data.users || []);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Load app detail error:', error);
      Alert.alert('Error', 'Failed to load app details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [packageName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInstallPress = () => {
    if (appData?.storeUrl) {
      Linking.openURL(appData.storeUrl);
    } else {
      Alert.alert('Store link not available');
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      const response = await api.post(API_ENDPOINTS.APPS.COMMENTS(packageName), {
        message: newComment.trim(),
      });
      setComments((prev) => [response.data.comment, ...prev]);
      setNewComment('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add comment');
    }
  };

  const handleToggleLike = async (comment: Comment) => {
    // pessimistic lock to avoid rapid toggles causing race conditions
    if (likeBusy[comment.id]) return;
    const currentlyLiked = Boolean(comment.likedByViewer);
    setLikeBusy((prev) => ({ ...prev, [comment.id]: true }));
    try {
      if (currentlyLiked) {
        await api.delete(API_ENDPOINTS.APPS.COMMENT_LIKE(packageName, comment.id));
      } else {
        await api.post(API_ENDPOINTS.APPS.COMMENT_LIKE(packageName, comment.id), {});
      }
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? {
                ...c,
                likedByViewer: !currentlyLiked,
                likesCount: Math.max(0, (c.likesCount || 0) + (currentlyLiked ? -1 : 1)),
              }
            : c
        )
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update like');
    } finally {
      setLikeBusy((prev) => {
        const next = { ...prev };
        delete next[comment.id];
        return next;
      });
    }
  };

  const renderUser = (item: UserSnippet) => (
    <TouchableOpacity style={styles.userCard} key={item.userId}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.userAvatar} />
      ) : (
        <View style={styles.userAvatarFallback}>
          <Text style={styles.userAvatarInitial}>{item.displayName?.[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View>
        <Text style={styles.userName}>{item.displayName}</Text>
        <Text style={styles.userHandle}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#6750F8" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          {appData?.iconUrl ? (
            <Image source={{ uri: appData.iconUrl }} style={styles.appIcon} />
          ) : (
            <View style={styles.appIconFallback}>
              <Text style={styles.appIconInitial}>{(appData?.displayName || appName)[0]}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>{appData?.displayName || appName}</Text>
            {appData?.category && <Text style={styles.appCategory}>{appData.category}</Text>}
          </View>
          <TouchableOpacity style={styles.installButton} onPress={handleInstallPress}>
            <Ionicons name="cloud-download-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.badgeRow}>
          {stats?.isTrending && <Text style={[styles.badge, styles.badgeTrending]}>Trending</Text>}
          {appData?.category && <Text style={styles.badge}>{appData.category}</Text>}
          <Text style={styles.badge}>{(stats?.totalInstallCount ?? 0)} total</Text>
          <Text style={styles.badge}>{(stats?.visibleInstallCount ?? 0)} visible</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Visible Installs</Text>
            <Text style={styles.statValue}>{stats?.visibleInstallCount ?? 0}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Total Installs</Text>
            <Text style={styles.statValue}>{stats?.totalInstallCount ?? 0}</Text>
          </View>
        </View>
        {appData?.description ? (
          <Text style={styles.description}>{appData.description}</Text>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Who uses it</Text>
          <Text style={styles.sectionBadge}>{friendsCount} friends</Text>
        </View>
        {users.length ? users.map(renderUser) : <Text style={styles.emptyText}>No friends found</Text>}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Comments & Tips</Text>
        <View style={styles.commentInputCard}>
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Share how you use this app..."
            placeholderTextColor="#9FA0C7"
            style={styles.commentInput}
            multiline
          />
          <TouchableOpacity style={styles.commentSend} onPress={handlePostComment}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {comments.length === 0 && <Text style={styles.emptyText}>No comments yet</Text>}

        {comments.map((comment) => (
          <View key={comment.id} style={styles.commentCard}>
            {comment.user.avatarUrl ? (
              <Image source={{ uri: comment.user.avatarUrl }} style={styles.commentAvatar} />
            ) : (
              <View style={styles.commentAvatarFallback}>
                <Text style={styles.commentAvatarInitial}>
                  {comment.user.displayName?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{comment.user.displayName || comment.user.username}</Text>
                <Text style={styles.commentTime}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.commentBody}>{comment.body}</Text>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => handleToggleLike(comment)}
                disabled={likeBusy[comment.id]}
              >
                <Ionicons
                  name={comment.likedByViewer ? 'heart' : 'heart-outline'}
                  size={16}
                  color={comment.likedByViewer ? '#F45C84' : '#7A7AA5'}
                />
                <Text style={styles.likeCount}>{comment.likesCount || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F6FF',
  },
  heroCard: {
    margin: 18,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#4127C4',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  appIconFallback: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#E1DEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4C41A5',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#21184B',
  },
  appCategory: {
    fontSize: 13,
    color: '#7A79A4',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    backgroundColor: '#E9E7FF',
    color: '#5146D8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  badgeTrending: {
    backgroundColor: '#FFE9D9',
    color: '#D45400',
  },
  installButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#5445E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#F0EEFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statLabel: {
    fontSize: 11,
    color: '#7A79A4',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C235E',
    marginTop: 4,
  },
  description: {
    marginTop: 14,
    fontSize: 14,
    color: '#4B4970',
  },
  sectionCard: {
    marginHorizontal: 18,
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1940',
  },
  sectionBadge: {
    fontSize: 12,
    color: '#7A79A4',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
  },
  userAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#E4E2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarInitial: {
    fontWeight: '700',
    color: '#4A3FE6',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1A46',
  },
  userHandle: {
    fontSize: 12,
    color: '#7A79A4',
  },
  emptyText: {
    fontSize: 13,
    color: '#9C9BBA',
  },
  commentInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F4FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    color: '#1C1940',
  },
  commentSend: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#4C41A5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1FA',
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
  },
  commentAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E5E3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarInitial: {
    fontWeight: '700',
    color: '#4A3FE6',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    fontWeight: '700',
    color: '#1F1A40',
  },
  commentTime: {
    fontSize: 11,
    color: '#A1A2C6',
  },
  commentBody: {
    fontSize: 14,
    color: '#353452',
    marginTop: 4,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  likeCount: {
    fontSize: 12,
    color: '#6F6DA0',
  },
});
