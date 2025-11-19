import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Text style={styles.logo}>✣</Text>
        <Text style={styles.appName}>Appstalker</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.tagline}>Discover what apps people use.</Text>
        <Text style={styles.taglineSecondary}>Find your digital tribe.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.body}>
          Appstalker lets you broadcast the tools you rely on. Curate your visible apps, follow friends,
          and steal their setup inspiration. Everything stays under your control.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Highlights</Text>
        <Text style={styles.bullet}>• Share curated app stacks with followers.</Text>
        <Text style={styles.bullet}>• Discover trending apps from your network.</Text>
        <Text style={styles.bullet}>• Real-time notifications for installs & follows.</Text>
        <Text style={styles.bullet}>• Full privacy control per app.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Stack</Text>
        <Text style={styles.body}>React Native • Expo • Node.js • PostgreSQL • Drizzle ORM</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Appstalker</Text>
        <Text style={styles.footerText}>Made with ☕ + ✨</Text>
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
    fontSize: 36,
    color: '#5D4CE0',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F1644',
    marginTop: 12,
  },
  version: {
    fontSize: 14,
    color: '#8D8AAE',
    marginTop: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#5F5C7E',
    marginTop: 12,
  },
  taglineSecondary: {
    fontSize: 13,
    color: '#5D4CE0',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1644',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: '#5B597B',
    lineHeight: 20,
  },
  bullet: {
    fontSize: 14,
    color: '#5B597B',
    marginBottom: 6,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#8D8AAE',
  },
});
