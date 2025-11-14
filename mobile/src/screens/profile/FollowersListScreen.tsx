import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

type ListType = 'followers' | 'following';

interface RouteParams {
  username?: string;
  type?: ListType;
  title?: string;
}

export default function FollowersListScreen({ route, navigation }: any) {
  const params: RouteParams = route?.params ?? {};
  const listType: ListType = params.type ?? 'followers';
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
      const message = err.response?.data?.error || 'Failed to load list';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigation.navigate('UserProfile', { username: item.username })}
    >
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{item.displayName?.[0]?.toUpperCase() || item.username[0].toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{item.displayName}</Text>
        <Text style={styles.username}>@{item.username}</Text>
        {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading...</Text>
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
    <FlatList
      data={users}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>No users yet</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bio: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: '#e63946',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});
