import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import FeedScreen from './src/screens/feed/FeedScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import FollowersListScreen from './src/screens/profile/FollowersListScreen';
import SearchScreen from './src/screens/search/SearchScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import ManageAppsScreen from './src/screens/apps/ManageAppsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import LikedProfilesScreen from './src/screens/settings/LikedProfilesScreen';
import HelpScreen from './src/screens/settings/HelpScreen';
import AboutScreen from './src/screens/settings/AboutScreen';
import AppDetailScreen from './src/screens/apps/AppDetailScreen';
import { initWebSocket, disconnectWebSocket } from './src/services/websocket';
import SplashScreen from './src/components/SplashScreen';
import CollectionDetailScreen from './src/screens/profile/CollectionDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_CONFIG: Record<
  'Feed' | 'Search' | 'Notifications' | 'Profile',
  { label: string; active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Feed: { label: 'Feed', active: 'home', inactive: 'home-outline' },
  Search: { label: 'Similar', active: 'people', inactive: 'people-outline' },
  Notifications: { label: 'Alerts', active: 'notifications', inactive: 'notifications-outline' },
  Profile: { label: 'Profile', active: 'person', inactive: 'person-outline' },
};

function TabIcon({ routeName, focused }: { routeName: keyof typeof TAB_CONFIG; focused: boolean }) {
  const { label, active, inactive } = TAB_CONFIG[routeName];
  return (
    <View style={tabStyles.tabItem}>
      <View style={[tabStyles.iconPill, focused && tabStyles.iconPillActive]}>
        <Ionicons
          name={focused ? active : inactive}
          size={20}
          color={focused ? '#fff' : '#6B6C7A'}
        />
      </View>
      <Text style={[tabStyles.tabLabel, focused && tabStyles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
          height: 76,
          paddingBottom: 12,
          paddingTop: 6,
          shadowColor: '#1C1C28',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 10,
        },
        tabBarIcon: ({ focused }) => {
          return <TabIcon routeName={route.name as keyof typeof TAB_CONFIG} focused={focused} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconPill: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F2F6',
  },
  iconPillActive: {
    backgroundColor: '#5D4CE0',
    shadowColor: '#5D4CE0',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tabLabel: {
    fontSize: 11,
    color: '#7C7E8B',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#1F1F33',
  },
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Defensive: ensure vector icon font is registered for release builds
    Ionicons.loadFont().catch(() => {});
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        setIsAuthenticated(true);
        initWebSocket(token);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (token: string) => {
    await AsyncStorage.setItem('authToken', token);
    setIsAuthenticated(true);
    initWebSocket(token);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    disconnectWebSocket();
    setIsAuthenticated(false);
  };

  if (isLoading || (!fontsLoaded && !fontError)) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: '' }} />
            <Stack.Screen name="ManageApps" component={ManageAppsScreen} options={{ title: '' }} />
            <Stack.Screen name="Settings" options={{ title: '' }}>
              {(props) => <SettingsScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="UserProfile" component={ProfileScreen} options={{ title: '' }} />
            <Stack.Screen
              name="FollowersList"
              component={FollowersListScreen}
              options={{ title: '' }}
            />
            <Stack.Screen
              name="AppDetail"
              component={AppDetailScreen}
              options={{ title: '' }}
            />
            <Stack.Screen name="LikedProfiles" component={LikedProfilesScreen} options={{ title: '' }} />
            <Stack.Screen name="Help" component={HelpScreen} options={{ title: '' }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ title: '' }} />
            <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} options={{ title: '' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
