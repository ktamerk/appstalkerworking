import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, FlatList, ScrollView, Alert } from 'react-native';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import { getImageSource } from '../../utils/iconHelpers';

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [discover, setDiscover] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDiscover();
  }, []);

  const fetchDiscover = async () => {
    try {
      const [discoverResponse, followingResponse] = await Promise.all([
        api.get(API_ENDPOINTS.SOCIAL.DISCOVER),
        api.get(API_ENDPOINTS.SOCIAL.FOLLOWING),
      ]);
      const followingIds = new Set(
        (followingResponse.data.following || []).map((user: any) => user.id)
      );
      const hydrated = (discoverResponse.data.users || []).map((user: any) => ({
        ...user,
        isFollowing: followingIds.has(user.id),
      }));
      setDiscover(hydrated);
      setFiltered(hydrated);
    } catch (error) {
      console.error('Discover error', error);
    }
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setFiltered(discover);
      return;
    }
    const q = text.toLowerCase();
    setFiltered(
      discover.filter(
        (user: any) =>
          user.displayName?.toLowerCase().includes(q) ||
          user.username?.toLowerCase().includes(q) ||
          user.bio?.toLowerCase().includes(q)
      )
    );
  };

  const updateUserState = (userId: string, updater: (user: any) => any) => {
    setDiscover((prev) => prev.map((user) => (user.id === userId ? updater(user) : user)));
    setFiltered((prev) => prev.map((user) => (user.id === userId ? updater(user) : user)));
  };

  const handleFollowToggle = async (user: any) => {
    if (!user?.id) return;
    const targetId = user.id;
    const currentlyFollowing = Boolean(user.isFollowing);
    setPendingIds((prev) => new Set(prev).add(targetId));

    updateUserState(targetId, (u) => ({ ...u, isFollowing: !currentlyFollowing }));

    try {
      if (currentlyFollowing) {
        await api.delete(API_ENDPOINTS.SOCIAL.UNFOLLOW(targetId));
      } else {
        await api.post(API_ENDPOINTS.SOCIAL.FOLLOW(targetId));
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update follow status');
      updateUserState(targetId, (u) => ({ ...u, isFollowing: currentlyFollowing }));
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const renderUser = ({ item }: any) => (
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
              <Text style={styles.badgeText}>🎯 {item.matchScore ?? 85}% Match</Text>
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.topRow}>
        <Text style={styles.topIcon}>✣</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.title}>Discover</Text>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for people or apps"
          placeholderTextColor="#9A9BC3"
          value={query}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No users match your search.</Text>
          </View>
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7FF',
    paddingHorizontal: 18,
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
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
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
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#7B78A7',
  },
});
