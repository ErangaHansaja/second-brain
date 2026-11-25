import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DatabaseProvider } from '@/components/providers/DatabaseProvider';
import { Colors } from '@/theme/tokens';

const ObsidianTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.tier.core,
    background: Colors.bg.void,
    card: Colors.bg.void,
    text: Colors.text.primary,
    border: Colors.border.subtle,
    notification: Colors.tier.core,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg.void }}>
      <ThemeProvider value={ObsidianTheme}>
        <DatabaseProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.bg.void },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </DatabaseProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
