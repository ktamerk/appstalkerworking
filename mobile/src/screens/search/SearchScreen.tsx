import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDiscover();
  }, []);

  const loadDiscover = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SOCIAL.DISCOVER);
      setDiscover(response.data.users || []);
    } catch (error) {
      console.error('Discover error:', error);
    }
  };

  const handleSearch = async (text: string) => {
    setQuery(text);
    
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(API_ENDPOINTS.PROFILE.SEARCH(text));
      setResults(response.data.users);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }: any) => (
    <TouchableOpacity
      style={styles.userCard}
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
        {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
        {item.appsCount !== undefined && (
          <Text style={styles.appsCount}>{item.appsCount} visible apps</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const isSearching = query.trim().length >= 2;
  const listData = isSearching ? results : discover;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      </View>

      {loading && isSearching ? (
        <View style={styles.centerContainer}>
          <Text>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          renderItem={renderUser}
          keyExtractor={(item: any) => item.id}
          ListHeaderComponent={
            !isSearching ? (
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Top Discoveries</Text>
                <Text style={styles.headerSubtitle}>Most shared apps</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isSearching ? 'No users found' : 'No users to show yet'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2FF',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  headerRow: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
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
    marginTop: 4,
  },
  appsCount: {
    fontSize: 12,
    color: '#6C63FF',
    marginTop: 4,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
