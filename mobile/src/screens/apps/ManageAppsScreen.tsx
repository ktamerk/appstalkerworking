import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
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
  installedAt?: string;
}

type TabKey = 'visible' | 'hidden';

const SYSTEM_PREFIXES = [
  'com.android.',
  'android.',
  'com.samsung.',
  'com.huawei.',
  'com.miui.',
  'com.coloros.',
  'com.vivo.',
  'com.oppo.',
  'com.google.android.',
];

const ALLOWED_GOOGLE_PACKAGES = new Set([
  'com.google.android.youtube',
  'com.google.android.youtube.tv',
  'com.google.android.apps.youtube.music',
  'com.android.chrome',
  'com.google.android.gm',
  'com.google.android.apps.maps',
  'com.google.android.apps.photos',
  'com.google.android.apps.docs',
]);

const isSystemApp = (app: App) => {
  const pkg = app.packageName;
  if (ALLOWED_GOOGLE_PACKAGES.has(pkg)) return false;
  return SYSTEM_PREFIXES.some((prefix) => pkg.startsWith(prefix));
};

const isRecentlyAdded = (app: App, days = 7) => {
  if (!app.installedAt) return false;
  const installedDate = new Date(app.installedAt);
  if (Number.isNaN(installedDate.getTime())) return false;
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return installedDate.getTime() >= threshold;
};

