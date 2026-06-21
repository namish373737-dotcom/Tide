import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Trigger } from '@/types';

interface TriggerSelectorProps {
  triggers: Trigger[];
  selectedTriggers: string[];
  onToggleTrigger: (triggerId: string) => void;
}

export const TriggerSelector: React.FC<TriggerSelectorProps> = ({
  triggers,
  selectedTriggers,
  onToggleTrigger,
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'diet': return '#f0fdfa'; // cyan-50
      case 'sleep': return '#fef2f2'; // red-50
      case 'stress': return '#fff7ed'; // orange-50
      case 'exercise': return '#ecfccb'; // lime-50
      case 'environment': return '#eff6ff'; // blue-50
      case 'medication': return '#faf5ff'; // purple-50
      default: return '#f9fafb';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'diet': return '🍽️';
      case 'sleep': return '😴';
      case 'stress': return '😰';
      case 'exercise': return '🏃';
      case 'environment': return '🌤️';
      case 'medication': return '💊';
      default: return '📌';
    }
  };

  const groupedTriggers = triggers.reduce((acc, trigger) => {
    if (!acc[trigger.category]) {
      acc[trigger.category] = [];
    }
    acc[trigger.category].push(trigger);
    return acc;
  }, {} as Record<string, Trigger[]>);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Any triggers today?</Text>
      <Text style={styles.subtitle}>Select all that apply</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {Object.entries(groupedTriggers).map(([category, categoryTriggers]) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              { backgroundColor: getCategoryColor(category) },
            ]}
          >
            <Text style={styles.categoryChipEmoji}>{getCategoryIcon(category)}</Text>
            <Text style={styles.categoryChipText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.triggersGrid}>
        {triggers.map((trigger) => {
          const isSelected = selectedTriggers.includes(trigger.id);
          return (
            <TouchableOpacity
              key={trigger.id}
              style={[
                styles.triggerButton,
                isSelected && styles.triggerButtonSelected,
                { borderColor: getCategoryColor(trigger.category) },
              ]}
              onPress={() => onToggleTrigger(trigger.id)}
            >
              <Text style={styles.triggerEmoji}>{getCategoryIcon(trigger.category)}</Text>
              <Text style={[
                styles.triggerName,
                isSelected && styles.triggerNameSelected,
              ]}>
                {trigger.name}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  triggersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerButton: {
    width: '31%',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    position: 'relative',
  },
  triggerButtonSelected: {
    backgroundColor: '#f0fdfa',
    borderColor: '#06b6d4',
  },
  triggerEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  triggerName: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  triggerNameSelected: {
    color: '#0891b2',
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
});
