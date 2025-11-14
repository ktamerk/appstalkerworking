import { NativeModules, Platform } from 'react-native';

export interface InstalledApp {
  packageName: string;
  appName: string;
  appIcon?: string;
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

export const getInstalledApps = async (): Promise<InstalledApp[]> => {
  if (Platform.OS === 'android') {
    return await getAndroidInstalledApps();
  }

  if (Platform.OS === 'ios') {
    return await getIOSInstalledApps();
  }

  return [];
};

const getAndroidInstalledApps = async (): Promise<InstalledApp[]> => {
  if (!AppIconModule?.getInstalledApps) {
    console.warn('[AppScanner] AppIconModule not available. Is the native module linked?');
    return [];
  }

  try {
    const apps = await AppIconModule.getInstalledApps();
    return apps.map((app) => ({
      packageName: app.packageName,
      appName: app.appName ?? app.packageName,
      appIcon: app.appIcon ?? undefined,
      platform: 'android' as const,
    }));
  } catch (error) {
    console.error('[AppScanner] Failed to read installed apps', error);
    return [];
  }
};

const getIOSInstalledApps = async (): Promise<InstalledApp[]> => {
  console.warn(
    '[AppScanner] iOS restricts access to the installed apps list. Users must add apps manually.'
  );

  return [];
};

export const syncAppsWithServer = async (
  apps: InstalledApp[],
  apiClient: any
) => {
  try {
    const response = await apiClient.post('/api/apps/sync', { apps });
    return response.data;
  } catch (error) {
    console.error('Error syncing apps:', error);
    throw error;
  }
};