export default function ManageAppsScreen({ navigation }: any) {
  const [apps, setApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('visible');
  const [hideSystemApps, setHideSystemApps] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    filterApps();
  }, [searchQuery, apps, activeTab, hideSystemApps]);

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
    let list =
      activeTab === 'visible' ? apps.filter((a) => a.isVisible) : apps.filter((a) => !a.isVisible);

    if (hideSystemApps) {
      list = list.filter((app) => !isSystemApp(app));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (app) =>
          app.appName.toLowerCase().includes(query) ||
          app.packageName.toLowerCase().includes(query)
      );
    }
    setFilteredApps(list);
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
      setApps((prevApps) =>
        prevApps.map((a) =>
          a.packageName === packageName ? { ...a, isVisible: app.isVisible } : a
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

  const updateAllVisibility = async (targetVisibility: boolean) => {
    // bulk updates reuse existing API endpoint; make sure only changed apps are sent
    const candidates = apps.filter((app) => app.isVisible !== targetVisibility);
    if (!candidates.length) return;
    try {
      setUpdating(new Set(candidates.map((c) => c.packageName)));
      setApps((prev) =>
        prev.map((app) =>
          candidates.some((c) => c.packageName === app.packageName)
            ? { ...app, isVisible: targetVisibility }
            : app
        )
      );
      await api.post(API_ENDPOINTS.APPS.VISIBILITY_BULK, {
        updates: candidates.map((app) => ({
          packageName: app.packageName,
          isVisible: targetVisibility,
        })),
      });
    } catch (error) {
      console.error('Bulk toggle error', error);
      await loadApps();
    } finally {
      setUpdating(new Set());
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#2F2F6A" />
        </TouchableOpacity>
      <Text style={styles.topTitle}>Manage Apps</Text>
      <View style={{ width: 32 }} />
    </View>

    <Text style={styles.subtitle}>Choose which apps to show on your profile.</Text>

    {Platform.OS === 'ios' && (
      <View style={styles.iosBanner}>
        <Ionicons name="alert-circle-outline" size={18} color="#6F58D9" />
        <View style={{ flex: 1 }}>
          <Text style={styles.iosBannerTitle}>iOS limitation</Text>
          <Text style={styles.iosBannerText}>Apple doesn't allow automatic device scans. Please manage apps manually.</Text>
        </View>
      </View>
    )}

      <TextInput
        style={styles.searchInput}
        placeholder="Search apps..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#9FA0C7"
      />

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Hide system apps</Text>
        <Switch
          value={hideSystemApps}
          onValueChange={setHideSystemApps}
          trackColor={{ false: '#E1E1F2', true: '#B7B0FF' }}
          thumbColor={hideSystemApps ? '#4A3FE6' : '#F7F7FF'}
        />
      </View>

      <TouchableOpacity style={styles.scanButton} onPress={handleDeviceScan} disabled={syncing}>
        {syncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="scan-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.scanButtonText}>Scan Device for Apps</Text>
          </>
        )}
      </TouchableOpacity>

      {infoMessage && (
        <View style={[styles.infoBanner, infoMessage.includes('ba') && styles.infoBannerWarning]}>
          <Text style={styles.infoBannerText}>{infoMessage}</Text>
        </View>
      )}

      <View style={styles.segment}>
        {(['visible', 'hidden'] as TabKey[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.segmentButton, activeTab === tab && styles.segmentButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>
              {tab === 'visible' ? 'Visible' : 'Hidden'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bulkRow}>
        <TouchableOpacity style={styles.bulkButton} onPress={() => updateAllVisibility(true)}>
          <Ionicons name="eye" size={18} color="#1F1A40" />
          <Text style={styles.bulkButtonText}>Show All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkButton} onPress={() => updateAllVisibility(false)}>
          <Ionicons name="eye-off" size={18} color="#1F1A40" />
          <Text style={styles.bulkButtonText}>Hide All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#6C63FF" />
          <Text style={styles.loadingText}>Loading apps...</Text>
        </View>
      ) : (
        <View style={styles.listContent}>
          {filteredApps.map((item) => (
            <View key={item.packageName} style={styles.appCard}>
              <View style={styles.appInfo}>
                {item.appIcon ? (
                  <Image source={{ uri: item.appIcon }} style={styles.appIcon} />
                ) : (
                  <View style={styles.appIconPlaceholder}>
                    <Text style={styles.appIconInitial}>{item.appName?.[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.appName}>{item.appName}</Text>
                  <Text style={styles.appMeta}>{item.packageName}</Text>
                  <View style={styles.tagRow}>
                    {isRecentlyAdded(item) && <Text style={styles.badge}>New</Text>}
                    {!hideSystemApps && isSystemApp(item) && (
                      <Text style={[styles.badge, styles.badgeMuted]}>System</Text>
                    )}
                  </View>
                </View>
              </View>
              <Switch
                value={item.isVisible}
                onValueChange={() => toggleVisibility(item)}
                disabled={updating.has(item.packageName)}
                trackColor={{ false: '#E1E1F2', true: '#B7B0FF' }}
                thumbColor={item.isVisible ? '#4A3FE6' : '#F7F7FF'}
              />
            </View>
          ))}
          {!filteredApps.length && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No apps in this view</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FF',
    paddingHorizontal: 18,
  },
  topBar: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#E6E2FF',
  },
  topTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1455',
  },
  subtitle: {
    marginTop: 12,
    color: '#6C6A8C',
    fontSize: 14,
  },
  iosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EDE8FF',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  iosBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4C3FA7',
  },
  iosBannerText: {
    fontSize: 12,
    color: '#605F83',
  },
  searchInput: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#ECEAFD',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F1A40',
  },
  filterRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    fontSize: 14,
    color: '#403D66',
    fontWeight: '600',
  },
  scanButton: {
    marginTop: 16,
    backgroundColor: '#4A3FE6',
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A3FE6',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  infoBanner: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#E9EDFF',
  },
  infoBannerWarning: {
    backgroundColor: '#FFEFE2',
  },
  infoBannerText: {
    color: '#4A4A6D',
    fontSize: 13,
  },
  segment: {
    marginTop: 16,
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: '#EDEBFF',
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#fff',
  },
  segmentText: {
    color: '#7C7AA4',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#4A3FE6',
  },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  bulkButtonText: {
    color: '#1F1A40',
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6C6A8C',
  },
  listContent: {
    marginTop: 18,
    gap: 12,
  },
  appCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  appIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    color: '#1F1A40',
  },
  appMeta: {
    fontSize: 12,
    color: '#7A799A',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#E4E1FF',
    color: '#4A3FE6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 11,
    overflow: 'hidden',
  },
  badgeMuted: {
    backgroundColor: '#F1F1F6',
    color: '#6F7184',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8C8AA8',
  },
});
