import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import { getInstalledApps, syncAppsWithServer } from '../../utils/appScanner';
import { getAppCache, saveAppCache } from '../../utils/appCache';
import NewAppPrompt from '../../components/NewAppPrompt';
import FollowingFeed from '../../components/FollowingFeed';
import TrendingFeed from '../../components/TrendingFeed';

interface NewApp {
  packageName: string;
  appName: string;
  appIcon?: string;
  platform: string;
}

type TabType = 'following' | 'trending';

export default function FeedScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('following');
  const [newApps, setNewApps] = useState<NewApp[]>([]);
  const [showNewAppPrompt, setShowNewAppPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkForNewApps();
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
          style={[styles.tab, activeTab === 'trending' && styles.activeTab]}
          onPress={() => setActiveTab('trending')}
        >
          <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
            Trending
          </Text>
        </TouchableOpacity>
      </View>
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
        <TrendingFeed navigation={navigation} ListHeaderComponent={renderHeader} searchQuery={searchQuery} />
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
});
