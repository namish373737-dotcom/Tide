import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useApp } from '@/context/AppContext';

export default function HistoryScreen() {
  const { logs } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getLogForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return logs.find(log => log.date === dateStr);
  };

  const getDayColor = (log?: any) => {
    if (!log) return '#f3f4f6';
    const avgSeverity = log.symptoms.reduce((sum: number, s: any) => sum + s.severity, 0) / log.symptoms.length;
    if (avgSeverity >= 4) return '#ef4444';
    if (avgSeverity >= 3) return '#f97316';
    if (avgSeverity >= 2) return '#eab308';
    return '#22c55e';
  };

  const exportData = () => {
    // In a real app, this would generate PDF/JSON
    alert('Export feature coming soon! You can export your data as PDF or JSON to share with your doctor.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <TouchableOpacity style={styles.exportButton} onPress={exportData}>
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}
          >
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{format(selectedMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}
          >
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendar}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.weekdayHeader}>{day}</Text>
          ))}
          
          {daysInMonth.map((day, index) => {
            const log = getLogForDate(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                ]}
                onPress={() => log && alert(`Date: ${format(day, 'MMM d')}\nSymptoms: ${log.symptoms.length}\nTriggers: ${log.triggers.length}`)}
              >
                <Text style={[
                  styles.dayNumber,
                  isToday && styles.todayNumber,
                ]}>
                  {format(day, 'd')}
                </Text>
                {log && (
                  <View style={[
                    styles.dayIndicator,
                    { backgroundColor: getDayColor(log) },
                  ]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Severity Levels</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>Mild</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#eab308' }]} />
              <Text style={styles.legendText}>Moderate</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
              <Text style={styles.legendText}>High</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Severe</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f3f4f6' }]} />
              <Text style={styles.legendText}>No Data</Text>
            </View>
          </View>
        </View>

        {/* Recent Logs List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyText}>No entries yet. Start tracking!</Text>
            </View>
          ) : (
            logs.slice(0, 10).map((log, index) => (
              <View key={log.id} style={[
                styles.logCard,
                index > 0 && styles.logCardNotFirst,
              ]}>
                <View style={styles.logDate}>
                  <Text style={styles.logDateText}>{format(new Date(log.date), 'EEEE, MMM d')}</Text>
                  {log.cycleDay && (
                    <Text style={styles.cycleDay}>Cycle Day {log.cycleDay}</Text>
                  )}
                </View>
                
                <View style={styles.logContent}>
                  <View style={styles.logSection}>
                    <Text style={styles.logSectionTitle}>Symptoms</Text>
                    {log.symptoms.map((symptom: any, i: number) => (
                      <View key={i} style={styles.symptomRow}>
                        <Text style={styles.symptomName}>{symptom.symptomId}</Text>
                        <View style={[
                          styles.severityBadge,
                          { backgroundColor: getDayColor({ symptoms: [symptom] }) },
                        ]}>
                          <Text style={styles.severityValue}>{symptom.severity}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                  
                  {log.triggers.length > 0 && (
                    <View style={styles.logSection}>
                      <Text style={styles.logSectionTitle}>Triggers</Text>
                      <View style={styles.triggersWrap}>
                        {log.triggers.map((trigger: string, i: number) => (
                          <View key={i} style={styles.triggerChip}>
                            <Text style={styles.triggerText}>{trigger}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {log.notes && (
                    <View style={styles.notesSection}>
                      <Text style={styles.notesText}>"{log.notes}"</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  exportButton: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonText: {
    fontSize: 20,
    color: '#06b6d4',
    fontWeight: '700',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  weekdayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  todayCell: {
    backgroundColor: '#f0fdfa',
    borderRadius: 12,
  },
  dayNumber: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  todayNumber: {
    fontWeight: '700',
    color: '#06b6d4',
  },
  dayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legend: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
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
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  logCardNotFirst: {
    marginTop: 12,
  },
  logDate: {
    marginBottom: 12,
  },
  logDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  cycleDay: {
    fontSize: 12,
    color: '#db2777',
    marginTop: 2,
  },
  logContent: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  logSection: {
    marginBottom: 12,
  },
  logSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  symptomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  symptomName: {
    fontSize: 14,
    color: '#374151',
  },
  severityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  triggersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  triggerChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  triggerText: {
    fontSize: 12,
    color: '#6b7280',
  },
  notesSection: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
