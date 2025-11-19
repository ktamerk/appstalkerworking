import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

export default function LikedProfilesScreen({ navigation }: any) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.PROFILE.LIKED);
      setProfiles(response.data.profiles || []);
    } catch (error) {
      console.error('Load liked profiles error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#5D4CE0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Liked Profiles</Text>
      <Text style={styles.subtitle}>People you bookmarked for inspiration.</Text>

      {profiles.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>♡</Text>
          <Text style={styles.emptyText}>No liked profiles yet</Text>
          <Text style={styles.emptySubtext}>Tap the heart on a profile to save it.</Text>
        </View>
      )}

      {profiles.map((profile) => (
        <TouchableOpacity
          key={profile.id}
          style={styles.card}
          onPress={() => navigation.navigate('UserProfile', { username: profile.username })}
        >
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{profile.displayName?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile.displayName}</Text>
            <Text style={styles.handle}>@{profile.username}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          </View>
          <Text style={styles.heart}>♥</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FF',
    paddingHorizontal: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F4FF',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#201745',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#7E7AA5',
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    marginRight: 14,
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#E5E2FF',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontWeight: '700',
    color: '#5349C7',
    fontSize: 20,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1843',
  },
  handle: {
    fontSize: 13,
    color: '#8A87AD',
    marginBottom: 4,
  },
  bio: {
    fontSize: 13,
    color: '#5F5E7F',
  },
  heart: {
    fontSize: 24,
    color: '#F45C84',
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#D9D6F3',
  },
  emptyText: {
    fontSize: 18,
    color: '#1F1843',
    fontWeight: '600',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8C8AAE',
    marginTop: 4,
  },
});
