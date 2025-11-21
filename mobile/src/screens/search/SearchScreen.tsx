import React, { useEffect, useRef, useState } from 'react';
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

type ResultItem =
  | { type: 'user'; id: string; username: string; displayName: string; avatarUrl?: string; bio?: string; isFollowing?: boolean; matchScore?: number }
  | { type: 'app'; packageName: string; appName: string; appIcon?: string; platform: string; installCount?: number };

const RECENTS_KEY = 'recentSearches';
const MAX_RECENTS = 6;
const DEBOUNCE_MS = 400;

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ResultItem[]>([]);
  const [apps, setApps] = useState<ResultItem[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRecents();
    fetchInitialUsers();
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

  const fetchInitialUsers = async () => {
    try {
      const [personalizedResponse, followingResponse] = await Promise.all([
        api.get(API_ENDPOINTS.SOCIAL.DISCOVER_PERSONALIZED),
        api.get(API_ENDPOINTS.SOCIAL.FOLLOWING),
      ]);
      const followingIds = new Set((followingResponse.data.following || []).map((u: any) => u.id));
      let usersList = personalizedResponse.data.users || [];
      if ((!usersList || usersList.length === 0) && personalizedResponse.data.fallback) {
        const legacy = await api.get(API_ENDPOINTS.SOCIAL.DISCOVER);
        usersList = legacy.data.users || [];
      }
      const hydrated: ResultItem[] = (usersList || []).map((user: any) => {
        const matchScore = user.matchScore
          ? user.matchScore
          : Math.min(100, (user.overlapCount || 0) * 20 + (user.mutualFollowers || 0) * 10 + 40);
        return {
          type: 'user',
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          isFollowing: followingIds.has(user.id),
          matchScore,
        };
      });
      setUsers(hydrated);
    } catch (error) {
      console.error('Initial discover error', error);
    }
  };

  const fetchResults = async (text: string) => {
    const term = text.trim();
    if (!term) {
      setApps([]);
      fetchInitialUsers();
      return;
    }
    setLoading(true);
    try {
      const [userRes, appRes] = await Promise.all([
        api.get(API_ENDPOINTS.PROFILE.SEARCH(term)),
        api.get(API_ENDPOINTS.APPS.SEARCH(term)),
      ]);
      const usersResult: ResultItem[] = (userRes.data.users || []).map((u: any) => ({
        type: 'user',
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        matchScore: 90,
      }));
      const appsResult: ResultItem[] = (appRes.data.apps || []).map((a: any) => ({
        type: 'app',
        packageName: a.packageName,
        appName: a.appName,
        appIcon: a.appIcon,
        platform: a.platform,
        installCount: a.installCount,
      }));
      setUsers(usersResult);
      setApps(appsResult);
      saveRecent(term);
    } catch (error) {
      console.error('Search error', error);
    } finally {
      setLoading(false);
    }
  };

  const onChangeQuery = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(text), DEBOUNCE_MS);
  };

  const handleFollowToggle = async (user: any) => {
    if (!user?.id) return;
    const targetId = user.id;
    const currentlyFollowing = Boolean(user.isFollowing);
    setPendingIds((prev) => new Set(prev).add(targetId));

    setUsers((prev) =>
      prev.map((u) => (u.type === 'user' && u.id === targetId ? { ...u, isFollowing: !currentlyFollowing } : u))
    );

    try {
      if (currentlyFollowing) {
        await api.delete(API_ENDPOINTS.SOCIAL.UNFOLLOW(targetId));
      } else {
        await api.post(API_ENDPOINTS.SOCIAL.FOLLOW(targetId));
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update follow status');
      setUsers((prev) =>
        prev.map((u) => (u.type === 'user' && u.id === targetId ? { ...u, isFollowing: currentlyFollowing } : u))
      );
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const renderUser = ({ item }: { item: any }) => (
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
    </TouchableOpacity>
  );

  const renderApp = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.appCard}
      onPress={() => navigation.navigate('AppDetail', { packageName: item.packageName })}
    >
      {getImageSource(item.appIcon) ? (
        <Image source={{ uri: getImageSource(item.appIcon)! }} style={styles.appIcon} />
      ) : (
        <View style={styles.appIconPlaceholder}>
          <Text style={styles.appIconInitial}>{item.appName?.[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.appName}>{item.appName}</Text>
        <Text style={styles.appMeta}>{item.packageName}</Text>
        {item.installCount ? (
          <Text style={styles.appInstall}>{item.installCount} shared installs</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9B9CC2" />
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
      data={[]}
      ListHeaderComponent={
        <>
          <View style={styles.topRow}>
            <Text style={styles.topIcon}>🔍</Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={styles.title}>Discover</Text>

          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for people or apps"
              placeholderTextColor="#9A9BC3"
              value={query}
              onChangeText={onChangeQuery}
            />
          </View>

          {renderRecentChips()}

          {loading && (
            <View style={{ paddingVertical: 12 }}>
              <Text style={{ color: '#7B78A7' }}>Searching…</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>People</Text>
          <FlatList
            data={users}
            keyExtractor={(item) => (item.type === 'user' ? item.id : '')}
            renderItem={({ item }) => (item.type === 'user' ? renderUser({ item }) : null)}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No users match your search.</Text>
              </View>
            }
          />

          <Text style={styles.sectionTitle}>Apps</Text>
          <FlatList
            data={apps}
            keyExtractor={(item) => (item.type === 'app' ? item.packageName : Math.random().toString())}
            renderItem={({ item }) => (item.type === 'app' ? renderApp({ item }) : null)}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No apps match your search.</Text>
              </View>
            }
          />
        </>
      }
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
  appCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    gap: 12,
  },
  appIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },
  appIconPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#E5E7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconInitial: {
    color: '#2F2F6A',
    fontWeight: '700',
    fontSize: 16,
  },
  appName: {
    color: '#1F1A40',
    fontWeight: '700',
    fontSize: 15,
  },
  appMeta: {
    color: '#6A6B8E',
    fontSize: 12,
  },
  appInstall: {
    color: '#8B8FB2',
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#7B78A7',
  },
});
