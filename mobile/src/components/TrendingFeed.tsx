import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import { getImageSource } from '../utils/iconHelpers';

interface TrendingApp {
  packageName: string;
  appName: string;
  appIcon?: string;
  platform: string;
  installCount: number;
  isTrending?: boolean;
}

interface TrendingFeedProps {
  ListHeaderComponent?: React.ReactElement | null;
  searchQuery?: string;
}

type LikeMap = Record<string, boolean>;
type CommentCountMap = Record<string, number>;
type InputMap = Record<string, string>;
type SendingMap = Record<string, boolean>;

export default function TrendingFeed({ ListHeaderComponent, searchQuery }: TrendingFeedProps) {
  const [trendingApps, setTrendingApps] = useState<TrendingApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liked, setLiked] = useState<LikeMap>({});
  const [commentCounts, setCommentCounts] = useState<CommentCountMap>({});
  const [commentInputs, setCommentInputs] = useState<InputMap>({});
  const [sending, setSending] = useState<SendingMap>({});
  const [expandedComposer, setExpandedComposer] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const animScales = useRef<Record<string, Animated.Value>>({});

  useEffect(() => {
    loadTrendingApps();
    hydrateLikes();
  }, []);

  const loadTrendingApps = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.APPS.TRENDING);
      setTrendingApps(response.data.apps || []);
    } catch (error) {
      console.error('Load trending apps error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const hydrateLikes = async () => {
    try {
      const stored = await AsyncStorage.getItem('appLikes');
      if (stored) {
        setLiked(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrendingApps();
    hydrateLikes();
  };

  const filteredApps = useMemo(() => {
    if (!searchQuery?.trim()) {
      return trendingApps;
    }
    const query = searchQuery.toLowerCase();
    return trendingApps.filter(
      (app) =>
        app.appName.toLowerCase().includes(query) || app.packageName.toLowerCase().includes(query)
    );
  }, [trendingApps, searchQuery]);

  const getScale = (pkg: string) => {
    if (!animScales.current[pkg]) {
      animScales.current[pkg] = new Animated.Value(1);
    }
    return animScales.current[pkg];
  };

  const animatePress = (pkg: string) => {
    const val = getScale(pkg);
    Animated.sequence([
      Animated.spring(val, { toValue: 0.9, useNativeDriver: true, speed: 20 }),
      Animated.spring(val, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const toggleLike = async (pkg: string) => {
    animatePress(pkg);
    setLiked((prev) => {
      const next = { ...prev, [pkg]: !prev[pkg] };
      AsyncStorage.setItem('appLikes', JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const ensureCommentCount = async (pkg: string) => {
    if (commentCounts[pkg] !== undefined) return;
    try {
      const res = await api.get(API_ENDPOINTS.APPS.COMMENTS(pkg));
      const count = (res.data.comments || []).length;
      setCommentCounts((prev) => ({ ...prev, [pkg]: count }));
    } catch (error) {
      console.error('Load comments count error', error);
    }
  };

  const handleCommentToggle = async (pkg: string) => {
    setExpandedComposer((prev) => (prev === pkg ? null : pkg));
    await ensureCommentCount(pkg);
  };

  const handleSubmitComment = async (pkg: string) => {
    const body = (commentInputs[pkg] || '').trim();
    if (!body) return;
    if (sending[pkg]) return;
    setSending((prev) => ({ ...prev, [pkg]: true }));
    try {
      await api.post(API_ENDPOINTS.APPS.COMMENTS(pkg), { body });
      setCommentInputs((prev) => ({ ...prev, [pkg]: '' }));
      setCommentCounts((prev) => ({ ...prev, [pkg]: (prev[pkg] ?? 0) + 1 }));
    } catch (error: any) {
      Alert.alert('Comment failed', error.response?.data?.error || 'Could not add comment');
    } finally {
      setSending((prev) => ({ ...prev, [pkg]: false }));
    }
  };

  const renderApp = ({ item }: { item: TrendingApp }) => {
    const iconSource = getImageSource(item.appIcon);
    const likedByMe = liked[item.packageName];
    const commentsCount = commentCounts[item.packageName];
    const showComposer = expandedComposer === item.packageName;
    const scale = getScale(item.packageName);

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {iconSource ? (
            <Image source={{ uri: iconSource }} style={styles.appIcon} />
          ) : (
            <View style={styles.appIconFallback}>
              <Text style={styles.appIconInitial}>{item.appName[0]}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>{item.appName}</Text>
            <Text style={styles.appDetails}>
              {item.installCount} {item.installCount === 1 ? 'discoverer' : 'discoverers'}
            </Text>
          </View>
          {item.isTrending && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Trending</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(item.packageName)}>
              <Text style={[styles.actionIcon, likedByMe && styles.likedIcon]}>{likedByMe ? '❤' : '♡'}</Text>
              <Text style={styles.actionLabel}>{likedByMe ? 'Liked' : 'Like'}</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCommentToggle(item.packageName)}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>{commentsCount !== undefined ? commentsCount : 'Comment'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('AppDetail', {
                packageName: item.packageName,
                appName: item.appName,
              })
            }
          >
            <Text style={styles.actionIcon}>↗</Text>
            <Text style={styles.actionLabel}>Open</Text>
          </TouchableOpacity>
        </View>

        {showComposer && (
          <View style={styles.composer}>
            <TextInput
              value={commentInputs[item.packageName] || ''}
              onChangeText={(t) => setCommentInputs((prev) => ({ ...prev, [item.packageName]: t }))}
              placeholder="Add a quick comment..."
              placeholderTextColor="#9A96C2"
              style={styles.composerInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, sending[item.packageName] && styles.sendDisabled]}
              onPress={() => handleSubmitComment(item.packageName)}
              disabled={sending[item.packageName]}
            >
              <Text style={styles.sendText}>{sending[item.packageName] ? '...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text>Loading trending apps...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredApps}
      renderItem={renderApp}
      keyExtractor={(item) => item.packageName}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💫</Text>
          <Text style={styles.emptyText}>
            {searchQuery?.trim() ? 'No apps match your search.' : 'No trending apps yet'}
          </Text>
          {!searchQuery?.trim() && (
            <Text style={styles.emptySubtitle}>Share your stack to boost an app here.</Text>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 4,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
  appIconFallback: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E4E2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconInitial: {
    fontWeight: '700',
    color: '#5C4FD6',
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1747',
  },
  appDetails: {
    fontSize: 13,
    color: '#8C89B2',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#F2EFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#5C4FD6',
    fontWeight: '600',
    fontSize: 12,
  },
  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F2FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  actionIcon: {
    fontSize: 16,
    color: '#5C4FD6',
  },
  likedIcon: {
    color: '#F45C84',
  },
  actionLabel: {
    fontSize: 13,
    color: '#271E58',
    fontWeight: '600',
  },
  composer: {
    marginTop: 10,
    backgroundColor: '#F7F5FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECE8FF',
  },
  composerInput: {
    minHeight: 40,
    maxHeight: 120,
    color: '#1F1747',
  },
  sendButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: '#5C4FD6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    color: '#D7D4F6',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1747',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8C89B2',
    marginTop: 4,
  },
});
