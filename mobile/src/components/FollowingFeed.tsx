import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Image } from 'react-native';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import { getImageSource } from '../utils/iconHelpers';

export default function FollowingFeed({ navigation, onRefreshStart }: any) {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isShowingSuggestions, setIsShowingSuggestions] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const hydrateUsers = async (usersList: any[], markSuggested = false) => {
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

      const usersWithApps = await hydrateUsers(followingUsers);

      const suggestionCandidates = discoverUsers.filter(
        (candidate: any) => !followingUsers.some((f: any) => f.username === candidate.username)
      );
      const suggestedUsers = await hydrateUsers(suggestionCandidates.slice(0, 6), true);

      setIsShowingSuggestions(usersWithApps.length === 0);
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

  const renderUser = ({ item }: any) => (
    <View style={styles.userCard}>
      {item.suggested && (
        <View style={styles.suggestedBadge}>
          <Text style={styles.suggestedBadgeText}>Suggested</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.userHeader}
        onPress={() => navigation.navigate('UserProfile', { username: item.username })}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.displayName[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{item.displayName}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
      </TouchableOpacity>
      
      {item.apps && item.apps.length > 0 && (
        <>
          <View style={styles.appsContainer}>
            <Text style={styles.appsLabel}>📱 {item.apps.length} apps</Text>
            <View style={styles.appsList}>
              {item.apps.slice(0, 4).map((app: any, index: number) => {
                const iconSource = getImageSource(app.appIcon);
                return (
                  <View key={app.id || index} style={styles.miniAppBubble}>
                    {iconSource ? (
                      <Image source={{ uri: iconSource }} style={styles.miniAppIcon} />
                    ) : (
                      <View style={styles.miniAppIconPlaceholder}>
                        <Text style={styles.miniAppIconText}>{app.appName[0]}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
              {item.apps.length > 4 && (
                <View style={styles.miniAppBubble}>
                  <View style={styles.moreAppsCircle}>
                    <Text style={styles.moreAppsText}>+{item.apps.length - 4}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.ctaButtonSecondary}
              onPress={() => navigation.navigate('UserProfile', { username: item.username })}
            >
              <Text style={styles.ctaTextSecondary}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaButtonPrimary}
              onPress={() => navigation.navigate('UserProfile', { username: item.username })}
            >
              <Text style={styles.ctaTextPrimary}>See Apps</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      
      {(!item.apps || item.apps.length === 0) && (
        <View style={styles.emptyAppsContainer}>
          <Text style={styles.emptyAppsText}>
            {item.isPrivate ? 'Private profile' : 'No apps shared yet'}
          </Text>
          <TouchableOpacity
            style={styles.ctaButtonSecondary}
            onPress={() => navigation.navigate('UserProfile', { username: item.username })}
          >
            <Text style={styles.ctaTextSecondary}>View Profile</Text>
          </TouchableOpacity>
        </View>
      )}
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
    <FlatList
      data={following}
      renderItem={renderUser}
      keyExtractor={(item: any) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {isShowingSuggestions ? 'No suggestions available yet' : 'No people to show'}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2FF',
  },
  userCard: {
    padding: 20,
    backgroundColor: '#fff',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  suggestedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  suggestedBadgeText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '600',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#FFD369',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#FFD369',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  appsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 14,
    marginTop: 4,
  },
  appsLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontWeight: '600',
  },
  appsList: {
    flexDirection: 'row',
  },
  miniAppBubble: {
    alignItems: 'center',
    marginRight: 12,
  },
  miniAppIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  miniAppIconPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E8E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  miniAppIconText: {
    color: '#6C63FF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  moreAppsCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFD369',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  moreAppsText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ctaButtons: {
    flexDirection: 'row',
    marginTop: 14,
  },
  ctaButtonSecondary: {
    flex: 1,
    backgroundColor: '#F0F2FF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  ctaTextSecondary: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  ctaButtonPrimary: {
    flex: 1,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  ctaTextPrimary: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyAppsContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  emptyAppsText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FFD369',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
    shadowColor: '#FFD369',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
