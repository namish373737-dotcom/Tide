import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar, Linking } from 'react-native';
import { router } from 'expo-router';
import { Heart, Lock, Shield, Sparkles, ChevronRight } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Soft gradient background */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Logo with glow effect */}
        <View style={styles.logoSection}>
          <View style={styles.logoOuter}>
            <View style={styles.logoContainer}>
              <Heart size={44} color={COLORS.white} strokeWidth={2} fill={COLORS.white} />
            </View>
          </View>
          <Text style={styles.tagline}>SOLACE</Text>
          <Text style={styles.title}>Your health journey,{'\n'}privately tracked</Text>
          <Text style={styles.subtitle}>
            Built for people living with endometriosis, PCOS, and chronic pain. 
            Your data never leaves your phone.
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          <FeatureCard
            icon={<Lock size={20} color={COLORS.primary} strokeWidth={2} />}
            title="Completely Private"
            description="No accounts. No cloud. No data sharing. Your health information stays on your device, always."
          />
          <FeatureCard
            icon={<Shield size={20} color={COLORS.primary} strokeWidth={2} />}
            title="Built for Your Condition"
            description="Endometriosis, PCOS, PMDD, fibromyalgia — not a generic health app. We understand your symptoms."
          />
          <FeatureCard
            icon={<Sparkles size={20} color={COLORS.primary} strokeWidth={2} />}
            title="Find Your Patterns"
            description="Discover what triggers your symptoms and what helps. Take control of your health with data that speaks for you."
          />
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <Pressable
          onPress={() => router.push('/onboarding/conditions')}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <ChevronRight size={20} color={COLORS.white} strokeWidth={2.5} />
        </Pressable>
        <Pressable onPress={() => Linking.openURL('https://solaceapp.co/privacy')}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Privacy Policy
          </Text>
        </Pressable>
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
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(13, 115, 119, 0.04)',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(155, 89, 182, 0.03)',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: LAYOUT.safeTop + SPACING['2xl'],
    paddingBottom: SPACING.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  logoOuter: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    width: 72,
    height: 72,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 42,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 26,
  },
  featuresSection: {
    gap: SPACING.md,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
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
    backgroundColor: 'rgba(250, 251, 252, 0.9)',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  button: {
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  buttonPressed: {
    opacity: 0.9,
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