import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Ionicons } from '@expo/vector-icons';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';
          switch (route.name) {
            case 'Feed':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Discover' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
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

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
