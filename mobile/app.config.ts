import { ConfigContext, ExpoConfig } from 'expo/config';

const APP_NAME = 'Appstalker';
const APP_SLUG = 'appstalker';
const BUNDLE_ID = 'com.appstalker.mobile';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: APP_SLUG,
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  platforms: ['ios', 'android'],
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
  },
  android: {
    package: BUNDLE_ID,
    permissions: ['android.permission.QUERY_ALL_PACKAGES'],
  },
  extra: {
    ...config.extra,
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '',
    },
  },
});
