import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <View style={[tabStyles.tabIconWrapper, focused && tabStyles.tabIconWrapperActive]}>
      <Ionicons name={name} size={20} color={focused ? '#fff' : '#8E8BB7'} />
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
          backgroundColor: '#fff',
          height: 70,
          paddingBottom: 14,
        },
        tabBarIcon: ({ focused }) => {
          switch (route.name) {
            case 'Feed':
              return <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />;
            case 'Search':
              return <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} />;
            case 'Notifications':
              return <TabIcon name={focused ? 'notifications' : 'notifications-outline'} focused={focused} />;
            case 'Profile':
              return <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />;
            default:
              return null;
          }
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
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabIconWrapperActive: {
    backgroundColor: '#5D4CE0',
  },
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Never block UI on fonts forever; proceed if loaded, errored, or timed out.
  useEffect(() => {
    const timer = setTimeout(() => setFontsReady(true), 3000);
    if (fontsLoaded || fontError) {
      setFontsReady(true);
      clearTimeout(timer);
    }
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

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

  if (isLoading || !fontsReady) {
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
