import React, { useEffect, useMemo, useState } from 'react';
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
  isTrending?: boolean;
}

interface TrendingFeedProps {
  ListHeaderComponent?: React.ReactElement | null;
  searchQuery?: string;
}

export default function TrendingFeed({ ListHeaderComponent, searchQuery }: TrendingFeedProps) {
  const [trendingApps, setTrendingApps] = useState<TrendingApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadTrendingApps();
  }, []);

  const loadTrendingApps = async () => {
    // fetch aggregated install counts so the list remains lightweight
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

  const filteredApps = useMemo(() => {
    if (!searchQuery?.trim()) {
      return trendingApps;
    }
    const query = searchQuery.toLowerCase();
    return trendingApps.filter(
      (app) =>
        app.appName.toLowerCase().includes(query) || app.packageName.toLowerCase().includes(query)
    );
  }, [trendingApps, searchQuery]);

  const renderApp = ({ item }: { item: TrendingApp }) => {
    const iconSource = getImageSource(item.appIcon);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('AppDetail', {
            packageName: item.packageName,
            appName: item.appName,
          })
        }
      >
        <View style={styles.cardRow}>
          {iconSource ? (
            <Image source={{ uri: iconSource }} style={styles.appIcon} />
          ) : (
            <View style={styles.appIconFallback}>
              <Text style={styles.appIconInitial}>{item.appName[0]}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>{item.appName}</Text>
            <Text style={styles.appDetails}>
              {item.installCount} {item.installCount === 1 ? 'discoverer' : 'discoverers'}
            </Text>
          </View>
          {item.isTrending && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Trending</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text>Loading trending apps...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredApps}
      renderItem={renderApp}
      keyExtractor={(item) => item.packageName}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>?o?</Text>
          <Text style={styles.emptyText}>
            {searchQuery?.trim() ? 'No apps match your search.' : 'No trending apps yet'}
          </Text>
          {!searchQuery?.trim() && (
            <Text style={styles.emptySubtitle}>Share your stack to boost an app here.</Text>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 4,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
  appIconFallback: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E4E2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconInitial: {
    fontWeight: '700',
    color: '#5C4FD6',
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1747',
  },
  appDetails: {
    fontSize: 13,
    color: '#8C89B2',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#F2EFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#5C4FD6',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    color: '#D7D4F6',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1747',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8C89B2',
    marginTop: 4,
  },
});


