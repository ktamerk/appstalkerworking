import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import { getImageSource } from '../../utils/iconHelpers';

type SimilarUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  matchScore?: number;
  overlapCount?: number;
  sharedApps?: string[];
  isFollowing?: boolean;
};

const RECENTS_KEY = 'recentSimilarSearches';
const MAX_RECENTS = 6;

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<SimilarUser[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecents();
    fetchSimilar();
  }, []);

  const loadRecents = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENTS_KEY);
      if (stored) {
        setRecents(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Load recents error', e);
    }
  };

  const saveRecent = async (term: string) => {
    if (!term.trim()) return;
    const next = [term.trim(), ...recents.filter((r) => r !== term.trim())].slice(0, MAX_RECENTS);
    setRecents(next);
    try {
      await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Save recents error', e);
    }
  };

  const fetchSimilar = async () => {
    setLoading(true);
    try {
      const [similarRes, followingRes] = await Promise.all([
        api.get(API_ENDPOINTS.SOCIAL.SIMILAR),
        api.get(API_ENDPOINTS.SOCIAL.FOLLOWING),
      ]);
      const followingIds = new Set((followingRes.data.following || []).map((u: any) => u.id));
      const similarUsers: SimilarUser[] = (similarRes.data.users || []).map((row: any) => ({
        id: row.user.id,
        username: row.user.username,
        displayName: row.user.displayName,
        avatarUrl: row.user.avatarUrl,
        bio: row.user.bio,
        matchScore: row.matchScore,
        overlapCount: row.overlapCount,
        sharedApps: row.sharedApps,
        isFollowing: followingIds.has(row.user.id),
      }));
      setUsers(similarUsers);
    } catch (error) {
      console.error('Similar users load error', error);
      Alert.alert('Error', 'Unable to load similar people');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      (u.bio || '').toLowerCase().includes(q)
    );
  });

  const onChangeQuery = (text: string) => {
    setQuery(text);
    saveRecent(text);
  };

  const handleFollowToggle = async (user: SimilarUser) => {
    if (!user?.id) return;
    const targetId = user.id;
    const currentlyFollowing = Boolean(user.isFollowing);
    setPendingIds((prev) => new Set(prev).add(targetId));

    setUsers((prev) => prev.map((u) => (u.id === targetId ? { ...u, isFollowing: !currentlyFollowing } : u)));

    try {
      if (currentlyFollowing) {
        await api.delete(API_ENDPOINTS.SOCIAL.UNFOLLOW(targetId));
      } else {
        await api.post(API_ENDPOINTS.SOCIAL.FOLLOW(targetId));
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update follow status');
      setUsers((prev) => prev.map((u) => (u.id === targetId ? { ...u, isFollowing: currentlyFollowing } : u)));
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const renderUser = ({ item }: { item: SimilarUser }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigation.navigate('UserProfile', { username: item.username })}
    >
      <View style={styles.userInfoRow}>
        {getImageSource(item.avatarUrl) ? (
          <Image source={{ uri: getImageSource(item.avatarUrl)! }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{item.displayName?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userHandle}>@{item.username}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Match {item.matchScore ?? 85}%</Text>
            </View>
            {typeof item.overlapCount === 'number' && (
              <Text style={styles.sharedCount}>{item.overlapCount} shared apps</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.followPill,
            item.isFollowing && styles.followPillActive,
            pendingIds.has(item.id) && styles.followPillDisabled,
          ]}
          onPress={() => handleFollowToggle(item)}
          disabled={pendingIds.has(item.id)}
        >
          <Text style={[styles.followPillText, item.isFollowing && styles.followPillTextActive]}>
            {item.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
      {item.sharedApps?.length ? (
        <Text style={styles.sharedApps}>Also using: {item.sharedApps.slice(0, 3).join(', ')}</Text>
      ) : null}
    </TouchableOpacity>
  );

  const renderRecentChips = () =>
    recents.length > 0 && !query.trim() ? (
      <View style={styles.recentsRow}>
        {recents.map((r) => (
          <TouchableOpacity key={r} style={styles.recentChip} onPress={() => onChangeQuery(r)}>
            <Text style={styles.recentChipText}>{r}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.recentChip, styles.recentClear]}
          onPress={async () => {
            setRecents([]);
            await AsyncStorage.removeItem(RECENTS_KEY);
          }}
        >
          <Text style={[styles.recentChipText, { color: '#5A2ED6' }]}>Clear</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 18 }}
      data={filteredUsers}
      renderItem={renderUser}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <View style={styles.topRow}>
            <Text style={styles.topIcon}>🔎</Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={styles.title}>Similar Stalkers</Text>

          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for people like you"
              placeholderTextColor="#9A9BC3"
              value={query}
              onChangeText={onChangeQuery}
            />
          </View>

          {renderRecentChips()}

          {loading && (
            <View style={{ paddingVertical: 12 }}>
              <Text style={{ color: '#7B78A7' }}>Loading...</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>People</Text>
          {filteredUsers.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No similar people yet.</Text>
            </View>
          ) : null}
        </>
      }
      ListFooterComponent={<View style={{ height: 20 }} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7FF',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  topIcon: {
    fontSize: 24,
    color: '#5A2ED6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F1A40',
    marginTop: 8,
  },
  searchBar: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#EDEBFF',
    paddingHorizontal: 14,
  },
  searchInput: {
    height: 46,
    fontSize: 15,
    color: '#1F1A40',
  },
  recentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  recentChip: {
    backgroundColor: '#EFEAFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recentChipText: {
    color: '#4A3FE6',
    fontWeight: '600',
  },
  recentClear: {
    borderColor: '#4A3FE6',
    borderWidth: 1,
    backgroundColor: '#F9F7FF',
  },
  sectionTitle: {
    marginTop: 18,
    fontSize: 16,
    color: '#4A4C7A',
    fontWeight: '700',
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 58,
    height: 58,
    borderRadius: 20,
    marginRight: 14,
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#E6E3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5A2ED6',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16123A',
  },
  userHandle: {
    fontSize: 13,
    color: '#7B78A7',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#F2F0FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#5A2ED6',
    fontWeight: '600',
  },
  sharedCount: {
    fontSize: 12,
    color: '#8A89B0',
  },
  sharedApps: {
    marginTop: 8,
    color: '#6E6C96',
    fontSize: 12,
  },
  followPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#5A2ED6',
  },
  followPillText: {
    color: '#fff',
    fontWeight: '600',
  },
  followPillActive: {
    backgroundColor: '#E8E6FF',
  },
  followPillDisabled: {
    opacity: 0.6,
  },
  followPillTextActive: {
    color: '#5A2ED6',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#7B78A7',
  },
});
