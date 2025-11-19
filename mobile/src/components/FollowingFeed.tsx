import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import { getImageSource } from '../utils/iconHelpers';

interface FollowingFeedProps {
  navigation: any;
  onRefreshStart?: () => void;
  ListHeaderComponent?: React.ReactElement | null;
  searchQuery?: string;
}

export default function FollowingFeed({ navigation, onRefreshStart, ListHeaderComponent, searchQuery }: FollowingFeedProps) {
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeed();
  }, []);

  const hydrateUsers = async (usersList: any[], markSuggested = false) => {
    // hydrate each user with profile data so we can render avatars/apps consistently
    return Promise.all(
      usersList.map(async (user: any) => {
        try {
          const profileResponse = await api.get(API_ENDPOINTS.PROFILE.USER(user.username));
          return {
            ...user,
            apps: profileResponse.data.apps || [],
            avatarUrl: profileResponse.data.profile?.avatarUrl,
            suggested: markSuggested,
          };
        } catch (error: any) {
          if (error.response?.status === 403) {
            return {
              ...user,
              apps: [],
              isPrivate: true,
              suggested: markSuggested,
            };
          }
          return {
            ...user,
            apps: [],
            suggested: markSuggested,
          };
        }
      })
    );
  };

  const loadFeed = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SOCIAL.FOLLOWING);
      const followingUsers = response.data.following;

      const discoverResponse = await api.get(API_ENDPOINTS.SOCIAL.DISCOVER);
      const discoverUsers = discoverResponse.data.users || [];

      const usersWithApps = (await hydrateUsers(followingUsers)).map((user: any) => ({
        ...user,
        isFollowing: true,
      }));

      const suggestionCandidates = discoverUsers.filter(
        (candidate: any) => !followingUsers.some((f: any) => f.username === candidate.username)
      );
      const suggestedUsers = (await hydrateUsers(suggestionCandidates.slice(0, 6), true)).map((user: any) => ({
        ...user,
        isFollowing: false,
      }));

      setFollowing([...usersWithApps, ...suggestedUsers]);
    } catch (error) {
      console.error('Load feed error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (onRefreshStart) {
      onRefreshStart();
    }
    loadFeed();
  };

  const handleFollowToggle = async (user: any) => {
    const { id, isFollowing } = user;
    if (!id) return;
    setPendingIds((prev) => new Set(prev).add(id));

    setFollowing((prev) =>
      prev.map((row) => (row.id === id ? { ...row, isFollowing: !isFollowing } : row))
    );

    try {
      if (isFollowing) {
        await api.delete(API_ENDPOINTS.SOCIAL.UNFOLLOW(id));
      } else {
        await api.post(API_ENDPOINTS.SOCIAL.FOLLOW(id));
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update follow status');
      setFollowing((prev) =>
        prev.map((row) => (row.id === id ? { ...row, isFollowing } : row))
      );
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery?.trim()) {
      return following;
    }
    const query = searchQuery.toLowerCase();
    return following.filter((item: any) => {
      const matchesName =
        item.displayName?.toLowerCase().includes(query) ||
        item.username?.toLowerCase().includes(query);
      const matchesApps = item.apps?.some(
        (app: any) =>
          app.appName?.toLowerCase().includes(query) ||
          app.packageName?.toLowerCase().includes(query)
      );
      return matchesName || matchesApps;
    });
  }, [following, searchQuery]);

  const renderUser = ({ item }: any) => {
    const avatarSource = getImageSource(item.avatarUrl);
    const actionDisabled = pendingIds.has(item.id);
    return (
    <View style={styles.card}>
      {item.suggested && (
        <View style={styles.suggestedBadge}>
          <Text style={styles.suggestedText}>Suggested</Text>
        </View>
      )}
      <TouchableOpacity style={styles.headerRow} onPress={() => navigation.navigate('UserProfile', { username: item.username })}>
        {avatarSource ? (
          <Image source={{ uri: avatarSource }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{item.displayName?.[0]?.toUpperCase() || '?'}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.displayName}>{item.displayName}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.followButton,
            item.isFollowing && styles.followButtonActive,
            actionDisabled && styles.followButtonDisabled,
          ]}
          onPress={() => handleFollowToggle(item)}
          disabled={actionDisabled}
        >
          <Text style={[styles.followButtonText, item.isFollowing && styles.followButtonTextActive]}>
            {item.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {item.apps && item.apps.length > 0 && (
        <View style={styles.appsRow}>
          {item.apps.slice(0, 4).map((app: any, index: number) => {
            const iconSource = getImageSource(app.appIcon);
            return iconSource ? (
              <Image key={app.id || index} source={{ uri: iconSource }} style={styles.appIcon} />
            ) : (
              <View key={app.id || index} style={styles.appIconFallback}>
                <Text style={styles.appIconInitial}>{app.appName[0]}</Text>
              </View>
            );
          })}
          {item.apps.length > 4 && (
            <View style={styles.moreCircle}>
              <Text style={styles.moreText}>+{item.apps.length - 4}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text>Loading feed...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredUsers}
      renderItem={renderUser}
      keyExtractor={(item: any, index) => `${item.userId || index}`}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={styles.suggestions}>
          <Text style={styles.emptyText}>
            {searchQuery?.trim() ? 'No matches found.' : 'No activity yet. Discover people to follow.'}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 16,
  },
  card: {
    marginHorizontal: 4,
    marginVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  suggestedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0EEFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  suggestedText: {
    color: '#5D4CE0',
    fontWeight: '600',
    fontSize: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#E3E0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontWeight: '700',
    color: '#5D4CE0',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1747',
  },
  username: {
    fontSize: 13,
    color: '#8A87AF',
  },
  followButton: {
    backgroundColor: '#EFEAFD',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  followButtonActive: {
    backgroundColor: '#5D4CE0',
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonText: {
    color: '#4E41A6',
    fontWeight: '600',
  },
  followButtonTextActive: {
    color: '#fff',
  },
  appsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  appIconFallback: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EDEBFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconInitial: {
    color: '#4E41A6',
    fontWeight: '700',
  },
  moreCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFE08A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    color: '#3A2E60',
    fontWeight: '700',
  },
  suggestions: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#7B799F',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});
