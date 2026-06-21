import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useApp } from '@/context/AppContext';
import { InsightsList } from '@/components/InsightsList';

export default function InsightsScreen() {
  const { insights, currentCondition } = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>AI-powered patterns from your data</Text>
        </View>

        {/* Condition Info */}
        {currentCondition && (
          <View style={styles.conditionCard}>
            <Text style={styles.conditionLabel}>Tracking for</Text>
            <Text style={styles.conditionName}>{currentCondition.name}</Text>
            <Text style={styles.conditionInfo}>
              Personalized symptom pack with {JSON.parse(currentCondition.symptomPack).length} symptoms
            </Text>
          </View>
        )}

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{insights.length}</Text>
            <Text style={styles.statLabel}>Patterns Found</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {insights.filter(i => i.confidence >= 0.7).length}
            </Text>
            <Text style={styles.statLabel}>High Confidence</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {insights.reduce((sum, i) => sum + i.dataPoints, 0)}
            </Text>
            <Text style={styles.statLabel}>Data Points</Text>
          </View>
        </View>

        {/* Insights List */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Your Patterns</Text>
          <InsightsList insights={insights} />
        </View>

        {/* Educational Content */}
        <View style={styles.educationCard}>
          <Text style={styles.educationTitle}>💡 How Insights Work</Text>
          <Text style={styles.educationText}>
            Our on-device AI analyzes correlations between your logged symptoms and triggers. 
            The more you log, the better the patterns become!
          </Text>
          <Text style={styles.educationTip}>
            Tip: Log consistently for at least 7 days to start seeing meaningful insights.
          </Text>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>🔒 Privacy First</Text>
          <Text style={styles.privacyText}>
            All analysis happens on your device. Your health data never leaves your phone 
            unless you choose to export it.
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ These insights are for informational purposes only and do not constitute 
            medical advice. Always consult with a healthcare professional for medical guidance.
          </Text>
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
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 4,
  },
  conditionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  conditionLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  conditionName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  conditionInfo: {
    fontSize: 13,
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#06b6d4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  insightsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  educationCard: {
    backgroundColor: '#ecfdf5',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 8,
  },
  educationText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
    marginBottom: 8,
  },
  educationTip: {
    fontSize: 13,
    color: '#059669',
    fontStyle: 'italic',
  },
  privacyCard: {
    backgroundColor: '#eff6ff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    color: '#3b82f6',
    lineHeight: 20,
  },
  disclaimer: {
    marginHorizontal: 16,
    padding: 16,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
});
