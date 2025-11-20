import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import { getImageSource } from '../../utils/iconHelpers';

interface CollectionApp {
  id: string;
  packageName: string;
  appName: string;
  appIcon?: string | null;
  note?: string | null;
}

interface Collection {
  id: string;
  title: string;
  description?: string | null;
  isPublic: boolean;
  apps: CollectionApp[];
  appCount?: number;
}

export default function CollectionDetailScreen({ route, navigation }: any) {
  const { id, title: titleParam } = route.params || {};
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCollection = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.COLLECTIONS.GET(id));
      setCollection(response.data.collection);
      navigation.setOptions({ title: response.data.collection?.title || 'Collection' });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to load collection';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#5D4CE0" />
      </View>
    );
  }

  if (error || !collection) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Collection not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.title}>{collection.title || titleParam}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.badge, collection.isPublic ? styles.badgePublic : styles.badgePrivate]}>
            {collection.isPublic ? 'Public' : 'Private'}
          </Text>
          <Text style={styles.metaText}>{collection.appCount ?? collection.apps?.length ?? 0} apps</Text>
        </View>
        {!!collection.description && <Text style={styles.description}>{collection.description}</Text>}
      </View>

      <View style={styles.list}>
        {collection.apps?.length ? (
          collection.apps.map((app) => {
            const iconSrc = getImageSource(app.appIcon);
            return (
              <TouchableOpacity
                key={app.id}
                style={styles.appCard}
                onPress={() =>
                  navigation.navigate('AppDetail', {
                    packageName: app.packageName,
                    appName: app.appName,
                  })
                }
              >
                {iconSrc ? (
                  <Image source={{ uri: iconSrc }} style={styles.appIcon} />
                ) : (
                  <View style={styles.appIconFallback}>
                    <Text style={styles.appIconInitial}>{app.appName?.[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.appName}>{app.appName}</Text>
                  <Text style={styles.packageName}>{app.packageName}</Text>
                  {!!app.note && <Text style={styles.note} numberOfLines={2}>{app.note}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#B6B3D9" />
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No apps in this collection yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FF',
    paddingHorizontal: 18,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F4FF',
  },
  errorText: {
    color: '#D14343',
    fontSize: 14,
  },
  header: {
    marginTop: 24,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F1745',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    overflow: 'hidden',
  },
  badgePublic: {
    backgroundColor: '#E6FFF2',
    color: '#0D8B44',
  },
  badgePrivate: {
    backgroundColor: '#F3F2FF',
    color: '#4C3FE6',
  },
  metaText: {
    color: '#7A79A4',
    fontSize: 13,
  },
  description: {
    fontSize: 14,
    color: '#4B4970',
  },
  list: {
    marginTop: 18,
    gap: 12,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  appIconFallback: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E0DEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconInitial: {
    fontWeight: '700',
    color: '#4A3FE6',
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1A46',
  },
  packageName: {
    fontSize: 12,
    color: '#7A79A4',
  },
  note: {
    marginTop: 4,
    color: '#5B5A7D',
    fontSize: 13,
  },
  empty: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8C8AA8',
  },
});
