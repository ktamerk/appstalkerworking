import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import { InstalledAppsService } from '../../services/InstalledAppsService';
import { getImageSource } from '../../utils/iconHelpers';

type TabKey = 'visible' | 'hidden';

interface App {
  id?: string;
  packageName: string;
  appName: string;
  appIcon?: string;
  isVisible: boolean;
  platform: string;
  installedAt?: string;
}

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
  if (ALLOWED_GOOGLE_PACKAGES.has(app.packageName)) return false;
  return SYSTEM_PREFIXES.some((prefix) => app.packageName.startsWith(prefix));
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
  const [infoMessage, setInfoMessage] = useState<string | null>(
    Platform.OS === 'android'
      ? 'Yüklediğin uygulamaları listelemek için tarama izni yalnızca cihazda okunur. Görünür yapmadıkça sunucuya paylaşılmaz; istersen izni reddedip manuel ekleyebilirsin.'
      : null
  );
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
      setApps(response.data.apps || []);
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
        'iOS cihazlarda yüklü uygulamalar listesine erişim sağlanamadığı için uygulamaları manuel eklemeniz gerekir.'
      );
      return;
    }

    try {
      setSyncing(true);

      const installedApps = await InstalledAppsService.getInstalledApps();

      if (!installedApps.length) {
        setInfoMessage(
          'İzin verilmedi veya okunacak uygulama bulunamadı. İstersen manuel arama ile ekleyebilirsin.'
        );
        return;
      }

      await InstalledAppsService.syncWithBackend(installedApps, api);
      setInfoMessage(`${installedApps.length} uygulama senkronize edildi.`);

      await loadApps();
    } catch (error) {
      console.error('Device scan error:', error);
      setInfoMessage(
        'Cihaz taraması başarısız oldu ya da izin reddedildi. İstersen manuel arama ile devam edebilirsin.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const confirmAndScan = () => {
    if (Platform.OS !== 'android') {
      handleDeviceScan();
      return;
    }

    Alert.alert(
      'Neden izne ihtiyaç var?',
      'Yüklü uygulamaları okuyup eşleştirerek profilini hızlıca dolduruyoruz. Veriler, görünür yapmadıkça sunucuya paylaşılmaz.',
      [
        {
          text: 'Atla',
          style: 'cancel',
          onPress: () => setInfoMessage('Tarama atlandı. Uygulamaları manuel arama ile ekleyebilirsin.'),
        },
        { text: 'Devam et', onPress: () => handleDeviceScan() },
      ]
    );
  };

  const filterApps = () => {
    let list =
      activeTab === 'visible' ? apps.filter((a) => a.isVisible) : apps.filter((a) => !a.isVisible);

    if (hideSystemApps) {
      list = list.filter((app) => !isSystemApp(app));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (app) =>
          app.appName.toLowerCase().includes(q) ||
          app.packageName.toLowerCase().includes(q)
      );
    }

    setFilteredApps(list);
  };

  const toggleVisibility = async (app: App) => {
    const packageName = app.packageName;
    setUpdating((prev) => new Set(prev).add(packageName));
    const newVisibility = !app.isVisible;

    // optimistic
    setApps((prevApps) =>
      prevApps.map((a) =>
        a.packageName === packageName ? { ...a, isVisible: newVisibility } : a
      )
    );

    try {
      await api.post(API_ENDPOINTS.APPS.VISIBILITY_BULK, {
        updates: [{ packageName, isVisible: newVisibility }],
      });
    } catch (error) {
      console.error('Toggle visibility error:', error);
      setApps((prevApps) =>
        prevApps.map((a) =>
          a.packageName === packageName ? { ...a, isVisible: app.isVisible } : a
        )
      );
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(packageName);
        return next;
      });
    }
  };

  const updateAllVisibility = async (targetVisibility: boolean) => {
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
            <Text style={styles.iosBannerText}>
              Apple doesn't allow automatic device scans. Please manage apps manually.
            </Text>
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

      <TouchableOpacity style={styles.scanButton} onPress={confirmAndScan} disabled={syncing}>
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
        <View style={styles.infoBanner}>
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
                {getImageSource(item.appIcon) ? (
                  <Image source={{ uri: getImageSource(item.appIcon)! }} style={styles.appIcon} />
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
  },
  topTitle: {
    color: '#1F1A40',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: '#6A6B8E',
    fontSize: 14,
  },
  iosBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFEAFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  iosBannerTitle: {
    color: '#2F2F6A',
    fontWeight: '700',
  },
  iosBannerText: {
    color: '#4A4C7A',
    marginTop: 2,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#1F1A40',
    borderWidth: 1,
    borderColor: '#E4E5F2',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  filterLabel: {
    color: '#2F2F6A',
    fontWeight: '600',
  },
  scanButton: {
    marginTop: 14,
    backgroundColor: '#4A3FE6',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  infoBanner: {
    marginTop: 10,
    backgroundColor: '#F0F1FF',
    padding: 12,
    borderRadius: 12,
  },
  infoBannerText: {
    color: '#333',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#EDECF8',
    borderRadius: 12,
    padding: 6,
    marginTop: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#4A3FE6',
  },
  segmentText: {
    color: '#555',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  bulkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDECF8',
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  bulkButtonText: {
    marginLeft: 6,
    color: '#1F1A40',
    fontWeight: '700',
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#4A4C7A',
  },
  listContent: {
    marginTop: 14,
    gap: 10,
  },
  appCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },
  appIconPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconInitial: {
    color: '#2F2F6A',
    fontWeight: '700',
    fontSize: 16,
  },
  appName: {
    color: '#1F1A40',
    fontWeight: '700',
    fontSize: 15,
  },
  appMeta: {
    color: '#6A6B8E',
    fontSize: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#EDECF8',
    color: '#4A3FE6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeMuted: {
    backgroundColor: '#F3F3F7',
    color: '#6A6B8E',
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9FA0C7',
  },
});
