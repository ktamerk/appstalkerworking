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
import { useNavigation } from '@react-navigation/native';

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
      const currentPackageNames = installedApps.map(app => app.packageName);

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
          updates: selectedPackageNames.map(packageName => ({
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search people or apps..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
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

      {activeTab === 'following' ? (
        <FollowingFeed navigation={navigation} onRefreshStart={checkForNewApps} />
      ) : (
        <TrendingFeed navigation={navigation} />
      )}

      <NewAppPrompt
        visible={showNewAppPrompt}
        apps={newApps}
        onConfirm={handleNewAppsConfirm}
        onDismiss={handleNewAppsDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2FF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 28,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  clearIcon: {
    fontSize: 20,
    color: '#999',
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#6C63FF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
});
