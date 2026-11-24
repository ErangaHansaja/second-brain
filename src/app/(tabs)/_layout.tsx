import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: styles.header,
        headerTintColor: '#E8EAFF',
        headerTitleStyle: styles.headerTitle,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#7B61FF',
        tabBarInactiveTintColor: '#8B8FA8',
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
    backgroundColor: '#05060F',
    borderBottomColor: '#1E2035',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    color: '#E8EAFF',
    fontWeight: 'bold',
  },
  tabBar: {
    backgroundColor: '#05060F',
    borderTopColor: '#1E2035',
  },
  tabIcon: {
    fontSize: 18,
  },
});
