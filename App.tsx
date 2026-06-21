import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AppProvider } from '@/context/AppContext';
import HomeScreen from '@/screens/HomeScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import InsightsScreen from '@/screens/InsightsScreen';
import SettingsScreen from '@/screens/SettingsScreen';

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
                case 'Settings': emoji = '⚙️'; break;
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
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: { 
    backgroundColor: '#ffffff', 
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb', 
    paddingTop: 8, 
    paddingBottom: 8, 
    height: 65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarLabel: { fontSize: 11, fontWeight: '600' },
  iconContainer: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'transparent',
  },
  iconContainerFocused: { 
    backgroundColor: '#ecfdf5',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  iconEmoji: { fontSize: 20 },
});
