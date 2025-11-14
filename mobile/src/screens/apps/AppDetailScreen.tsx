import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Linking,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
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
  const [users, setUsers] = useState<UserSnippet[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likeBusy, setLikeBusy] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.APPS.DETAIL(packageName));
      setAppData(response.data.app);
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

  const renderUser = ({ item }: { item: UserSnippet }) => (
    <TouchableOpacity style={styles.userRow}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.userAvatar} />
      ) : (
        <View style={styles.userAvatarFallback}>
          <Text style={styles.userAvatarText}>{item.displayName?.[0] || item.username[0]}</Text>
        </View>
      )}
      <View>
        <Text style={styles.userName}>{item.displayName || item.username}</Text>
        <Text style={styles.userHandle}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        {item.user.avatarUrl ? (
          <Image source={{ uri: item.user.avatarUrl }} style={styles.commentAvatar} />
        ) : (
          <View style={styles.commentAvatarFallback}>
            <Text style={styles.commentAvatarText}>
              {item.user.displayName?.[0] || item.user.username[0]}
            </Text>
          </View>
        )}
        <View>
          <Text style={styles.commentAuthor}>{item.user.displayName || item.user.username}</Text>
          <Text style={styles.commentTimestamp}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={styles.commentBody}>{item.body}</Text>
      <View style={styles.commentActionRow}>
        <TouchableOpacity
          style={styles.commentLikeButton}
          onPress={() => handleToggleLike(item)}
          disabled={likeBusy[item.id]}
        >
          <Ionicons
            name={item.likedByViewer ? 'heart' : 'heart-outline'}
            size={18}
            color={item.likedByViewer ? '#FF5C8D' : '#6C63FF'}
          />
          <Text style={styles.likeCount}>{item.likesCount ?? 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      <View style={styles.header}>
        <View style={styles.iconPlaceholder}>
          {appData?.iconUrl ? (
            <Image source={{ uri: appData.iconUrl }} style={styles.iconImage} />
          ) : (
            <Text style={styles.iconFallback}>{appData?.displayName?.[0] || '?'}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{appData?.displayName || appName || packageName}</Text>
          {appData?.category && <Text style={styles.category}>{appData.category}</Text>}
        </View>
        <TouchableOpacity style={styles.installButton} onPress={handleInstallPress}>
          <Ionicons name="cloud-download-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {appData?.description ? (
        <Text style={styles.description}>{appData.description}</Text>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Who uses it</Text>
        <Text style={styles.sectionDescription}>Only people you follow will appear here.</Text>
        {users.length > 0 ? (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.userId}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>No visible users yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comments</Text>
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Ask a question or share a tip..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity style={styles.postButton} onPress={handlePostComment}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No comments yet.</Text>}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2FF',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  iconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EAE7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  iconFallback: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6C63FF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  category: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  installButton: {
    backgroundColor: '#6C63FF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  userAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAE7FF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  userHandle: {
    fontSize: 12,
    color: '#666',
  },
  commentContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  commentAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAE7FF',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  commentAuthor: {
    fontWeight: '600',
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  commentBody: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  commentActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 13,
    color: '#1A1A1A',
    marginLeft: 6,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FAFAFA',
    marginRight: 8,
  },
  postButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
