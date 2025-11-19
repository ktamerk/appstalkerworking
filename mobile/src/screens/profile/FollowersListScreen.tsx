import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getImageSource } from '../../utils/iconHelpers';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

type ListType = 'followers' | 'following';

export default function FollowersListScreen({ route, navigation }: any) {
  const params = route?.params || {};
  const listType: ListType = params.type || 'followers';
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadList();
  }, [params.username, listType]);

  const loadList = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = listType === 'following' ? API_ENDPOINTS.SOCIAL.FOLLOWING : API_ENDPOINTS.SOCIAL.FOLLOWERS;
      const response = await api.get(endpoint, {
        params: params.username ? { username: params.username } : undefined,
      });
      const key = listType === 'following' ? 'following' : 'followers';
      setUsers(response.data[key] || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load list');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#5D4CE0" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{listType === 'followers' ? 'Followers' : 'Following'}</Text>
      <Text style={styles.subtitle}>
        {listType === 'followers'
          ? 'People who follow this profile.'
          : 'Accounts this profile follows.'}
      </Text>

      {users.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✣</Text>
          <Text style={styles.emptyText}>Nothing to see yet</Text>
        </View>
      )}

      {users.map((item) => {
        const avatarSource = getImageSource(item.avatarUrl);
        return (
          <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => navigation.navigate('UserProfile', { username: item.username })}
        >
          {avatarSource ? (
            <Image source={{ uri: avatarSource }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{item.displayName?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.displayName}>{item.displayName}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#B6B3D9" />
          </TouchableOpacity>
        );
      })}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F1745',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#7D7AA5',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: '#E4E2FF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: '700',
    color: '#5D4CE0',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1745',
  },
  username: {
    fontSize: 13,
    color: '#8B88AD',
    marginBottom: 4,
  },
  bio: {
    fontSize: 12,
    color: '#6A6886',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#D8D4F9',
  },
  emptyText: {
    fontSize: 16,
    color: '#7D7AA5',
    marginTop: 8,
  },
  errorText: {
    color: '#F45C84',
    fontSize: 14,
  },
});
