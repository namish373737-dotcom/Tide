import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

import { AppProvider } from '@/context/AppContext';
import HomeScreen from '@/screens/HomeScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import InsightsScreen from '@/screens/InsightsScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <Text style={styles.iconEmoji}>{emoji}</Text>
  </View>
);

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused }) => {
              let emoji: string;
              switch (route.name) {
                case 'Home': emoji = '🏠'; break;
                case 'History': emoji = '📊'; break;
                case 'Insights': emoji = '💡'; break;
                default: emoji = '📱';
              }
              return <TabIcon emoji={emoji} focused={focused} />;
            },
            tabBarActiveTintColor: '#06b6d4',
            tabBarInactiveTintColor: '#9ca3af',
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabBarLabel,
            headerShown: false,
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Today' }} />
          <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
          <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8, paddingBottom: 8, height: 60 },
  tabBarLabel: { fontSize: 12, fontWeight: '600' },
  iconContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  iconContainerFocused: { backgroundColor: '#f0fdfa' },
  iconEmoji: { fontSize: 18 },
});
