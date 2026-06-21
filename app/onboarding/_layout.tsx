import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="conditions" />
      <Stack.Screen name="symptoms" />
      <Stack.Screen name="triggers" />
    </Stack>
  );
}
