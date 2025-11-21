import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import { getInstalledApps, syncAppsWithServer } from '../../utils/appScanner';
import { getAppCache, saveAppCache } from '../../utils/appCache';
import NewAppPrompt from '../../components/NewAppPrompt';
import FollowingFeed from '../../components/FollowingFeed';
import { getImageSource } from '../../utils/iconHelpers';

interface NewApp {
  packageName: string;
  appName: string;
  appIcon?: string;
  platform: string;
}

type TabType = 'following' | 'explore';

export default function FeedScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('following');
  const [newApps, setNewApps] = useState<NewApp[]>([]);
  const [showNewAppPrompt, setShowNewAppPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingApps, setTrendingApps] = useState<any[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);

  useEffect(() => {
    checkForNewApps();
    loadExploreContent();
  }, []);

  const checkForNewApps = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const cachedPackageNames = await getAppCache(userId);
      const installedApps = await getInstalledApps();
      const currentPackageNames = installedApps.map((app) => app.packageName);

      const syncResponse = await syncAppsWithServer(installedApps, api);

      if (syncResponse.newApps && syncResponse.newApps.length > 0) {
        setNewApps(syncResponse.newApps);
        setShowNewAppPrompt(true);
      }

      await saveAppCache(userId, currentPackageNames);
    } catch (error) {
      console.error('Check new apps error:', error);
    }
  };

  const handleNewAppsConfirm = async (selectedPackageNames: string[]) => {
    try {
      if (selectedPackageNames.length > 0) {
        await api.post(API_ENDPOINTS.APPS.VISIBILITY_BULK, {
          updates: selectedPackageNames.map((packageName) => ({
            packageName,
            isVisible: true,
          })),
        });
      }

      setShowNewAppPrompt(false);
      setNewApps([]);
    } catch (error) {
      console.error('Update new apps visibility error:', error);
    }
  };

  const handleNewAppsDismiss = () => {
    setShowNewAppPrompt(false);
    setNewApps([]);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const loadExploreContent = async () => {
    try {
      const [trendingRes, discoverRes] = await Promise.all([
        api.get(API_ENDPOINTS.APPS.TRENDING),
        api.get(API_ENDPOINTS.SOCIAL.DISCOVER),
      ]);
      setTrendingApps(trendingRes.data.apps || []);
      setDiscoverUsers(discoverRes.data.users || []);
    } catch (error) {
      console.error('Explore load error', error);
    }
  };

  const renderHeader = () => (
    // shared header used as FlatList header to avoid nesting ScrollView + FlatList
    <View style={styles.headerWrapper}>
      <View style={styles.iconRow}>
        <Text style={styles.logo}>✣</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>See what your circle is installing.</Text>

      <View style={styles.searchBar}>
        <Text style={styles.searchEmoji}>🔎</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'trending' ? 'Search apps...' : 'Search people or apps...'}
          placeholderTextColor="#A2A3C7"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={styles.clearEmoji}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'explore' && styles.activeTab]}
          onPress={() => setActiveTab('explore')}
        >
          <Text style={[styles.tabText, activeTab === 'explore' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredTrending = trendingApps.filter(
    (app) =>
      !searchQuery.trim() ||
      app.appName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDiscoverUsers = discoverUsers.filter((user) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(q) ||
      user.username?.toLowerCase().includes(q) ||
      (user.bio || '').toLowerCase().includes(q)
    );
  });

  const renderExplore = () => (
    <View style={styles.exploreContainer}>
      <Text style={styles.sectionTitle}>Apps to Explore</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
        {filteredTrending.map((app) => {
          const iconSource = getImageSource(app.appIcon);
          return (
            <TouchableOpacity
              key={app.packageName}
              style={styles.exploreCard}
              onPress={() => navigation.navigate('AppDetail', { packageName: app.packageName, appName: app.appName })}
            >
              {iconSource ? (
                <Image source={{ uri: iconSource }} style={styles.exploreIcon} />
              ) : (
                <View style={styles.exploreIconFallback}>
                  <Text style={styles.exploreIconInitial}>{app.appName?.[0]?.toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.exploreName} numberOfLines={1}>{app.appName}</Text>
              <Text style={styles.exploreMeta} numberOfLines={1}>{app.installCount} shared</Text>
            </TouchableOpacity>
          );
        })}
        {!filteredTrending.length && (
          <View style={styles.emptyMini}>
            <Text style={styles.emptyMiniText}>No apps match</Text>
          </View>
        )}
      </ScrollView>

      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>People to Follow</Text>
      {filteredDiscoverUsers.map((user: any) => (
        <TouchableOpacity
          key={user.id}
          style={styles.personCard}
          onPress={() => navigation.navigate('UserProfile', { username: user.username })}
        >
          {getImageSource(user.avatarUrl) ? (
            <Image source={{ uri: getImageSource(user.avatarUrl)! }} style={styles.personAvatar} />
          ) : (
            <View style={styles.personAvatarFallback}>
              <Text style={styles.personAvatarInitial}>{user.displayName?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.personName}>{user.displayName}</Text>
            <Text style={styles.personHandle}>@{user.username}</Text>
            {user.appsCount ? <Text style={styles.personMeta}>{user.appsCount} visible apps</Text> : null}
          </View>
          <Text style={styles.followHint}>View</Text>
        </TouchableOpacity>
      ))}
      {!filteredDiscoverUsers.length && (
        <View style={styles.emptyMini}>
          <Text style={styles.emptyMiniText}>No people found</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {activeTab === 'following' ? (
        <FollowingFeed
          navigation={navigation}
          onRefreshStart={checkForNewApps}
          ListHeaderComponent={renderHeader}
          searchQuery={searchQuery}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {renderHeader()}
          {renderExplore()}
        </ScrollView>
      )}

      <NewAppPrompt visible={showNewAppPrompt} apps={newApps} onConfirm={handleNewAppsConfirm} onDismiss={handleNewAppsDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4FF',
    paddingHorizontal: 18,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  logo: {
    fontSize: 24,
    color: '#4E41A8',
  },
  settingsIcon: {
    fontSize: 18,
    color: '#4E41A8',
  },
  subtitle: {
    fontSize: 14,
    color: '#78759B',
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEEAFD',
    marginTop: 18,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#201747',
    fontSize: 15,
  },
  clearEmoji: {
    fontSize: 16,
    color: '#B7B6DE',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ECE9FF',
    marginTop: 18,
    borderRadius: 18,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#7B78A4',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4E41A8',
  },
  exploreContainer: {
    paddingHorizontal: 4,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1747',
    marginHorizontal: 4,
    marginTop: 4,
  },
  horizontalRow: {
    gap: 12,
    paddingVertical: 12,
  },
  exploreCard: {
    width: 110,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    alignItems: 'center',
  },
  exploreIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  exploreIconFallback: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EFEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreIconInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5D4CE0',
  },
  exploreName: {
    marginTop: 8,
    fontWeight: '700',
    color: '#1F1747',
  },
  exploreMeta: {
    color: '#8C89B2',
    fontSize: 12,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    gap: 10,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  personAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EEEAFD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personAvatarInitial: {
    color: '#5D4CE0',
    fontWeight: '700',
    fontSize: 18,
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1744',
  },
  personHandle: {
    fontSize: 13,
    color: '#7E7AA7',
  },
  personMeta: {
    fontSize: 12,
    color: '#9A99B7',
  },
  followHint: {
    color: '#5D4CE0',
    fontWeight: '700',
  },
  emptyMini: {
    padding: 12,
    alignItems: 'center',
  },
  emptyMiniText: {
    color: '#8C89B2',
  },
});
