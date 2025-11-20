import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import { getImageSource } from '../../utils/iconHelpers';

const formatCount = (count: number) => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return `${count}`;
};

export default function ProfileScreen({ route, navigation }: any) {
  const usernameParam = route?.params?.username;
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [similarUsers, setSimilarUsers] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnProfile = !usernameParam;
  const targetUsername = usernameParam ?? userInfo?.username;

  const fetchProfile = async () => {
    try {
      const response = usernameParam
        ? await api.get(API_ENDPOINTS.PROFILE.USER(usernameParam))
        : await api.get(API_ENDPOINTS.PROFILE.ME);

      setProfile(response.data.profile);
      setUserInfo(response.data.user);
      setApps(response.data.apps || []);
      setIsFollowing(Boolean(response.data.profile?.isFollowing));
      try {
        const colRes = usernameParam
          ? await api.get(API_ENDPOINTS.COLLECTIONS.USER(usernameParam))
          : await api.get(API_ENDPOINTS.COLLECTIONS.MY);
        setCollections(colRes.data.collections || []);
      } catch (err) {
        console.warn('Collections load error', err);
        setCollections([]);
      }

      if (!usernameParam) {
        const similarResponse = await api.get(API_ENDPOINTS.SOCIAL.SIMILAR);
        setSimilarUsers(similarResponse.data.users || []);
      } else {
        setSimilarUsers([]);
      }
    } catch (error) {
      console.error('Load profile error', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [usernameParam])
  );

  const navigateFollowers = (type: 'followers' | 'following') => {
    if (!profile) return;
    navigation.navigate('FollowersList', {
      username: usernameParam ? targetUsername : undefined,
      type,
    });
  };

  const handleFollowToggle = async () => {
    const targetId = userInfo?.id ?? profile?.userId ?? profile?.id;
    if (!targetId) return;
    setActionLoading(true);
    try {
      if (isFollowing) {
        await api.delete(API_ENDPOINTS.SOCIAL.UNFOLLOW(targetId));
        setIsFollowing(false);
        setProfile((prev: any) =>
          prev ? { ...prev, followersCount: Math.max(0, (prev.followersCount || 0) - 1) } : prev
        );
      } else {
        await api.post(API_ENDPOINTS.SOCIAL.FOLLOW(targetId));
        setIsFollowing(true);
        setProfile((prev: any) =>
          prev ? { ...prev, followersCount: (prev.followersCount || 0) + 1 } : prev
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update follow status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkPress = (url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open link'));
  };

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#6F61F4" />
      </View>
    );
  }

  const filteredApps = apps;
  const avatarSource = getImageSource(profile.avatarUrl);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
    >
      <View style={styles.topNav}>
        {usernameParam ? (
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>
        ) : (
          <View style={styles.navButton} />
        )}
        <Text style={styles.navTitle}>{targetUsername ?? profile.displayName}</Text>
        {isOwnProfile ? (
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={20} color="#111" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.navButton, styles.navButtonDisabled]}>
            <Ionicons name="settings-outline" size={20} color="#AAA" />
          </View>
        )}
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          {avatarSource ? (
            <Image source={{ uri: avatarSource }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{profile.displayName?.[0]?.toUpperCase() || 'A'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        {targetUsername && <Text style={styles.username}>@{targetUsername}</Text>}
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        {profile.links?.length > 0 && (
          <View style={styles.linksRow}>
            {profile.links.map((link: any) => (
              <TouchableOpacity key={link.id} style={styles.linkChip} onPress={() => handleLinkPress(link.url)}>
                <Text style={styles.linkChipText}>{link.label || link.platform}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isOwnProfile ? (
          <View style={styles.primaryActions}>
            <TouchableOpacity style={[styles.primaryButton, styles.primaryButtonFilled]} onPress={() => navigation.navigate('ManageApps')}>
              <Text style={styles.primaryButtonFilledText}>Manage Apps</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, styles.primaryButtonOutline]} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.primaryButtonOutlineText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followButtonFilled]}
            onPress={handleFollowToggle}
            disabled={actionLoading}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextFilled]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard} onPress={() => navigateFollowers('following')}>
            <Text style={styles.statValue}>{formatCount(profile.followingCount || 0)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => navigateFollowers('followers')}>
            <Text style={styles.statValue}>{formatCount(profile.followersCount || 0)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCount(apps.length)}</Text>
            <Text style={styles.statLabel}>Apps</Text>
          </View>
        </View>
      </View>

      {collections.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stacks</Text>
            <Text style={styles.sectionSubtitle}>{collections.length} collections</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionRow}>
            {collections.map((col) => (
              <TouchableOpacity
                key={col.id}
                style={styles.collectionCard}
                onPress={() => navigation.navigate('CollectionDetail', { id: col.id, title: col.title })}
              >
                <Text style={styles.collectionTitle} numberOfLines={1}>{col.title}</Text>
                {col.description ? <Text style={styles.collectionDescription} numberOfLines={2}>{col.description}</Text> : null}
                <View style={styles.collectionMeta}>
                  <Text style={styles.collectionBadge}>{col.appCount ?? col.apps?.length ?? 0} apps</Text>
                  <Text style={[styles.collectionBadge, !col.isPublic && styles.collectionBadgePrivate]}>
                    {col.isPublic ? 'Public' : 'Private'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.appGrid}>
        {filteredApps.length ? (
          filteredApps.map((app, index) => {
            const iconSrc = getImageSource(app.appIcon);
            return (
              <TouchableOpacity
                key={app.id || `${app.packageName}-${index}`}
                style={styles.appTile}
                onPress={() =>
                  navigation.navigate('AppDetail', {
                    packageName: app.packageName,
                    appName: app.appName,
                  })
                }
              >
                <View style={styles.appTileIcon}>
                  {iconSrc ? (
                    <Image source={{ uri: iconSrc }} style={styles.appTileImage} />
                  ) : (
                    <Text style={styles.appTileInitial}>{app.appName?.[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.appTileName} numberOfLines={1}>
                  {app.appName}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.emptyText}>
            {profile.showApps ? 'No apps to display' : 'Apps are hidden'}
          </Text>
        )}
      </View>

      {isOwnProfile && similarUsers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Similar Stalkers</Text>
            <Text style={styles.sectionSubtitle}>People sharing your vibe</Text>
          </View>
          {similarUsers.map((item) => (
            <TouchableOpacity
              key={item.user.id}
              style={styles.similarCard}
              onPress={() => navigation.navigate('UserProfile', { username: item.user.username })}
            >
              {(() => {
                const similarAvatar = getImageSource(item.user.avatarUrl);
                if (similarAvatar) {
                  return <Image source={{ uri: similarAvatar }} style={styles.similarAvatar} />;
                }
                return (
                  <View style={styles.similarAvatarFallback}>
                    <Text style={styles.similarAvatarInitial}>{item.user.displayName?.[0]?.toUpperCase()}</Text>
                  </View>
                );
              })()}
              <View style={styles.similarInfo}>
                <Text style={styles.similarName}>{item.user.displayName}</Text>
                <Text style={styles.similarUsername}>@{item.user.username}</Text>
                <Text style={styles.similarMeta}>
                  {item.matchScore}% match · {item.overlapCount} shared apps
                </Text>
                {item.sharedApps?.length > 0 && (
                  <Text style={styles.similarShared}>{item.sharedApps.slice(0, 3).join(' • ')}</Text>
                )}
              </View>
              <Text style={styles.matchChip}>Match</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5FF',
  },
  content: {
    paddingBottom: 140,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5FF',
  },
  topNav: {
    marginTop: 12,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECECFC',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  profileCard: {
    margin: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatarWrapper: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 3,
    backgroundColor: '#E2E3FF',
    marginBottom: 18,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 54,
  },
  avatarFallback: {
    flex: 1,
    borderRadius: 54,
    backgroundColor: '#6F61F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#151638',
  },
  username: {
    fontSize: 14,
    color: '#5C6085',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: '#43445E',
    textAlign: 'center',
    marginTop: 12,
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  linkChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#EEF0FF',
  },
  linkChipText: {
    color: '#4E56A1',
    fontWeight: '600',
  },
  primaryActions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 18,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonFilled: {
    backgroundColor: '#6F61F4',
  },
  primaryButtonOutline: {
    borderWidth: 1.5,
    borderColor: '#DAD5FF',
  },
  primaryButtonFilledText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  primaryButtonOutlineText: {
    color: '#4E56A1',
    fontWeight: '600',
    fontSize: 15,
  },
  followButton: {
    marginTop: 18,
    width: '100%',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#D5D9F5',
  },
  followButtonFilled: {
    backgroundColor: '#6F61F4',
    borderColor: 'transparent',
  },
  followButtonText: {
    color: '#4E56A1',
    fontWeight: '600',
    fontSize: 15,
  },
  followButtonTextFilled: {
    color: '#fff',
  },
  statsRow: {
    marginTop: 18,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151638',
  },
  statLabel: {
    fontSize: 12,
    color: '#5C6085',
    marginTop: 4,
  },
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 16,
    justifyContent: 'space-between',
  },
  appTile: {
    width: '30%',
    alignItems: 'center',
  },
  appTileIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFF0FC',
    marginBottom: 8,
    shadowColor: '#7D7FE1',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  appTileImage: {
    width: 54,
    height: 54,
    borderRadius: 16,
  },
  appTileInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5B5EA6',
  },
  appTileName: {
    fontSize: 13,
    color: '#1F2143',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#7E82A3',
    textAlign: 'center',
    width: '100%',
  },
  section: {
    marginHorizontal: 20,
    marginTop: 28,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16183D',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#7B7FA2',
    marginTop: 4,
  },
  collectionRow: {
    gap: 12,
    paddingRight: 12,
  },
  collectionCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginRight: 12,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1940',
  },
  collectionDescription: {
    marginTop: 6,
    color: '#6E6D92',
    fontSize: 13,
  },
  collectionMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  collectionBadge: {
    backgroundColor: '#EEF0FF',
    color: '#4A3FE6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    overflow: 'hidden',
  },
  collectionBadgePrivate: {
    backgroundColor: '#F5F2FF',
    color: '#7C6BD8',
  },
  similarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  similarAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: 12,
  },
  similarAvatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E0DEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  similarAvatarInitial: {
    color: '#5C5DB5',
    fontWeight: '700',
    fontSize: 20,
  },
  similarInfo: {
    flex: 1,
  },
  similarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16183D',
  },
  similarUsername: {
    fontSize: 13,
    color: '#9193B8',
    marginTop: 2,
  },
  similarMeta: {
    fontSize: 12,
    color: '#6F61F4',
    marginTop: 6,
  },
  similarShared: {
    fontSize: 12,
    color: '#9193B8',
    marginTop: 4,
  },
  matchChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0EFFF',
    borderRadius: 999,
    color: '#6F61F4',
    fontWeight: '700',
  },
});
