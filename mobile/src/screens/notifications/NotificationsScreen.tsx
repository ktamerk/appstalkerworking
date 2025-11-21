import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Image, ScrollView } from 'react-native';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [digest, setDigest] = useState<any | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);

  useEffect(() => {
    loadNotifications();
    loadHighlights();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.ALL);
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadHighlights = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.HIGHLIGHTS);
      setDigest(response.data.digest || null);
      setMilestones(response.data.milestones || []);
    } catch (error) {
      console.error('Load highlights error:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
    loadHighlights();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
      setNotifications((prev) =>
        prev.map((n: any) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const getNotificationIcon = (content: string) => {
    if (content.includes('follow')) return '👤';
    if (content.includes('installed')) return '📱';
    if (content.includes('liked')) return '❤️';
    if (content.includes('friend request')) return '🤝';
    return '🔔';
  };

  const getNotificationColor = (content: string) => {
    if (content.includes('follow')) return '#6C63FF';
    if (content.includes('installed')) return '#FFD369';
    if (content.includes('liked')) return '#FF6B9D';
    if (content.includes('friend request')) return '#4ECDC4';
    return '#999';
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  const renderNotification = ({ item }: any) => {
    const accentColor = getNotificationColor(item.content);

    return (
      <TouchableOpacity
        style={styles.notificationCard}
        onPress={() => {
          markAsRead(item.id);
          if (item.relatedUser) {
            navigation.navigate('UserProfile', { username: item.relatedUser.username });
          }
        }}
      >
        <View style={[styles.notificationAvatar, { backgroundColor: accentColor + '26' }]}>
          {item.relatedUser?.avatarUrl ? (
            <Image source={{ uri: item.relatedUser.avatarUrl }} style={styles.notificationAvatarImg} />
          ) : (
            <Text style={[styles.notificationAvatarInitial, { color: accentColor }]}>
              {(item.relatedUser?.displayName || '?')[0]?.toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.notificationBody}>
          <Text style={styles.notificationMessage}>
            <Text style={styles.notificationName}>{item.relatedUser?.displayName || 'Someone'}</Text>{' '}
            {item.content}
          </Text>
          <Text style={styles.notificationTime}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={[styles.notificationIndicator, { backgroundColor: accentColor }]} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Notifications</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionHeadingText}>Today</Text>
      </View>

      <FlatList
        data={notifications.filter((n: any) => {
          const date = new Date(n.createdAt);
          const now = new Date();
          return now.toDateString() === date.toDateString();
        })}
        renderItem={renderNotification}
        keyExtractor={(item: any) => item.id}
        scrollEnabled={false}
      />

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionHeadingText}>Earlier</Text>
      </View>

      <FlatList
        data={notifications.filter((n: any) => {
          const date = new Date(n.createdAt);
          const now = new Date();
          return now.toDateString() !== date.toDateString();
        })}
        renderItem={renderNotification}
        keyExtractor={(item: any) => `${item.id}-earlier`}
        scrollEnabled={false}
        ListEmptyComponent={
          !notifications.length ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {digest && (
        <View style={styles.digestCard}>
          <Text style={styles.digestLabel}>THIS WEEK</Text>
          <Text style={styles.digestTitle}>Your Weekly Digest</Text>
          <Text style={styles.digestDescription}>{digest.summary}</Text>
          <View style={styles.digestRow}>
            {digest.stats?.avatars?.slice?.(0, 4)?.map((url: string, index: number) => (
              <Image key={`${url}-${index}`} source={{ uri: url }} style={styles.digestAvatar} />
            ))}
            <Text style={styles.digestHint}>You gained {digest.stats?.newFollowers || 0} new followers.</Text>
          </View>
          <TouchableOpacity style={styles.digestButton}>
            <Text style={styles.digestButtonText}>View Summary</Text>
          </TouchableOpacity>
        </View>
      )}

      {milestones.length > 0 && (
        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneLabel}>MILESTONE</Text>
          <Text style={styles.milestoneTitle}>{milestones[0].title}</Text>
          <Text style={styles.milestoneDescription}>
            Congratulations! Your app collections are getting popular.
          </Text>
          <TouchableOpacity style={styles.milestoneButton}>
            <Text style={styles.milestoneButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8FF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  backButton: {
    padding: 6,
  },
  backIcon: {
    fontSize: 18,
    color: '#5A2ED6',
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1C39',
  },
  readAllText: {},
  digestCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#5A2ED6',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  digestLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9A97D7',
  },
  digestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#170F49',
    marginTop: 6,
  },
  digestDescription: {
    fontSize: 14,
    color: '#4B4A73',
    marginTop: 6,
  },
  digestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  digestAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  digestHint: {
    fontSize: 12,
    color: '#4B4A73',
    flex: 1,
  },
  digestButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#5A2ED6',
    borderRadius: 999,
  },
  digestButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  milestoneCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#EAE6FF',
    borderRadius: 18,
    padding: 18,
  },
  milestoneLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A6AD9',
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F175C',
    marginTop: 6,
  },
  milestoneDescription: {
    fontSize: 13,
    color: '#4C4681',
    marginTop: 4,
  },
  milestoneButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#5A2ED6',
    borderRadius: 999,
  },
  milestoneButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionHeading: {
    marginTop: 22,
    marginHorizontal: 16,
  },
  sectionHeadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A84C5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  notificationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationAvatarImg: {
    width: 42,
    height: 42,
    borderRadius: 16,
  },
  notificationAvatarInitial: {
    fontWeight: '700',
    fontSize: 18,
  },
  notificationBody: {
    flex: 1,
  },
  notificationMessage: {
    color: '#1F175C',
    fontSize: 13,
  },
  notificationName: {
    fontWeight: '700',
  },
  notificationTime: {
    marginTop: 4,
    fontSize: 11,
    color: '#8E8AA6',
  },
  notificationIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 10,
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
