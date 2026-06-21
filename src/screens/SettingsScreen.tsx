import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { useApp } from '@/context/AppContext';

export default function SettingsScreen() {
  const { conditions, currentCondition, setCondition, settings, updateSettings } = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Condition Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Condition</Text>
          <Text style={styles.sectionSubtitle}>Select the condition you're tracking</Text>
          
          <View style={styles.conditionsList}>
            {conditions.map(condition => (
              <TouchableOpacity
                key={condition.id}
                style={[
                  styles.conditionItem,
                  currentCondition?.id === condition.id && styles.conditionItemSelected,
                ]}
                onPress={() => setCondition(condition.id)}
              >
                <View style={styles.conditionInfo}>
                  <Text style={[
                    styles.conditionName,
                    currentCondition?.id === condition.id && styles.conditionNameSelected,
                  ]}>
                    {condition.name}
                  </Text>
                </View>
                {currentCondition?.id === condition.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Data</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Local-First Storage</Text>
              <Text style={styles.settingDescription}>All data stored on your device only</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>No Account Required</Text>
              <Text style={styles.settingDescription}>No signup, no email, no tracking</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Export Data</Text>
              <Text style={styles.settingDescription}>Download your data as JSON or PDF</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Delete All Data</Text>
              <Text style={styles.settingDescription}>Permanently remove all logs</Text>
            </View>
            <Text style={styles.dangerText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About TIDE</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.appName}>TIDE</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.tagline}>Privacy-First Chronic Wellness Tracker</Text>
            
            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>🔒</Text>
                <Text style={styles.featureText}>100% Local Storage</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>🤖</Text>
                <Text style={styles.featureText}>On-Device AI</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>📊</Text>
                <Text style={styles.featureText}>Pattern Recognition</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>📱</Text>
                <Text style={styles.featureText}>No Cloud Sync</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>⚠️ Medical Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            This app does not provide medical advice, diagnosis, or treatment. 
            The information provided is for educational and tracking purposes only. 
            Always seek the advice of a qualified healthcare provider with any questions 
            you may have regarding a medical condition.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for the chronic illness community</Text>
          <Text style={styles.footerText}>Your data belongs to you</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  conditionsList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  conditionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  conditionItemSelected: {
    backgroundColor: '#f0fdfa',
  },
  conditionInfo: {
    flex: 1,
  },
  conditionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  conditionNameSelected: {
    color: '#0891b2',
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  arrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
  dangerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#06b6d4',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  features: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#6b7280',
  },
  disclaimerCard: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  disclaimerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
  },
});
