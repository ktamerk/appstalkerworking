import { NativeModules, Platform } from 'react-native';

export interface InstalledApp {
  packageName: string;
  appName: string;
  appIcon: string | null;
  platform: 'android' | 'ios';
}

interface NativeInstalledApp {
  packageName: string;
  appName?: string;
  appIcon?: string | null;
}

const { AppIconModule } = NativeModules as {
  AppIconModule?: {
    getInstalledApps: () => Promise<NativeInstalledApp[]>;
  };
};

export class InstalledAppsService {
  static async getInstalledApps(): Promise<InstalledApp[]> {
    if (Platform.OS === 'android') {
      try {
        if (!AppIconModule?.getInstalledApps) {
          console.warn('[InstalledAppsService] AppIconModule not available, returning empty list.');
          return [];
        }

        const apps = await AppIconModule.getInstalledApps();

        return apps.map((app) => ({
          packageName: app.packageName,
          appName: app.appName ?? app.packageName,
          appIcon: app.appIcon ?? null,
          platform: 'android' as const,
        }));
      } catch (error) {
        console.error('Failed to get installed apps:', error);
        return [];
      }
    } else if (Platform.OS === 'ios') {
      console.warn('iOS does not allow reading installed apps list');
      return [];
    }
    
    return [];
  }

  static async syncWithBackend(apps: InstalledApp[], apiClient: any): Promise<void> {
    try {
      await apiClient.post('/api/apps/sync', { apps });
    } catch (error) {
      console.error('Failed to sync apps with backend:', error);
      throw error;
    }
  }

  static getMockAppsForDemo(): InstalledApp[] {
    return [
      {
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        appIcon: null,
        platform: 'android',
      },
      {
        packageName: 'com.spotify.music',
        appName: 'Spotify',
        appIcon: null,
        platform: 'android',
      },
      {
        packageName: 'com.whatsapp',
        appName: 'WhatsApp',
        appIcon: null,
        platform: 'android',
      },
      {
        packageName: 'com.twitter.android',
        appName: 'Twitter',
        appIcon: null,
        platform: 'android',
      },
    ];
  }
}
