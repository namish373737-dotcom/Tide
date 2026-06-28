import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { router } from 'expo-router';
import { X, Check, Sparkles, FileText, Brain, Pill, Infinity as InfinityIcon } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';
import { useRevenueCat } from '@/lib/subscriptions';
import { hapticSuccess, hapticSelection } from '@/lib/haptics';
import { APP_NAME } from '@/lib/constants';

const PERKS = [
  { icon: Brain, title: 'AI Pattern Insights', description: 'Discover hidden correlations between symptoms, triggers, and your cycle' },
  { icon: FileText, title: 'Doctor-Ready PDF Reports', description: 'Export 30/60/90-day reports with charts for your appointments' },
  { icon: Pill, title: 'Unlimited Medication Tracking', description: 'Track every medication, supplement, and dose with adherence history' },
  { icon: InfinityIcon, title: 'Unlimited Symptoms & History', description: 'No caps on what you track or how far back you can look' },
];

export default function PaywallScreen() {
  const { purchase, restore, loading } = useRevenueCat();
  const [plan, setPlan] = useState<'annual' | 'monthly'>('annual');
  const [busy, setBusy] = useState(false);

  const handlePurchase = async () => {
    setBusy(true);
    const result = await purchase(plan === 'annual' ? 'pro_annual' : 'pro_monthly');
    setBusy(false);
    if (result.success) {
      hapticSuccess();
      router.back();
    } else if (!result.cancelled) {
      Alert.alert(
        'Purchase Unavailable',
        'Subscriptions aren\'t available in this build yet. Check back soon!'
      );
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    const result = await restore();
    setBusy(false);
    if (result.success) {
      hapticSuccess();
      Alert.alert('Restored', 'Your Pro subscription has been restored.');
      router.back();
    } else {
      Alert.alert('Nothing to Restore', 'We couldn\'t find an active subscription for this device.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={COLORS.textSecondary} />
        </Pressable>

        <View style={styles.heroIcon}>
          <Sparkles size={32} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>{APP_NAME} Pro</Text>
        <Text style={styles.subtitle}>Understand your body, on your terms — your data never leaves this device.</Text>

        <View style={styles.perks}>
          {PERKS.map((perk, i) => (
            <View key={i} style={styles.perkRow}>
              <View style={styles.perkIcon}>
                <perk.icon size={18} color={COLORS.primary} />
              </View>
              <View style={styles.perkText}>
                <Text style={styles.perkTitle}>{perk.title}</Text>
                <Text style={styles.perkDescription}>{perk.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          <Pressable
            onPress={() => { hapticSelection(); setPlan('annual'); }}
            style={[styles.planCard, plan === 'annual' && styles.planCardActive]}
          >
            <View style={styles.planBadge}><Text style={styles.planBadgeText}>SAVE 50%</Text></View>
            <Text style={styles.planLabel}>Annual</Text>
            <Text style={styles.planPrice}>$29.99<Text style={styles.planPer}>/yr</Text></Text>
            <Text style={styles.planSub}>$2.50/mo</Text>
            {plan === 'annual' && <Check size={18} color={COLORS.primary} style={styles.planCheck} />}
          </Pressable>
          <Pressable
            onPress={() => { hapticSelection(); setPlan('monthly'); }}
            style={[styles.planCard, plan === 'monthly' && styles.planCardActive]}
          >
            <Text style={styles.planLabel}>Monthly</Text>
            <Text style={styles.planPrice}>$4.99<Text style={styles.planPer}>/mo</Text></Text>
            <Text style={styles.planSub}>Billed monthly</Text>
            {plan === 'monthly' && <Check size={18} color={COLORS.primary} style={styles.planCheck} />}
          </Pressable>
        </View>

        <Pressable
          onPress={handlePurchase}
          disabled={busy || loading}
          style={({ pressed }) => [styles.purchaseButton, pressed && styles.purchaseButtonPressed, (busy || loading) && styles.purchaseButtonDisabled]}
        >
          <Text style={styles.purchaseButtonText}>{busy ? 'Processing…' : `Start ${plan === 'annual' ? 'Annual' : 'Monthly'} Plan`}</Text>
        </Pressable>

        <Pressable onPress={handleRestore} disabled={busy} style={styles.restoreButton}>
          <Text style={styles.restoreButtonText}>Restore Purchase</Text>
        </Pressable>

        <Text style={styles.legalText}>
          Solace Pro is an auto-renewable subscription. $4.99/month or $29.99/year. Payment will be charged to your Apple Account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Cancel anytime in your Apple ID settings.
        </Text>

        <Text style={styles.disclaimer}>No medical claims are made — {APP_NAME} is a self-tracking wellness tool, not a diagnostic device.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: LAYOUT.screenPadding, paddingTop: LAYOUT.safeTop, paddingBottom: LAYOUT.safeBottom + SPACING.xl },
  closeButton: { alignSelf: 'flex-end', padding: SPACING.sm, marginBottom: SPACING.sm },
  heroIcon: { width: 64, height: 64, borderRadius: RADIUS.full, backgroundColor: 'rgba(155, 89, 182, 0.1)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: SPACING.lg },
  title: { ...TYPOGRAPHY.h1, color: COLORS.text, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING['2xl'], lineHeight: 24, paddingHorizontal: SPACING.md },
  perks: { gap: SPACING.lg, marginBottom: SPACING['2xl'] },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start' },
  perkIcon: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: 'rgba(13, 115, 119, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  perkText: { flex: 1 },
  perkTitle: { ...TYPOGRAPHY.label, color: COLORS.text, marginBottom: 2 },
  perkDescription: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, lineHeight: 20 },
  plans: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  planCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1.5, borderColor: COLORS.border, ...SHADOWS.sm },
  planCardActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(13, 115, 119, 0.05)' },
  planBadge: { position: 'absolute', top: -10, right: SPACING.md, backgroundColor: COLORS.secondary, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  planBadgeText: { ...TYPOGRAPHY.caption, color: COLORS.white, fontWeight: '700' },
  planLabel: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  planPrice: { ...TYPOGRAPHY.h2, color: COLORS.text },
  planPer: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  planSub: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginTop: SPACING.xs },
  planCheck: { position: 'absolute', bottom: SPACING.md, right: SPACING.md },
  purchaseButton: { height: LAYOUT.buttonHeight, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md, ...SHADOWS.md },
  purchaseButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  purchaseButtonDisabled: { opacity: 0.6 },
  purchaseButtonText: { ...TYPOGRAPHY.button, color: COLORS.white },
  restoreButton: { alignItems: 'center', paddingVertical: SPACING.sm, marginBottom: SPACING.lg },
  restoreButtonText: { ...TYPOGRAPHY.bodySmall, color: COLORS.primary },
  disclaimer: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 18 },
  legalText: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 18, marginBottom: SPACING.md },
});
