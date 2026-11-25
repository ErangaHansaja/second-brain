import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'planet' : 'planet-outline'}
              size={size ?? 22}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={size ?? 22}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={size ?? 22}
              color={color as string}
            />
          ),
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
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
