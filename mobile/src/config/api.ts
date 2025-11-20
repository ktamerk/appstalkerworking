import { Platform } from 'react-native';

// __DEV__ global deðiþkeni TypeScript için
// eslint-disable-next-line no-undef
declare const __DEV__: boolean;

const LAN_BASE_URL = 'http://192.168.1.109:5000';
const EMULATOR_BASE_URL = 'http://10.0.2.2:5000';

const getBaseUrl = () => {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) {
    return override;
  }

  if (__DEV__) {
    if (Platform.OS === 'android') {
      return EMULATOR_BASE_URL;
    }
    return 'http://localhost:5000';
  }

  return LAN_BASE_URL;
};

const getWsUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return `${EMULATOR_BASE_URL.replace('http', 'ws')}/ws`;
    }
    return 'ws://localhost:5000/ws';
  }
  return `${LAN_BASE_URL.replace('http', 'ws')}/ws`;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  WS_URL: getWsUrl(),
};

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
  },
  PROFILE: {
    ME: '/api/profile/me',
    USER: (username: string) => `/api/profile/${username}`,
    UPDATE: '/api/profile/me',
    SEARCH: (query: string) => `/api/profile/search/${query}`,
    LIKED: '/api/profile/liked',
    LINKS: '/api/profile/links',
    LINK: (linkId: string) => `/api/profile/links/${linkId}`,
  },
  APPS: {
    SYNC: '/api/apps/sync',
    ME: '/api/apps/me',
    MY_APPS: '/api/apps/me',
    VISIBILITY: (appId: string) => `/api/apps/${appId}/visibility`,
    VISIBILITY_BULK: '/api/apps/visibility/bulk',
    TRENDING: '/api/apps/trending',
    RECOMMENDED: '/api/apps/recommended',
    SEARCH_USERS: (packageName: string) => `/api/apps/search/${packageName}/users`,
    DETAIL: (packageName: string) => `/api/apps/catalog/${packageName}`,
    COMMENTS: (packageName: string) => `/api/apps/catalog/${packageName}/comments`,
    COMMENT_LIKE: (packageName: string, commentId: string) =>
      `/api/apps/catalog/${packageName}/comments/${commentId}/like`,
  },
  SOCIAL: {
    FOLLOW: (userId: string) => `/api/social/follow/${userId}`,
    UNFOLLOW: (userId: string) => `/api/social/follow/${userId}`,
    FOLLOWERS: '/api/social/followers',
    FOLLOWING: '/api/social/following',
    DISCOVER: '/api/social/discover',
    SIMILAR: '/api/social/similar',
    FRIEND_REQUEST: (userId: string) => `/api/social/friend-request/${userId}`,
    UPDATE_REQUEST: (requestId: string) => `/api/social/friend-request/${requestId}`,
    FRIEND_REQUESTS: '/api/social/friend-requests',
    LIKE: (profileId: string) => `/api/social/like/${profileId}`,
    UNLIKE: (profileId: string) => `/api/social/like/${profileId}`,
  },
  NOTIFICATIONS: {
    ALL: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    READ_ALL: '/api/notifications/read-all',
    HIGHLIGHTS: '/api/notifications/highlights',
  },
  COLLECTIONS: {
    MY: '/api/collections/my',
    USER: (username: string) => `/api/collections/user/${username}`,
    GET: (id: string) => `/api/collections/${id}`,
    CREATE: '/api/collections',
    UPDATE: (id: string) => `/api/collections/${id}`,
    DELETE: (id: string) => `/api/collections/${id}`,
    ADD_APP: (id: string) => `/api/collections/${id}/apps`,
    REMOVE_APP: (id: string, appId: string) => `/api/collections/${id}/apps/${appId}`,
  },
};