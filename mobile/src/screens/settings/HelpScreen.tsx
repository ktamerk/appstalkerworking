import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FAQ = [
  {
    question: 'How do I share my apps?',
    answer:
      'Go to Manage Apps on your profile and toggle which apps are visible. We only share what you approve.',
  },
  {
    question: 'Can I hide specific apps?',
    answer:
      'Yes, any app can be hidden at any time. Hidden apps disappear from your followers immediately.',
  },
  {
    question: 'Who can see my apps?',
    answer:
      'Only followers you approve can see your visible apps. You can remove followers anytime from your profile.',
  },
];

export default function HelpScreen() {
  const openEmail = () => {
    Linking.openURL('mailto:support@appstalker.com?subject=Help Request');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.subtitle}>Answers to common questions and how to reach us.</Text>

      {FAQ.map((item) => (
        <View key={item.question} style={styles.card}>
          <Text style={styles.cardTitle}>{item.question}</Text>
          <Text style={styles.cardBody}>{item.answer}</Text>
        </View>
      ))}

      <View style={styles.supportCard}>
        <View>
          <Text style={styles.supportTitle}>Need more help?</Text>
          <Text style={styles.supportBody}>Reach our support team and we'll respond within 24h.</Text>
        </View>
        <TouchableOpacity style={styles.supportButton} onPress={openEmail}>
          <Ionicons name="mail-outline" size={18} color="#fff" />
          <Text style={styles.supportButtonText}>Email Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FF',
    paddingHorizontal: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F1744',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#7D7AA5',
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1744',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: '#5E5C7E',
    lineHeight: 20,
  },
  supportCard: {
    backgroundColor: '#E7E2FF',
    borderRadius: 22,
    padding: 20,
    marginTop: 20,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1744',
  },
  supportBody: {
    fontSize: 13,
    color: '#5E5C7E',
    marginTop: 4,
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#5D4CE0',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  supportButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
