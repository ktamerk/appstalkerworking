import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoOuter}>
          <View style={styles.gridRow}>
            <View style={styles.gridDot} />
            <View style={styles.gridDot} />
          </View>
          <View style={[styles.gridRow, styles.gridRowLast]}>
            <View style={styles.gridDot} />
            <View style={styles.gridDot} />
          </View>
        </View>
        <Text style={styles.title}>Appstalker</Text>
        <Text style={styles.subtitle}>Discover apps. Share your stack.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoOuter: {
    width: 112,
    height: 112,
    borderRadius: 32,
    backgroundColor: '#2F3BA5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 64,
    marginBottom: 14,
  },
  gridRowLast: {
    marginBottom: 0,
  },
  gridDot: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2A66',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#5B5E7E',
    textAlign: 'center',
  },
});
