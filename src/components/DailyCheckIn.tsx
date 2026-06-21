import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { format } from 'date-fns';
import { useApp } from '@/context/AppContext';
import { SymptomSelector } from './SymptomSelector';
import { TriggerSelector } from './TriggerSelector';
import { SYMPTOM_PACKS, COMMON_TRIGGERS, LogSymptom, LogMedication } from '@/types';

interface DailyCheckInProps {
  visible: boolean;
  onClose: () => void;
}

export const DailyCheckIn: React.FC<DailyCheckInProps> = ({ visible, onClose }) => {
  const { currentCondition, addLog, medications } = useApp();
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, number>>({});
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [medicationStates, setMedicationStates] = useState<Record<string, boolean>>({});
  const [cycleDay, setCycleDay] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);

  const symptoms = currentCondition 
    ? JSON.parse(currentCondition.symptomPack) 
    : SYMPTOM_PACKS.endometriosis;
  
  const triggers = currentCondition 
    ? JSON.parse(currentCondition.triggerPack) 
    : COMMON_TRIGGERS;

  const handleToggleSymptom = (symptomId: string, severity: number) => {
    setSelectedSymptoms(prev => {
      const updated = { ...prev };
      if (severity === 0) {
        delete updated[symptomId];
      } else {
        updated[symptomId] = severity;
      }
      return updated;
    });
  };

  const handleToggleTrigger = (triggerId: string) => {
    setSelectedTriggers(prev => 
      prev.includes(triggerId) 
        ? prev.filter(id => id !== triggerId)
        : [...prev, triggerId]
    );
  };

  const handleToggleMedication = (medId: string) => {
    setMedicationStates(prev => ({
      ...prev,
      [medId]: !prev[medId],
    }));
  };

  const handleSubmit = async () => {
    const symptomsArray: LogSymptom[] = Object.entries(selectedSymptoms).map(([symptomId, severity]) => ({
      symptomId,
      severity,
    }));

    const medicationsArray: LogMedication[] = medications.map(med => ({
      medicationId: med.id,
      name: med.name,
      dosage: med.dosage,
      taken: medicationStates[med.id] || false,
    }));

    await addLog({
      date: format(new Date(), 'yyyy-MM-dd'),
      symptoms: symptomsArray,
      triggers: selectedTriggers,
      medications: medicationsArray,
      cycleDay: cycleDay ? parseInt(cycleDay) : undefined,
      notes: notes || undefined,
    });

    // Reset form
    setSelectedSymptoms({});
    setSelectedTriggers([]);
    setMedicationStates({});
    setCycleDay('');
    setNotes('');
    setStep(1);
    onClose();
  };

  const totalSteps = 4;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Check-in</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                index < step && styles.progressSegmentActive,
                index === 0 && styles.progressSegmentFirst,
                index === totalSteps - 1 && styles.progressSegmentLast,
              ]}
            />
          ))}
        </View>

        <Text style={styles.stepIndicator}>Step {step} of {totalSteps}</Text>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 && (
            <SymptomSelector
              symptoms={symptoms}
              selectedSymptoms={selectedSymptoms}
              onToggleSymptom={handleToggleSymptom}
            />
          )}

          {step === 2 && (
            <TriggerSelector
              triggers={triggers}
              selectedTriggers={selectedTriggers}
              onToggleTrigger={handleToggleTrigger}
            />
          )}

          {step === 3 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medications</Text>
              <Text style={styles.sectionSubtitle}>Mark what you've taken today</Text>
              
              {medications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateEmoji}>💊</Text>
                  <Text style={styles.emptyStateText}>No medications added yet</Text>
                </View>
              ) : (
                medications.map(med => (
                  <TouchableOpacity
                    key={med.id}
                    style={[
                      styles.medicationItem,
                      medicationStates[med.id] && styles.medicationItemSelected,
                    ]}
                    onPress={() => handleToggleMedication(med.id)}
                  >
                    <View style={styles.medicationInfo}>
                      <Text style={[
                        styles.medicationName,
                        medicationStates[med.id] && styles.medicationNameSelected,
                      ]}>
                        {med.name}
                      </Text>
                      {med.dosage && (
                        <Text style={styles.medicationDosage}>{med.dosage}</Text>
                      )}
                    </View>
                    <View style={[
                      styles.checkbox,
                      medicationStates[med.id] && styles.checkboxSelected,
                    ]}>
                      {medicationStates[med.id] && (
                        <Text style={styles.checkmarkText}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {step === 4 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Info</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cycle Day (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 14"
                  keyboardType="number-pad"
                  value={cycleDay}
                  onChangeText={setCycleDay}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="How are you feeling? Any other observations?"
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Today's Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Symptoms:</Text>
                  <Text style={styles.summaryValue}>{Object.keys(selectedSymptoms).length} logged</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Triggers:</Text>
                  <Text style={styles.summaryValue}>{selectedTriggers.length} selected</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Medications:</Text>
                  <Text style={styles.summaryValue}>
                    {Object.values(medicationStates).filter(Boolean).length} of {medications.length} taken
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          {step < totalSteps ? (
            <TouchableOpacity
              style={[styles.nextButton, step === 1 && Object.keys(selectedSymptoms).length === 0 && styles.buttonDisabled]}
              onPress={() => setStep(step + 1)}
              disabled={step === 1 && Object.keys(selectedSymptoms).length === 0}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Complete Check-in</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerRight: {
    width: 36,
  },
  progressBar: {
    flexDirection: 'row',
    height: 4,
    marginHorizontal: 16,
    marginTop: 16,
  },
  progressSegment: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#06b6d4',
  },
  progressSegmentFirst: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  progressSegmentLast: {
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  stepIndicator: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  medicationItemSelected: {
    backgroundColor: '#f0fdfa',
    borderColor: '#06b6d4',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  medicationNameSelected: {
    color: '#0891b2',
  },
  medicationDosage: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#06b6d4',
    borderColor: '#06b6d4',
  },
  checkmarkText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
