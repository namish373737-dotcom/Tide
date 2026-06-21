import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useApp } from '@/context/AppContext';
import { DailyCheckIn } from '@/components/DailyCheckIn';

export default function HomeScreen() {
  const { logs, currentCondition, medications } = useApp();
  const [showCheckIn, setShowCheckIn] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLog = logs.find(log => log.date === today);
  
  const symptomCount = todayLog?.symptoms.length || 0;
  const triggerCount = todayLog?.triggers.length || 0;
  const medsTaken = medications.filter(m => {
    // Simple check - in a real app we'd track daily medication logs
    return true;
  }).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Gradient */}
        <LinearGradient
          colors={['#06b6d4', '#0891b2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
            
            {currentCondition && (
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{currentCondition.name}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Check-in Status Card */}
        <View style={styles.checkInCard}>
          <View style={styles.checkInHeader}>
            <View>
              <Text style={styles.checkInTitle}>
                {todayLog ? "Today's Check-in" : 'No Check-in Yet'}
              </Text>
              <Text style={styles.checkInSubtitle}>
                {todayLog 
                  ? `${symptomCount} symptoms • ${triggerCount} triggers logged`
                  : 'Tap below to log how you\'re feeling'}
              </Text>
            </View>
            <View style={[
              styles.statusIndicator,
              todayLog && styles.statusIndicatorComplete,
            ]}>
              {todayLog ? (
                <Text style={styles.statusIcon}>✓</Text>
              ) : (
                <Text style={styles.statusIcon}>○</Text>
              )}
            </View>
          </View>

          {todayLog && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{symptomCount}</Text>
                <Text style={styles.statLabel}>Symptoms</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{triggerCount}</Text>
                <Text style={styles.statLabel}>Triggers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{medsTaken}</Text>
                <Text style={styles.statLabel}>Meds</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.checkInButton, todayLog && styles.checkInButtonUpdate]}
            onPress={() => setShowCheckIn(true)}
          >
            <Text style={styles.checkInButtonText}>
              {todayLog ? 'Update Check-in' : 'Start Check-in'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>No logs yet. Start tracking today!</Text>
            </View>
          ) : (
            logs.slice(0, 5).map((log, index) => (
              <View key={log.id} style={[
                styles.logItem,
                index > 0 && styles.logItemNotFirst,
              ]}>
                <View style={styles.logDateContainer}>
                  <Text style={styles.logDate}>{format(new Date(log.date), 'MMM d')}</Text>
                  <Text style={styles.logDay}>{format(new Date(log.date), 'EEE')}</Text>
                </View>
                <View style={styles.logDetails}>
                  <View style={styles.logSymptoms}>
                    {log.symptoms.slice(0, 3).map((s, i) => (
                      <View key={i} style={styles.symptomDot} />
                    ))}
                    {log.symptoms.length > 3 && (
                      <Text style={styles.moreSymptoms}>+{log.symptoms.length - 3}</Text>
                    )}
                  </View>
                  <Text style={styles.logTriggers}>
                    {log.triggers.length} trigger{log.triggers.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                {log.cycleDay && (
                  <View style={styles.cycleBadge}>
                    <Text style={styles.cycleText}>Day {log.cycleDay}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Medications Section */}
        {medications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Medications</Text>
            <View style={styles.medsCard}>
              {medications.slice(0, 3).map(med => (
                <View key={med.id} style={styles.medItem}>
                  <View style={styles.medDot} />
                  <Text style={styles.medName}>{med.name}</Text>
                  {med.dosage && <Text style={styles.medDosage}>{med.dosage}</Text>}
                </View>
              ))}
              {medications.length > 3 && (
                <Text style={styles.moreMeds}>+{medications.length - 3} more</Text>
              )}
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This app does not provide medical advice. Always consult a healthcare professional.
          </Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <DailyCheckIn visible={showCheckIn} onClose={() => setShowCheckIn(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#ecfdf5',
    marginBottom: 12,
  },
  conditionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  conditionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  checkInCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkInTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  checkInSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicatorComplete: {
    backgroundColor: '#d1fae5',
  },
  statusIcon: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#06b6d4',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  checkInButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkInButtonUpdate: {
    backgroundColor: '#f0fdfa',
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  logItemNotFirst: {
    marginTop: 8,
  },
  logDateContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  logDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  logDay: {
    fontSize: 12,
    color: '#9ca3af',
  },
  logDetails: {
    flex: 1,
  },
  logSymptoms: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  symptomDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06b6d4',
    marginRight: 4,
  },
  moreSymptoms: {
    fontSize: 12,
    color: '#6b7280',
  },
  logTriggers: {
    fontSize: 13,
    color: '#6b7280',
  },
  cycleBadge: {
    backgroundColor: '#fce7f3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cycleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#db2777',
  },
  medsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  medDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 12,
  },
  medName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  medDosage: {
    fontSize: 13,
    color: '#9ca3af',
  },
  moreMeds: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  disclaimer: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
