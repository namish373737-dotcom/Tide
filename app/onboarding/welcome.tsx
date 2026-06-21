import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Heart, Lock, Shield, Sparkles } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Heart size={40} color={COLORS.white} strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>Welcome to Tide</Text>
          <Text style={styles.subtitle}>
            The chronic wellness tracker built for you — not your data.
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          <FeatureCard
            icon={<Lock size={22} color={COLORS.primary} strokeWidth={2} />}
            title="Your data stays on your phone"
            description="No accounts. No servers. No cloud. Your health information is yours alone."
          />
          <FeatureCard
            icon={<Sparkles size={22} color={COLORS.primary} strokeWidth={2} />}
            title="Built for your condition"
            description="Endometriosis, PCOS, PMDD, and more — not a generic health app."
          />
          <FeatureCard
            icon={<Shield size={22} color={COLORS.primary} strokeWidth={2} />}
            title="Find your patterns"
            description="See what triggers your symptoms and what helps — all on your device."
          />
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <Pressable
          onPress={() => router.push('/onboarding/conditions')}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
        <Text style={styles.footerText}>
          By continuing, you agree to our Privacy Policy
        </Text>
      </View>
    </View>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>{icon}</View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: LAYOUT.safeTop + SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 26,
  },
  featuresSection: {
    gap: SPACING.base,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: LAYOUT.safeBottom + SPACING.base,
    paddingTop: SPACING.base,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  button: {
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    ...TYPOGRAPHY.buttonLarge,
    color: COLORS.white,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
