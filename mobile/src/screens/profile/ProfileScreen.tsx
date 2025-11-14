import React, { useCallback, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Image, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import { getImageSource } from '../../utils/iconHelpers';

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export default function ProfileScreen({ route, navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const username = route?.params?.username;
  const isOwnProfile = !username;
  const targetUsername = username ?? userInfo?.username;

  useLayoutEffect(() => {
    if (!username) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={{ marginRight: 15 }}
          >
            <View style={styles.menuButton}>
              <Text style={styles.menuButtonText}>⋮</Text>
            </View>
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, username]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [username])
  );

  const loadProfile = async () => {
    try {
      let response;
      if (username) {
        response = await api.get(API_ENDPOINTS.PROFILE.USER(username));
      } else {
        response = await api.get(API_ENDPOINTS.PROFILE.ME);
      }

      setProfile(response.data.profile);
      setUserInfo(response.data.user);
      setIsFollowing(Boolean(response.data.profile?.isFollowing));
      setApps(response.data.apps || []);
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openFollowers = () => {
    if (!profile) return;
    navigation.navigate('FollowersList', {
      username: username ? targetUsername : undefined,
      type: 'followers',
      title: `${profile.displayName}'s Followers`,
    });
  };

  const openFollowing = () => {
    if (!profile) return;
    navigation.navigate('FollowersList', {
      username: username ? targetUsername : undefined,
      type: 'following',
      title: `${profile.displayName}'s Following`,
    });
  };

  const handleFollowToggle = async () => {
    if (!userInfo?.id) return;
    setActionLoading(true);
    try {
      if (isFollowing) {
        await api.delete(API_ENDPOINTS.SOCIAL.UNFOLLOW(userInfo.id));
        setIsFollowing(false);
        setProfile((prev: any) =>
          prev
            ? {
                ...prev,
                followersCount: Math.max(0, (prev.followersCount || 0) - 1),
              }
            : prev
        );
      } else {
        await api.post(API_ENDPOINTS.SOCIAL.FOLLOW(userInfo.id));
        setIsFollowing(true);
        setProfile((prev: any) =>
          prev
            ? {
                ...prev,
                followersCount: (prev.followersCount || 0) + 1,
              }
            : prev
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update follow state');
    } finally {
      setActionLoading(false);
    }
  };

  const openSettings = () => {
    navigation.navigate('Settings');
  };

  const handleLinkPress = (url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const renderApp = ({ item }: any) => {
    const iconSource = getImageSource(item.appIcon);
    return (
      <View style={styles.appCard}>
        <View style={styles.appIconWrapper}>
          {iconSource ? (
            <Image
              source={{ uri: iconSource }}
              style={styles.appIconImage}
            />
          ) : (
            <View style={styles.appIcon}>
              <Text style={styles.appIconText}>{item.appName[0]}</Text>
            </View>
          )}
        </View>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>{item.appName}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {isOwnProfile && (
          <TouchableOpacity style={styles.settingsFab} onPress={openSettings}>
            <Text style={styles.menuButtonText}>⋮</Text>
          </TouchableOpacity>
        )}
        <View style={styles.avatarRow}>
          {profile.avatarUrl ? (
            <View style={styles.avatarContainer}>
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            </View>
          ) : (
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, styles.gradientAvatar]}>
                <Text style={styles.avatarText}>
                  {profile.displayName[0].toUpperCase()}
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.statsCompact}>
            <TouchableOpacity style={styles.statCompact} onPress={openFollowers}>
              <Text style={styles.statValueCompact}>{formatCount(profile.followersCount || 0)}</Text>
              <Text style={styles.statLabelCompact}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCompact} onPress={openFollowing}>
              <Text style={styles.statValueCompact}>{formatCount(profile.followingCount || 0)}</Text>
              <Text style={styles.statLabelCompact}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statCompact}>
              <Text style={styles.statValueCompact}>{formatCount(apps.length)}</Text>
              <Text style={styles.statLabelCompact}>Visible Apps</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.displayName}>{profile.displayName}</Text>
          {targetUsername && <Text style={styles.username}>@{targetUsername}</Text>}
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          {profile.links && profile.links.length > 0 && (
            <View style={styles.linksContainer}>
              {profile.links.map((link: any) => (
                <TouchableOpacity
                  key={link.id}
                  style={styles.linkChip}
                  onPress={() => handleLinkPress(link.url)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.linkChipText}>{link.label || link.platform}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {isOwnProfile ? (
          <>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.editButton, styles.editButtonHalf]}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.editButtonHalf]}
                onPress={() => navigation.navigate('ManageApps')}
              >
                <Text style={styles.editButtonText}>Manage Apps</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
                actionLoading && styles.buttonDisabled,
              ]}
              onPress={handleFollowToggle}
              disabled={actionLoading}
            >
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Installed Apps</Text>
        {apps.length > 0 ? (
          <FlatList
            data={apps}
            renderItem={renderApp}
            keyExtractor={(item: any) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>
            {profile.showApps ? 'No apps to display' : 'Apps are hidden'}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2FF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  settingsFab: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientAvatar: {
    borderWidth: 3,
    borderColor: '#FFD369',
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FFD369',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    marginBottom: 12,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  linksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  linkChip: {
    backgroundColor: '#EEF0FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  linkChipText: {
    color: '#4C4ACF',
    fontWeight: '600',
  },
  statsCompact: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  statCompact: {
    alignItems: 'center',
  },
  statValueCompact: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statLabelCompact: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 20,
  },
  followButton: {
    flex: 1,
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  followingButton: {
    backgroundColor: '#F0F2FF',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  followingButtonText: {
    color: '#6C63FF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  editButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  editButtonHalf: {
    flex: 1,
    paddingHorizontal: 15,
    marginHorizontal: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 20,
  },
  settingsButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#F0F2FF',
    marginTop: 10,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 18,
    paddingLeft: 2,
  },
  appCard: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  appIconWrapper: {
    marginRight: 14,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  appIconImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appIconText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    padding: 20,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    color: '#1A1A1A',
    fontWeight: '600',
  },
});
