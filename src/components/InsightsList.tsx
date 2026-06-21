import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Insight } from '@/types';

interface InsightsListProps {
  insights: Insight[];
}

export const InsightsList: React.FC<InsightsListProps> = ({ insights }) => {
  if (insights.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>💡</Text>
        <Text style={styles.emptyTitle}>No insights yet</Text>
        <Text style={styles.emptySubtitle}>
          Keep logging your symptoms and triggers. We'll analyze patterns after a few days of data.
        </Text>
      </View>
    );
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return '#10b981'; // Green
    if (confidence >= 0.4) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'correlation': return '🔗';
      case 'pattern': return '📈';
      case 'trend': return '📊';
      default: return '✨';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {insights.map((insight, index) => (
        <View key={insight.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.typeIcon}>{getTypeIcon(insight.type)}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{insight.type}</Text>
            </View>
          </View>
          
          <Text style={styles.title}>{insight.title}</Text>
          <Text style={styles.description}>{insight.description}</Text>
          
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <View style={[styles.confidenceBar, { width: `${insight.confidence * 100}%` }]} />
              <Text style={[
                styles.confidenceText,
                { color: getConfidenceColor(insight.confidence) },
              ]}>
                {(insight.confidence * 100).toFixed(0)}% confidence
              </Text>
            </View>
            
            <View style={styles.dataPoints}>
              <Text style={styles.dataPointsLabel}>Based on</Text>
              <Text style={styles.dataPointsValue}>{insight.dataPoints} entries</Text>
            </View>
          </View>
        </View>
      ))}
      
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ These insights are for informational purposes only and do not constitute medical advice. 
          Always consult with a healthcare professional for medical guidance.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0891b2',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  metric: {
    flex: 1,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dataPoints: {
    alignItems: 'flex-end',
  },
  dataPointsLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  dataPointsValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  disclaimer: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
});
