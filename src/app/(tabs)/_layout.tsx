import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Colors } from '@/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: styles.header,
        headerTintColor: Colors.text.primary,
        headerTitleStyle: styles.headerTitle,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.tier.core,
        tabBarInactiveTintColor: Colors.text.muted,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🪐</Text>,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🔍</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.bg.void,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
  tabBar: {
    backgroundColor: Colors.bg.void,
    borderTopColor: Colors.border.subtle,
  },
  tabIcon: {
    fontSize: 18,
  },
});
