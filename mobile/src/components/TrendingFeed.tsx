import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import { getImageSource } from '../utils/iconHelpers';

interface TrendingApp {
  packageName: string;
  appName: string;
  appIcon?: string;
  platform: string;
  installCount: number;
}

export default function TrendingFeed() {
  const [trendingApps, setTrendingApps] = useState<TrendingApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadTrendingApps();
  }, []);

  const loadTrendingApps = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.APPS.TRENDING);
      setTrendingApps(response.data.apps || []);
    } catch (error) {
      console.error('Load trending apps error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrendingApps();
  };

  const renderApp = ({ item }: { item: TrendingApp }) => {
    const iconSource = getImageSource(item.appIcon);
    return (
      <TouchableOpacity
        style={styles.appCard}
        onPress={() =>
          navigation.navigate('AppDetail', {
            packageName: item.packageName,
            appName: item.appName,
          })
        }
      >
        <View style={styles.appHeader}>
          {iconSource ? (
            <Image source={{ uri: iconSource }} style={styles.appIcon} />
          ) : (
            <View style={styles.appIconPlaceholder}>
              <Text style={styles.appIconText}>{item.appName[0]}</Text>
            </View>
          )}
          <View style={styles.appInfo}>
            <Text style={styles.appName}>{item.appName}</Text>
            <Text style={styles.installCount}>
              {item.installCount} {item.installCount === 1 ? 'user' : 'users'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading trending apps...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={trendingApps}
      renderItem={renderApp}
      keyExtractor={(item) => item.packageName}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No trending apps yet</Text>
          <Text style={styles.emptySubtext}>
            Apps will appear here as more people share them
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
  listContainer: {
    paddingVertical: 8,
  },
  appCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 14,
  },
  appIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  appIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  installCount: {
    fontSize: 14,
    color: '#666',
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
  },
});
