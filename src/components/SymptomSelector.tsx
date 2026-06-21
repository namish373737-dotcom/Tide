import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Symptom } from '@/types';

interface SymptomSelectorProps {
  symptoms: Symptom[];
  selectedSymptoms: Record<string, number>;
  onToggleSymptom: (symptomId: string, severity: number) => void;
}

export const SymptomSelector: React.FC<SymptomSelectorProps> = ({
  symptoms,
  selectedSymptoms,
  onToggleSymptom,
}) => {
  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return '#22c55e'; // Green
      case 2: return '#84cc16'; // Light green
      case 3: return '#eab308'; // Yellow
      case 4: return '#f97316'; // Orange
      case 5: return '#ef4444'; // Red
      default: return '#e5e7eb'; // Gray
    }
  };

  const handleSeverityPress = (symptomId: string, severity: number) => {
    if (selectedSymptoms[symptomId] === severity) {
      onToggleSymptom(symptomId, 0); // Deselect
    } else {
      onToggleSymptom(symptomId, severity);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
      <Text style={styles.subtitle}>Tap to rate severity (1-5)</Text>
      
      {symptoms.map((symptom) => (
        <View key={symptom.id} style={styles.symptomRow}>
          <View style={styles.symptomInfo}>
            <Text style={styles.symptomName}>{symptom.name}</Text>
            <Text style={styles.symptomCategory}>{symptom.category}</Text>
          </View>
          
          <View style={styles.severityContainer}>
            {[1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.severityButton,
                  { backgroundColor: getSeverityColor(level) },
                  selectedSymptoms[symptom.id] === level && styles.severityButtonSelected,
                ]}
                onPress={() => handleSeverityPress(symptom.id, level)}
              >
                <Text style={[
                  styles.severityText,
                  selectedSymptoms[symptom.id] === level && styles.severityTextSelected,
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Severity:</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Mild</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#eab308' }]} />
          <Text style={styles.legendText}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Severe</Text>
        </View>
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
  symptomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  symptomInfo: {
    flex: 1,
  },
  symptomName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  symptomCategory: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  severityContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  severityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  severityButtonSelected: {
    borderColor: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  severityTextSelected: {
    color: '#1f2937',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  legendLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
