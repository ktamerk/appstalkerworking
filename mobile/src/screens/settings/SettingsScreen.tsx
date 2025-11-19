import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface SettingsScreenProps {
  navigation: any;
  onLogout: () => void;
}

const MENU = [
  {
    title: 'Liked Profiles',
    subtitle: 'Profiles you bookmarked',
    icon: 'heart-outline' as const,
    route: 'LikedProfiles',
  },
  {
    title: 'Help & Support',
    subtitle: 'Get help with Appstalker',
    icon: 'help-circle-outline' as const,
    route: 'Help',
  },
  {
    title: 'About Appstalker',
    subtitle: 'Version 1.0.0',
    icon: 'information-circle-outline' as const,
    route: 'About',
  },
];

export default function SettingsScreen({ navigation, onLogout }: SettingsScreenProps) {
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['authToken', 'token', 'userId']);
          onLogout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Text style={styles.logo}>✣</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Control what others see and manage your account.</Text>
      </View>

      <View style={styles.card}>
        {MENU.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={[styles.menuItem, index !== MENU.length - 1 && styles.menuDivider]}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={20} color="#4B3F94" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B7B5D9" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Discover what apps people use.</Text>
        <Text style={styles.footerText}>Find your digital tribe.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FF',
    paddingHorizontal: 20,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logo: {
    fontSize: 32,
    color: '#5A4FD0',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F1747',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#78759F',
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFF8',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F2EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#21194D',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#8C8AAE',
  },
  logoutCard: {
    marginTop: 24,
    backgroundColor: '#FF6262',
    borderRadius: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#8C8AAE',
  },
});
