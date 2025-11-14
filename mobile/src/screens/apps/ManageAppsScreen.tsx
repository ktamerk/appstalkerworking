import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import { InstalledAppsService } from '../../services/InstalledAppsService';

interface App {
  id: string;
  packageName: string;
  appName: string;
  appIcon?: string;
  isVisible: boolean;
  platform: string;
}

export default function ManageAppsScreen({ navigation }: any) {
  const [apps, setApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    filterApps();
  }, [searchQuery, apps]);

  const loadApps = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.APPS.ME);
      setApps(response.data.apps);
    } catch (error) {
      console.error('Load apps error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceScan = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iOS kısıtlaması',
        'iOS cihazlarında yüklü uygulamalar listesine erişim sağlanamadığı için uygulamaları manuel eklemeniz gerekir.'
      );
      return;
    }

    try {
      setSyncing(true);
      setInfoMessage(null);

      const installedApps = await InstalledAppsService.getInstalledApps();

      if (!installedApps.length) {
        setInfoMessage('Cihazdan okunabilecek uygulama bulunamadı ya da izin verilmedi.');
        return;
      }

      await InstalledAppsService.syncWithBackend(installedApps, api);
      setInfoMessage(`${installedApps.length} uygulama senkronize edildi.`);

      await loadApps();
    } catch (error) {
      console.error('Device scan error:', error);
      setInfoMessage('Cihaz taraması başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setSyncing(false);
    }
  };

  const filterApps = () => {
    if (!searchQuery.trim()) {
      setFilteredApps(apps);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredApps(
      apps.filter(app => 
        app.appName.toLowerCase().includes(query) ||
        app.packageName.toLowerCase().includes(query)
      )
    );
  };

  const toggleVisibility = async (app: App) => {
    const packageName = app.packageName;
    setUpdating(prev => new Set(prev).add(packageName));

    try {
      // Optimistic update
      const newVisibility = !app.isVisible;
      setApps(prevApps => 
        prevApps.map(a => 
          a.packageName === packageName 
            ? { ...a, isVisible: newVisibility }
            : a
        )
      );

      await api.post(API_ENDPOINTS.APPS.VISIBILITY_BULK, {
        updates: [{
          packageName: packageName,
          isVisible: newVisibility,
        }]
      });
    } catch (error) {
      console.error('Toggle visibility error:', error);
      // Rollback on error
      setApps(prevApps => 
        prevApps.map(a => 
          a.packageName === packageName 
            ? { ...a, isVisible: app.isVisible }
            : a
        )
      );
    } finally {
      setUpdating(prev => {
        const next = new Set(prev);
        next.delete(packageName);
        return next;
      });
    }
  };

  const toggleAllVisible = async () => {
    try {
      const updates = apps.map(app => ({
        packageName: app.packageName,
        isVisible: true,
      }));

      setApps(prevApps => prevApps.map(a => ({ ...a, isVisible: true })));
      
      await api.post(API_ENDPOINTS.APPS.VISIBILITY_BULK, { updates });
    } catch (error) {
      console.error('Show all error:', error);
      loadApps(); // Reload on error
    }
  };

  const toggleAllHidden = async () => {
    try {
      const updates = apps.map(app => ({
        packageName: app.packageName,
        isVisible: false,
      }));

      setApps(prevApps => prevApps.map(a => ({ ...a, isVisible: false })));
      
      await api.post(API_ENDPOINTS.APPS.VISIBILITY_BULK, { updates });
    } catch (error) {
      console.error('Hide all error:', error);
      loadApps(); // Reload on error
    }
  };

  const renderApp = ({ item }: { item: App }) => {
    const isUpdating = updating.has(item.packageName);
    
    return (
      <TouchableOpacity
        style={styles.appItem}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('AppDetail', {
            packageName: item.packageName,
            appName: item.appName,
          })
        }
      >
        <View style={styles.appInfo}>
          {item.appIcon ? (
            <Image source={{ uri: item.appIcon }} style={styles.appIcon} />
          ) : (
            <View style={[styles.appIcon, styles.appIconPlaceholder]}>
              <Text style={styles.appIconText}>{item.appName[0]}</Text>
            </View>
          )}
          <View style={styles.appText}>
            <Text style={styles.appName}>{item.appName}</Text>
            <Text style={styles.appPackage}>{item.packageName}</Text>
          </View>
        </View>
        {isUpdating ? (
          <ActivityIndicator size="small" color="#6C63FF" />
        ) : (
          <Switch
            value={item.isVisible}
            onValueChange={() => toggleVisibility(item)}
            trackColor={{ false: '#ccc', true: '#d4a5f5' }}
            thumbColor={item.isVisible ? '#6C63FF' : '#f4f3f4'}
          />
        )}
      </TouchableOpacity>
    );
  };

  const visibleCount = apps.filter(a => a.isVisible).length;
  const hiddenCount = apps.length - visibleCount;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading apps...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Apps</Text>
        <Text style={styles.headerSubtitle}>
          {visibleCount} visible • {hiddenCount} hidden
        </Text>
      </View>

      {Platform.OS === 'ios' && (
        <View style={[styles.infoBanner, styles.infoBannerWarning]}>
          <Text style={styles.infoBannerTitle}>iOS cihazlarda otomatik tarama yok</Text>
          <Text style={styles.infoBannerText}>
            App Store politikaları nedeniyle iOS kullanıcıları uygulamaları manuel eklemelidir.
          </Text>
        </View>
      )}

      {infoMessage && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>{infoMessage}</Text>
        </View>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="Search apps..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleDeviceScan}
          disabled={syncing}
          accessibilityLabel="Device Scan"
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#6C63FF" />
          ) : (
            <Ionicons name="refresh-circle" size={28} color="#6C63FF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={toggleAllVisible}
          accessibilityLabel="Show all apps"
        >
          <Ionicons name="eye" size={26} color="#6C63FF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={toggleAllHidden}
          accessibilityLabel="Hide all apps"
        >
          <Ionicons name="eye-off" size={26} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredApps}
        renderItem={renderApp}
        keyExtractor={(item) => item.packageName}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No apps found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  searchInput: {
    margin: 15,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    fontSize: 16,
  },
  infoBanner: {
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
  },
  infoBannerWarning: {
    backgroundColor: '#FFF4E5',
  },
  infoBannerTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  infoBannerText: {
    color: '#444',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E0DDFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 15,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
  },
  appIconPlaceholder: {
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  appText: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  appPackage: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
